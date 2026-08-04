import type { Metadata } from "next";
import Link from "next/link";
import { TrekCard } from "@/components/trek/TrekCard";
import { treks } from "@/data/treks";
import { Snowflake, Sun, Cloud, Leaf, MapPin, Calendar, Mountain, ShieldCheck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { fetchCMSPage, fetchSeasonalTreks, fetchSeasonalTreksByMonth } from "@/lib/api";
import { cmsPageToTrek } from "@/lib/trek-utils";
import { getSeasonContent } from "@/lib/season-content";
import SchemaInjector from "@/components/seo/SchemaInjector";
import { buildBreadcrumbSchema, buildFAQSchema, buildItemListSchema } from "@/lib/schema";
import FAQAccordion, { type FAQItem } from "@/components/content/FAQAccordion";
import AffiliateDisclosure from "@/components/content/AffiliateDisclosure";

// Each seasonal-hub slug → its canonical backend trek query (season slug or month number).
const SEASON_QUERY: Record<string, { season?: string; month?: number }> = {
  spring: { season: "spring" }, summer: { season: "summer" }, monsoon: { season: "monsoon" },
  autumn: { season: "autumn" }, winter: { season: "winter" },
  december: { month: 12 }, may: { month: 5 },
};

const SEASON_ICON: Record<string, LucideIcon> = {
  spring: Leaf, summer: Sun, monsoon: Cloud, autumn: Leaf, winter: Snowflake,
  december: Snowflake, may: Sun,
};

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return Object.keys(SEASON_QUERY).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";
  const c = getSeasonContent(params.slug);
  let cmsPage = null;
  try {
    cmsPage = await fetchCMSPage(`seasons/${params.slug}`);
  } catch {
    // code-first fallback
  }
  return {
    title: cmsPage?.seo_title ?? `${c.title} — Routes, Months, Packing & Weather | TrekYatra`,
    description: cmsPage?.seo_description ?? c.intro.slice(0, 155),
    alternates: { canonical: `${siteUrl}/seasons/${params.slug}` },
    openGraph: { title: c.title, images: [cmsPage?.hero_image_url ?? c.heroImage] },
  };
}

export const revalidate = 3600;

