import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mountain, MapPin, CheckCircle2, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchCMSPage, fetchClusterTreks } from "@/lib/api";
import { getCategoryContent } from "@/lib/category-content";
import { cmsPageToTrek } from "@/lib/trek-utils";
import { TrekCard } from "@/components/trek/TrekCard";
import SchemaInjector from "@/components/seo/SchemaInjector";
import { buildBreadcrumbSchema, buildFAQSchema, buildItemListSchema } from "@/lib/schema";
import FAQAccordion, { type FAQItem } from "@/components/content/FAQAccordion";
import AffiliateDisclosure from "@/components/content/AffiliateDisclosure";

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return ["beginner-friendly-treks", "weekend-treks", "high-altitude-treks", "lake-treks", "snow-treks", "family-treks"].map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";
  const c = getCategoryContent(params.slug);
  if (!c) return {};
  let cmsPage = null;
  try {
    cmsPage = await fetchCMSPage(`trek-types/${params.slug}`);
  } catch {
    // code-first
  }
  return {
    title: cmsPage?.seo_title ?? `${c.title} — Routes, Regions & Tips | TrekYatra`,
    description: cmsPage?.seo_description ?? c.intro.slice(0, 155),
    alternates: { canonical: `${siteUrl}/trek-types/${params.slug}` },
    openGraph: { title: c.title, images: [cmsPage?.hero_image_url ?? c.heroImage] },
  };
}

export const revalidate = 3600;

export default async function TrekTypePage({ params }: Props) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";

  // /trek-types is EXCLUSIVELY the curated thematic categories. Any other slug 404s.
  const c = getCategoryContent(params.slug);
  if (!c) {
    notFound();
  }
  const label = params.slug.replace(/-/g, " "); // "lake treks"

  let cmsPage = null;
  try {
    cmsPage = await fetchCMSPage(`trek-types/${params.slug}`);
  } catch {
    // code-first
  }

  const clusterPages = await fetchClusterTreks({ category: params.slug, limit: 9 });
  const clusterTreks = clusterPages.map(cmsPageToTrek);
  const trekCount = clusterTreks.length;

  const breadcrumbItems = [
    { label: "Home", href: `${siteUrl}/` },
    { label: "Trek Types", href: `${siteUrl}/explore` },
    { label: c.title, href: `${siteUrl}/trek-types/${params.slug}` },
  ];

  const cmsFaqs: FAQItem[] = (cmsPage?.content_json?.faqs ?? []).filter((f) => f.q && f.a);
  const generatedFaqs: FAQItem[] = [
    {
      q: `How many ${label} does TrekYatra cover?`,
      a: `${trekCount} ${label} across India, each with a full route breakdown, difficulty, permits, cost estimates and live trail conditions.`,
    },
    {
      q: `Which regions have the best ${label}?`,
      a: c.bestRegions.map((r) => `${r.name} — ${r.note}`).join(" "),
    },
    { q: `Are ${label} good for beginners?`, a: c.beginnerNote },
    { q: `What should I know before choosing ${label}?`, a: c.tips.join("; ") + "." },
  ];
  const faqs: FAQItem[] = cmsFaqs.length ? cmsFaqs : generatedFaqs;

  const heroImage = cmsPage?.hero_image_url ?? c.heroImage;
  const description = cmsPage?.seo_description ?? c.intro;
  const displayLabel = label.charAt(0).toUpperCase() + label.slice(1);

  const stats: [string, string][] = [
    [String(trekCount), trekCount === 1 ? "Trek in category" : "Treks in category"],
    [String(c.bestRegions.length), "Prime regions"],
    ["India-wide", "Coverage"],
  ];

  return (
    <>
      <SchemaInjector
        schemas={[
          buildBreadcrumbSchema(breadcrumbItems),
          ...(clusterTreks.length ? [buildItemListSchema(clusterTreks.map((t) => t.name), `/trek-types/${params.slug}`)] : []),
          buildFAQSchema(faqs)!,
        ]}
      />

      {/* Hero */}
      <section className="relative h-[62vh] min-h-[480px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt={c.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/30 to-transparent" />
        </div>
        <div className="container-wide relative pb-12 text-surface">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-dark text-xs uppercase tracking-widest mb-5">
            <Mountain className="h-3 w-3 text-accent-glow" /> {c.tagline}
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-semibold leading-[0.95] mb-5 max-w-4xl">
            {cmsPage?.title ?? c.title}
          </h1>
          <p className="text-surface/85 text-lg max-w-2xl">{description}</p>
        </div>
      </section>

      {/* Stat strip */}
      <section className="bg-card border-b border-border">
        <div className="container-wide grid grid-cols-3 divide-x divide-border">
          {stats.map(([v, l]) => (
            <div key={l} className="p-6 text-center">
              <div className="font-display text-2xl md:text-3xl font-semibold text-accent">{v}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Why choose */}
      <section className="py-14">
        <div className="container-wide max-w-4xl">
          <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">{c.tagline}</div>
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-5">Why choose {displayLabel}?</h2>
          <p className="text-lg text-foreground/85 leading-relaxed">{c.whyChoose}</p>
        </div>
      </section>

      {/* Planning tips */}
      <section className="py-12 bg-surface-muted">
        <div className="container-wide max-w-4xl">
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-6">Planning your {label}</h2>
          <ul className="grid sm:grid-cols-2 gap-4">
            {c.tips.map((tip) => (
              <li key={tip} className="flex items-start gap-3 text-foreground/85 bg-card border border-border rounded-xl p-4">
                <CheckCircle2 className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Best regions */}
      <section className="py-14">
        <div className="container-wide">
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-6">Best regions for {label}</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {c.bestRegions.map((r) => (
              <Link key={r.slug} href={`/regions/${r.slug}`} className="block p-6 bg-card border border-border rounded-2xl hover:border-accent/40 transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <MapPin className="h-4 w-4 text-accent" />
                  <h3 className="font-display text-lg font-semibold">{r.name}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{r.note}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Member treks */}
      {clusterTreks.length > 0 && (
        <section className="py-12 bg-surface-muted">
          <div className="container-wide">
            <div className="flex items-end justify-between mb-8">
              <h2 className="font-display text-3xl md:text-4xl font-semibold">Top {label}</h2>
              <Link href="/explore" className="text-sm text-accent font-medium hidden md:block whitespace-nowrap">Browse all treks →</Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {clusterTreks.map((t) => (
                <TrekCard key={t.slug} trek={t} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Optional editor overlay */}
      {cmsPage?.content_html && cmsPage.content_html.length > 400 && (
        <section className="py-8">
          <div className="container-wide max-w-3xl">
            <div className="cms-section prose max-w-none text-foreground/85" dangerouslySetInnerHTML={{ __html: cmsPage.content_html }} />
          </div>
        </section>
      )}

      {/* FAQs */}
      <section className="py-12 border-t border-border">
        <div className="container-wide max-w-3xl">
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-6">{displayLabel} — Frequently Asked Questions</h2>
          <FAQAccordion items={faqs} />
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="container-wide">
          <div className="bg-gradient-pine text-surface rounded-2xl p-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <Sparkles className="h-8 w-8 text-accent mb-4" />
              <h2 className="font-display text-3xl font-semibold mb-2 leading-tight">Ready to plan your trek?</h2>
              <p className="text-surface/80">Tell us your fitness, dates and budget — we&apos;ll match you to the right trail.</p>
            </div>
            <Link href="/plan">
              <Button variant="hero" size="lg" className="w-fit whitespace-nowrap">
                Plan My Trek <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <AffiliateDisclosure />
    </>
  );
}
