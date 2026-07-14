import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fetchComparisonPair, fetchComparisonPairs, type ComparisonDetail } from "@/lib/api";
import Breadcrumb from "@/components/content/Breadcrumb";
import SchemaInjector from "@/components/seo/SchemaInjector";
import { buildArticleSchema, buildBreadcrumbSchema } from "@/lib/schema";
import { ArrowRight, Trophy, Sparkles } from "lucide-react";

// Clean, SEO+AEO comparison page (#8 / Step 81). Served LIVE from the two trek_guide
// pages' data via GET /public/comparisons/{pair} — no page_type="comparison" CMS page.
// Only pairs the comparison agent registered (trek_comparisons table) resolve; others 404.

export const revalidate = 3600;

async function loadPair(pair: string): Promise<ComparisonDetail | null> {
  try {
    return await fetchComparisonPair(pair);
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  try {
    const pairs = await fetchComparisonPairs(500);
    return pairs.map((p) => ({ pair: p.pair_slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: { params: { pair: string } }): Promise<Metadata> {
  const data = await loadPair(params.pair);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trekyatra.com";
  const canonical = `${siteUrl}/compare/${params.pair}`;
  if (!data) return { title: "Trek comparison | TrekYatra", alternates: { canonical } };
  return {
    title: data.seo_title,
    description: data.seo_description,
    alternates: { canonical },
    openGraph: {
      title: data.seo_title,
      description: data.seo_description,
      url: canonical,
      type: "article",
      images: data.hero_image_url ? [{ url: data.hero_image_url }] : undefined,
    },
    twitter: { card: "summary_large_image", title: data.seo_title, description: data.seo_description },
  };
}

function TrekColumn({ trek, badge }: { trek: ComparisonDetail["trek_a"]; badge?: string }) {
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
  const data = await loadPair(params.pair);
  if (!data) notFound();

  const { trek_a: a, trek_b: b, rows, verdict } = data;
  const beginnerPick = verdict.picks?.beginner;

  const breadcrumbSchema = buildBreadcrumbSchema([
    { label: "Home", href: "/" },
    { label: "Compare", href: "/compare" },
    { label: `${a.name} vs ${b.name}` },
  ]);
  const articleSchema = buildArticleSchema({
    title: data.seo_title,
    description: data.seo_description,
    url: `/compare/${params.pair}`,
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
          {data.seo_description && (
            <p className="mt-3 max-w-2xl text-lg text-muted-foreground">{data.seo_description}</p>
          )}
        </div>
      </section>

      <section className="py-10">
        <div className="container-wide max-w-4xl space-y-10">
          <div className="grid gap-4 sm:grid-cols-2">
            <TrekColumn trek={a} badge={beginnerPick === a.slug ? "Best for beginners" : undefined} />
            <TrekColumn trek={b} badge={beginnerPick === b.slug ? "Best for beginners" : undefined} />
          </div>

          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-5">
            <div className="mb-2 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-accent" />
              <h2 className="font-display text-lg font-semibold">Our verdict</h2>
            </div>
            <p className="text-muted-foreground">{verdict.summary}</p>
          </div>

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
