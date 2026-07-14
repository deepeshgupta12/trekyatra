import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchCMSPage, fetchCMSPages, type CMSPage } from "@/lib/api";
import Breadcrumb from "@/components/content/Breadcrumb";
import SchemaInjector from "@/components/seo/SchemaInjector";
import { buildArticleSchema, buildBreadcrumbSchema } from "@/lib/schema";
import { ArrowRight, Trophy, Sparkles } from "lucide-react";

// Clean, SEO+AEO comparison page (#8 / Step 81). Server-rendered from the
// `comparison` CMS page auto-created by the publish-triggered comparison agent.
// Slug is canonical `{a}-vs-{b}` (alphabetical), so it de-dupes both orderings.

export const revalidate = 3600;

interface TrekSide {
  slug: string;
  name: string;
  image: string;
  state: string;
  region: string;
  difficulty: string;
  duration: string;
  season: string;
  altitude_label: string;
  permit_label: string;
  budget_label: string;
  description: string;
}
interface ComparisonRow { label: string; a: string; b: string }
interface ComparisonPayload {
  trek_a: TrekSide;
  trek_b: TrekSide;
  rows: ComparisonRow[];
  verdict: { picks: Record<string, string>; summary: string };
}

function getComparison(page: CMSPage): ComparisonPayload | null {
  const c = (page.content_json as { comparison?: ComparisonPayload } | null)?.comparison;
  return c && c.trek_a && c.trek_b ? c : null;
}

async function loadPage(pair: string): Promise<CMSPage | null> {
  try {
    const page = await fetchCMSPage(pair);
    if (page.status === "published" && page.page_type === "comparison") return page;
  } catch { /* not found */ }
  return null;
}

export async function generateStaticParams() {
  try {
    const pages = await fetchCMSPages({ page_type: "comparison", status: "published", limit: 500 });
    return pages.map((p) => ({ pair: p.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: { pair: string } }): Promise<Metadata> {
  const page = await loadPage(params.pair);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trekyatra.com";
  const canonical = `${siteUrl}/compare/${params.pair}`;
  if (!page) {
    return { title: "Trek comparison | TrekYatra", alternates: { canonical } };
  }
  const title = page.seo_title ?? `${page.title} | TrekYatra`;
  const description = page.seo_description ?? "Compare two Himalayan treks side by side.";
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      images: page.hero_image_url ? [{ url: page.hero_image_url }] : undefined,
    },
    twitter: { card: "summary_large_image", title, description },
  };
}

function TrekColumn({ trek, badge }: { trek: TrekSide; badge?: string }) {
  return (
    <Link
      href={`/trek/${trek.slug}`}
      className="group relative block overflow-hidden rounded-2xl border border-border bg-card lift"
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={trek.image}
          alt={trek.name}
          loading="lazy"
          width={600}
          height={400}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/70 to-transparent" />
        {badge && (
          <div className="absolute top-3 left-3 flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
            <Trophy className="h-3 w-3" /> {badge}
          </div>
        )}
        <h2 className="absolute bottom-3 left-4 right-4 font-display text-xl font-semibold text-surface">
          {trek.name}
        </h2>
      </div>
      <div className="flex items-center justify-between px-4 py-3 text-sm">
        <span className="text-muted-foreground">{trek.state || trek.region}</span>
        <span className="flex items-center gap-1 font-medium text-accent">
          View trek <ArrowRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </Link>
  );
}

export default async function ComparePairPage({ params }: { params: { pair: string } }) {
  const page = await loadPage(params.pair);
  if (!page) notFound();
  const comparison = getComparison(page);
  if (!comparison) notFound();

  const { trek_a: a, trek_b: b, rows, verdict } = comparison;
  const beginnerPick = verdict.picks?.beginner;

  const breadcrumbSchema = buildBreadcrumbSchema([
    { label: "Home", href: "/" },
    { label: "Compare", href: "/compare" },
    { label: `${a.name} vs ${b.name}` },
  ]);
  const articleSchema = buildArticleSchema({
    title: page.seo_title ?? page.title,
    description: page.seo_description ?? "",
    url: `/compare/${params.pair}`,
    publishedAt: page.published_at ?? undefined,
    updatedAt: page.updated_at ?? undefined,
  });

  return (
    <>
      <SchemaInjector schemas={[breadcrumbSchema, articleSchema]} />

      <section className="border-b border-border bg-gradient-to-br from-background to-accent/5 py-12">
        <div className="container-wide max-w-4xl">
          <Breadcrumb items={[{ label: "Compare", href: "/compare" }, { label: `${a.name} vs ${b.name}` }]} />
          <h1 className="mt-5 font-display text-3xl font-semibold leading-tight md:text-4xl">
            {a.name} <span className="text-accent">vs</span> {b.name}
          </h1>
          {page.seo_description && (
            <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{page.seo_description}</p>
          )}
        </div>
      </section>

      <section className="py-10">
        <div className="container-wide max-w-4xl space-y-10">
          {/* Two trek columns */}
          <div className="grid gap-4 sm:grid-cols-2">
            <TrekColumn trek={a} badge={beginnerPick === a.slug ? "Best for beginners" : undefined} />
            <TrekColumn trek={b} badge={beginnerPick === b.slug ? "Best for beginners" : undefined} />
          </div>

          {/* Verdict */}
          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <h2 className="font-display text-lg font-semibold">Our verdict</h2>
            </div>
            <p className="text-muted-foreground">{verdict.summary}</p>
          </div>

          {/* Comparison table */}
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[420px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Feature
                  </th>
                  <th className="px-4 py-3 text-left font-semibold">{a.name}</th>
                  <th className="px-4 py-3 text-left font-semibold">{b.name}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.label} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {row.label}
                    </td>
                    <td className="px-4 py-3 font-medium">{row.a}</td>
                    <td className="px-4 py-3 font-medium">{row.b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* CTAs */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href={`/trek/${a.slug}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 font-medium text-background transition-opacity hover:opacity-90"
            >
              Explore {a.name} <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href={`/trek/${b.slug}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-foreground px-5 py-3 font-medium text-background transition-opacity hover:opacity-90"
            >
              Explore {b.name} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="text-center">
            <Link href="/compare" className="text-sm font-medium text-accent hover:underline">
              ← Compare other treks
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