export default async function Seasonal({ params }: Props) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";
  const c = getSeasonContent(params.slug);
  const name = params.slug.charAt(0).toUpperCase() + params.slug.slice(1);
  const Icon = SEASON_ICON[params.slug] ?? Calendar;

  // Optional CMS overlay (editor enrichment) — the rich body below always renders regardless.
  let cmsPage = null;
  try {
    cmsPage = await fetchCMSPage(`seasons/${params.slug}`);
  } catch {
    // code-first
  }

  // Live treks matching this season/month (Master CMS + Trek Backfill), static seed as last resort.
  const q = SEASON_QUERY[params.slug];
  const cmsSeasonPages = q
    ? await (q.season ? fetchSeasonalTreks(q.season, 9) : fetchSeasonalTreksByMonth(q.month!, 9))
    : [];
  const seasonTreks = cmsSeasonPages.length ? cmsSeasonPages.map(cmsPageToTrek) : treks.slice(0, 6);
  const trekCount = cmsSeasonPages.length || seasonTreks.length;

  const heroImage = cmsPage?.hero_image_url ?? c.heroImage;
  const description = cmsPage?.seo_description ?? c.intro;

  // Generated, season-specific FAQs (unique per page; grounded in real data). Prefer CMS FAQs if set.
  const cmsFaqs: FAQItem[] = (cmsPage?.content_json?.faqs ?? []).filter((f) => f.q && f.a);
  const generatedFaqs: FAQItem[] = [
    {
      q: `When is the best time for ${name.toLowerCase()} treks in India?`,
      a: `The ${name.toLowerCase()} trekking window runs ${c.monthsLabel}. ${c.weather}`,
    },
    {
      q: `Which regions are best for ${name.toLowerCase()} trekking?`,
      a: `${c.bestRegions.map((r) => `${r.name} — ${r.note}`).join(" ")}`,
    },
    {
      q: `How many ${name.toLowerCase()} treks does TrekYatra cover?`,
      a: `${trekCount} trek${trekCount !== 1 ? "s" : ""} match the ${name.toLowerCase()} window, each with a full route breakdown, permits, cost estimates and live trail conditions.`,
    },
    {
      q: `What should I pack for ${name.toLowerCase()} treks?`,
      a: `Key items: ${c.packing.join("; ")}. ${c.prep}`,
    },
    {
      q: `Are ${name.toLowerCase()} treks good for beginners?`,
      a: c.beginnerNote,
    },
  ];
  const faqs: FAQItem[] = cmsFaqs.length ? cmsFaqs : generatedFaqs;

  const breadcrumbItems = [
    { label: "Home", href: `${siteUrl}/` },
    { label: "Seasonal Treks", href: `${siteUrl}/seasons` },
    { label: c.title, href: `${siteUrl}/seasons/${params.slug}` },
  ];

  const stats: [string, string][] = [
    [String(trekCount), trekCount === 1 ? "Trek in season" : "Treks in season"],
    [c.monthsLabel, "Peak months"],
    [String(c.bestRegions.length), "Prime regions"],
    [`${c.monthTable.length}`, c.monthTable.length === 1 ? "Month covered" : "Months covered"],
  ];

  return (
    <>
      <SchemaInjector
        schemas={[
          buildBreadcrumbSchema(breadcrumbItems),
          buildItemListSchema(seasonTreks.map((t) => t.name), `/seasons/${params.slug}`),
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
            <Icon className="h-3 w-3 text-accent-glow" /> Season · {c.monthsLabel}
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-semibold leading-[0.95] mb-5 max-w-4xl">
            {cmsPage?.title ?? c.title}
          </h1>
          <p className="text-surface/85 text-lg max-w-2xl">{description}</p>
        </div>
      </section>

      {/* Dynamic stat strip */}
      <section className="bg-card border-b border-border">
        <div className="container-wide grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {stats.map(([v, l]) => (
            <div key={l} className="p-6 text-center">
              <div className="font-display text-3xl font-semibold text-accent">{v}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Why trek this season */}
      <section className="py-14">
        <div className="container-wide max-w-4xl">
          <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3 flex items-center gap-2">
            <Sun className="h-3.5 w-3.5" /> {c.tagline}
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-5">Why trek in {name}?</h2>
          <p className="text-lg text-foreground/85 leading-relaxed">{c.whyTrek}</p>
        </div>
      </section>

      {/* Best regions this season */}
      <section className="py-12 bg-surface-muted">
        <div className="container-wide">
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-6">Best regions for {name} trekking</h2>
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

      {/* Top treks (real, season-matched) */}
      <section className="py-14">
        <div className="container-wide">
          <div className="flex items-end justify-between mb-8">
            <h2 className="font-display text-3xl md:text-4xl font-semibold">Top {name} treks</h2>
            <Link href="/explore" className="text-sm text-accent font-medium hidden md:block whitespace-nowrap">
              Browse all treks →
            </Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {seasonTreks.map((t) => (
              <TrekCard key={t.slug} trek={t} />
            ))}
          </div>
        </div>
      </section>

      {/* Month-by-month table */}
      <section className="py-12 bg-surface-muted">
        <div className="container-wide max-w-4xl">
          <div className="flex items-center gap-2 mb-6">
            <Calendar className="h-5 w-5 text-accent" />
            <h2 className="font-display text-2xl md:text-3xl font-semibold">{name} month-by-month</h2>
          </div>
          <div className="overflow-x-auto bg-card border border-border rounded-2xl">
            <table className="w-full text-sm min-w-[420px]">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-widest">Month</th>
                  <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-widest">Conditions</th>
                </tr>
              </thead>
              <tbody>
                {c.monthTable.map((m) => (
                  <tr key={m.month} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-3.5 font-semibold whitespace-nowrap">{m.month}</td>
                    <td className="px-5 py-3.5 text-foreground/80">{m.conditions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground mt-4 flex items-start gap-2">
            <ShieldCheck className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" /> {c.prep}
          </p>
        </div>
      </section>

      {/* What to pack + weather */}
      <section className="py-14">
        <div className="container-wide grid lg:grid-cols-2 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Mountain className="h-5 w-5 text-accent" />
              <h2 className="font-display text-2xl md:text-3xl font-semibold">What to pack for {name} treks</h2>
            </div>
            <ul className="space-y-3">
              {c.packing.map((item) => (
                <li key={item} className="flex items-start gap-3 text-foreground/85">
                  <span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-gradient-pine text-surface rounded-2xl p-8 flex flex-col justify-center">
            <div className="text-xs uppercase tracking-[0.25em] text-accent-glow mb-3">Weather &amp; conditions</div>
            <p className="text-surface/90 text-lg leading-relaxed">{c.weather}</p>
          </div>
        </div>
      </section>

      {/* Optional editor-authored in-depth guide (CMS overlay) — only if substantial */}
      {cmsPage?.content_html && cmsPage.content_html.length > 400 && (
        <section className="py-8">
          <div className="container-wide max-w-3xl">
            <div className="cms-section prose max-w-none text-foreground/85" dangerouslySetInnerHTML={{ __html: cmsPage.content_html }} />
          </div>
        </section>
      )}

      {/* FAQs (generated, season-specific) */}
      <section className="py-12 border-t border-border">
        <div className="container-wide max-w-3xl">
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-6">{name} trekking — Frequently Asked Questions</h2>
          <FAQAccordion items={faqs} />
        </div>
      </section>

      <AffiliateDisclosure />
    </>
  );
}
