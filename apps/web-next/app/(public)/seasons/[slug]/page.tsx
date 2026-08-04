import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrekCard } from "@/components/trek/TrekCard";
import { treks } from "@/data/treks";
import { Snowflake, Sun, Cloud, Leaf, MapPin, Calendar, Mountain, ShieldCheck, CheckCircle2 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { fetchCMSPage, fetchSeasonalTreks } from "@/lib/api";
import { cmsPageToTrek } from "@/lib/trek-utils";
import { getSeasonContent, SEASON_CONTENT } from "@/lib/season-content";
import SchemaInjector from "@/components/seo/SchemaInjector";
import { buildBreadcrumbSchema, buildFAQSchema, buildCollectionPageSchema } from "@/lib/schema";
import FAQAccordion, { type FAQItem } from "@/components/content/FAQAccordion";
import AffiliateDisclosure from "@/components/content/AffiliateDisclosure";
import { TrekComparisonTable } from "@/components/hub/TrekComparisonTable";
import { HubInterlinks } from "@/components/hub/HubInterlinks";

const SEASON_ICON: Record<string, LucideIcon> = {
  spring: Leaf, summer: Sun, monsoon: Cloud, autumn: Leaf, winter: Snowflake,
};
const isSeasonSlug = (slug: string): boolean => slug in SEASON_CONTENT;

interface Props {
  params: { slug: string };
}

export function generateStaticParams() {
  return Object.keys(SEASON_CONTENT).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";
  const c = getSeasonContent(params.slug);
  let cmsPage = null;
  try {
    cmsPage = await fetchCMSPage(`seasons/${params.slug}`);
  } catch { /* code-first */ }
  return {
    title: cmsPage?.seo_title ?? `${c.title}, Routes, Months, Packing and Weather | TrekYatra`,
    description: cmsPage?.seo_description ?? c.intro.slice(0, 155),
    alternates: { canonical: `${siteUrl}/seasons/${params.slug}` },
    openGraph: { title: c.title, images: [cmsPage?.hero_image_url ?? c.heroImage] },
  };
}

export const revalidate = 3600;

export default async function Seasonal({ params }: Props) {
  if (!isSeasonSlug(params.slug)) notFound();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";
  const c = getSeasonContent(params.slug);
  const name = params.slug.charAt(0).toUpperCase() + params.slug.slice(1);
  const Icon = SEASON_ICON[params.slug] ?? Calendar;

  let cmsPage = null;
  try {
    cmsPage = await fetchCMSPage(`seasons/${params.slug}`);
  } catch { /* code-first */ }

  // Hybrid content model: prefer the editable structured content_json.hub, fall back to code per field.
  const hub = cmsPage?.content_json?.hub ?? {};
  const intro = hub.intro ?? c.intro;
  const overview = hub.overview ?? c.overview;
  const whyTrek = hub.why ?? c.whyTrek;
  const bestRegions = hub.bestRegions?.length ? hub.bestRegions : c.bestRegions;
  const monthTable = hub.monthTable?.length ? hub.monthTable : c.monthTable;
  const prepare = hub.prepare?.length ? hub.prepare : c.prepare;
  const packing = hub.packing?.length ? hub.packing : c.packing;
  const weather = hub.weather ?? c.weather;

  const cmsSeasonPages = await fetchSeasonalTreks(params.slug, 9);
  const seasonTreks = cmsSeasonPages.length ? cmsSeasonPages.map(cmsPageToTrek) : treks.slice(0, 6);
  const trekCount = cmsSeasonPages.length || seasonTreks.length;

  const heroImage = cmsPage?.hero_image_url ?? c.heroImage;
  const description = cmsPage?.seo_description ?? intro;

  const generatedFaqs: FAQItem[] = [
    { q: `When is the best time for ${name.toLowerCase()} treks in India?`, a: `The ${name.toLowerCase()} trekking window runs ${c.monthsLabel}. ${weather}` },
    { q: `Which regions are best for ${name.toLowerCase()} trekking?`, a: bestRegions.map((r) => `${r.name}, ${r.note}`).join(" ") },
    { q: `How many ${name.toLowerCase()} treks does TrekYatra cover?`, a: `${trekCount} treks match the ${name.toLowerCase()} window, each with a full route breakdown, permits, cost estimates and live trail conditions.` },
    { q: `What should I pack for ${name.toLowerCase()} treks?`, a: `Key items are ${packing.join(", ")}. ${c.prep}` },
    { q: `Are ${name.toLowerCase()} treks good for beginners?`, a: c.beginnerNote },
  ];
  const faqs: FAQItem[] = hub.faqs?.length ? hub.faqs : (cmsPage?.content_json?.faqs?.length ? cmsPage.content_json.faqs : generatedFaqs);

  const breadcrumbItems = [
    { label: "Home", href: `${siteUrl}/` },
    { label: "Seasonal Treks", href: `${siteUrl}/seasons` },
    { label: c.title, href: `${siteUrl}/seasons/${params.slug}` },
  ];

  const stats: [string, string][] = [
    [String(trekCount), trekCount === 1 ? "Trek in season" : "Treks in season"],
    [c.monthsLabel, "Peak months"],
    [String(bestRegions.length), "Prime regions"],
    [String(monthTable.length), monthTable.length === 1 ? "Month covered" : "Months covered"],
  ];

  // Interlinking targets beyond the trek cards.
  const otherSeasons = Object.keys(SEASON_CONTENT).filter((s) => s !== params.slug);
  const interlinkGroups = [
    { title: "Best regions this season", links: bestRegions.map((r) => ({ label: r.name, href: `/regions/${r.slug}` })) },
    { title: "Other seasons", links: otherSeasons.map((s) => ({ label: `${s.charAt(0).toUpperCase() + s.slice(1)} treks`, href: `/seasons/${s}` })) },
    { title: "Trek by type", links: [
      { label: "Beginner friendly treks", href: "/trek-types/beginner-friendly-treks" },
      { label: "Snow treks", href: "/trek-types/snow-treks" },
      { label: "Lake treks", href: "/trek-types/lake-treks" },
      { label: "High altitude treks", href: "/trek-types/high-altitude-treks" },
    ] },
    { title: "Plan your trek", links: [
      { label: "Packing checklists", href: "/packing" },
      { label: "Permit guides", href: "/permits" },
      { label: "Cost estimators", href: "/costs" },
      { label: "Compare treks", href: "/compare" },
      { label: "Plan my trek", href: "/plan" },
    ] },
  ];

  const significantLinks = [
    ...bestRegions.map((r) => `/regions/${r.slug}`),
    ...otherSeasons.map((s) => `/seasons/${s}`),
    "/packing", "/permits", "/plan",
  ];

  return (
    <>
      <SchemaInjector
        schemas={[
          buildBreadcrumbSchema(breadcrumbItems),
          buildCollectionPageSchema({
            name: c.title,
            description,
            url: `/seasons/${params.slug}`,
            image: heroImage,
            dateModified: cmsPage?.updated_at ?? null,
            about: { type: "Thing", name: `${name} trekking in India`, description: whyTrek },
            treks: seasonTreks.map((t) => ({ name: t.name, slug: t.slug, image: t.image, description: t.description, difficulty: t.difficulty, duration: t.duration, altitude: t.altitude, season: t.season })),
            significantLinks,
            keywords: [`${name.toLowerCase()} treks`, `best ${name.toLowerCase()} treks india`, ...bestRegions.map((r) => `${name.toLowerCase()} treks ${r.name.toLowerCase()}`)],
          }),
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
            <Icon className="h-3 w-3 text-accent-glow" /> Season, {c.monthsLabel}
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-semibold leading-[0.95] mb-5 max-w-4xl">{cmsPage?.title ?? c.title}</h1>
          <p className="hub-intro text-surface/85 text-lg max-w-2xl">{description}</p>
        </div>
      </section>

      {/* Stat strip */}
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

      {/* Why trek + overview */}
      <section className="py-14">
        <div className="container-wide max-w-4xl">
          <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">{c.tagline}</div>
          <h2 className="font-display text-3xl md:text-4xl font-semibold mb-5">Why trek in {name}?</h2>
          <p className="text-lg text-foreground/85 leading-relaxed mb-4">{whyTrek}</p>
          <p className="text-foreground/75 leading-relaxed">{overview}</p>
        </div>
      </section>

      {/* Best regions */}
      <section className="py-12 bg-surface-muted">
        <div className="container-wide">
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-6">Best regions for {name} trekking</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {bestRegions.map((r) => (
              <Link key={r.slug} href={`/regions/${r.slug}`} className="block p-6 bg-card border border-border rounded-2xl hover:border-accent/40 transition-colors">
                <div className="flex items-center gap-2 mb-2"><MapPin className="h-4 w-4 text-accent" /><h3 className="font-display text-lg font-semibold">{r.name}</h3></div>
                <p className="text-sm text-muted-foreground">{r.note}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trek grid */}
      <section className="py-14">
        <div className="container-wide">
          <div className="flex items-end justify-between mb-8">
            <h2 className="font-display text-3xl md:text-4xl font-semibold">Top {name} treks</h2>
            <Link href="/explore" className="text-sm text-accent font-medium hidden md:block whitespace-nowrap">Browse all treks &rarr;</Link>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {seasonTreks.map((t) => <TrekCard key={t.slug} trek={t} />)}
          </div>
        </div>
      </section>

      {/* Comparison table */}
      <TrekComparisonTable treks={seasonTreks} title={`Compare ${name} treks`} caption={`How the top ${name.toLowerCase()} treks stack up on difficulty, duration, season and altitude.`} />

      {/* Month by month */}
      <section className="py-12">
        <div className="container-wide max-w-4xl">
          <div className="flex items-center gap-2 mb-6"><Calendar className="h-5 w-5 text-accent" /><h2 className="font-display text-2xl md:text-3xl font-semibold">{name} month by month</h2></div>
          <div className="overflow-x-auto bg-card border border-border rounded-2xl">
            <table className="w-full text-sm min-w-[420px]">
              <thead><tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-widest">Month</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-widest">Conditions</th>
              </tr></thead>
              <tbody>
                {monthTable.map((m) => (
                  <tr key={m.month} className="border-b border-border/60 last:border-0">
                    <td className="px-5 py-3.5 font-semibold whitespace-nowrap">{m.month}</td>
                    <td className="px-5 py-3.5 text-foreground/80">{m.conditions}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground mt-4 flex items-start gap-2"><ShieldCheck className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" /> {c.prep}</p>
        </div>
      </section>

      {/* How to prepare + What to pack */}
      <section className="py-12 bg-surface-muted">
        <div className="container-wide grid lg:grid-cols-2 gap-10">
          <div>
            <div className="flex items-center gap-2 mb-4"><CheckCircle2 className="h-5 w-5 text-accent" /><h2 className="font-display text-2xl md:text-3xl font-semibold">How to prepare</h2></div>
            <ul className="space-y-3">
              {prepare.map((p) => <li key={p} className="flex items-start gap-3 text-foreground/85"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" /><span>{p}</span></li>)}
            </ul>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-4"><Mountain className="h-5 w-5 text-accent" /><h2 className="font-display text-2xl md:text-3xl font-semibold">What to pack</h2></div>
            <ul className="space-y-3">
              {packing.map((p) => <li key={p} className="flex items-start gap-3 text-foreground/85"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-accent flex-shrink-0" /><span>{p}</span></li>)}
            </ul>
            <p className="text-sm text-muted-foreground mt-5">{weather}</p>
          </div>
        </div>
      </section>

      {/* Editor overlay (rich HTML) */}
      {cmsPage?.content_html && cmsPage.content_html.length > 400 && (
        <section className="py-8"><div className="container-wide max-w-3xl"><div className="cms-section prose max-w-none text-foreground/85" dangerouslySetInnerHTML={{ __html: cmsPage.content_html }} /></div></section>
      )}

      {/* FAQs */}
      <section className="py-12 border-t border-border">
        <div className="hub-faq container-wide max-w-3xl">
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-6">{name} trekking, frequently asked questions</h2>
          <FAQAccordion items={faqs} />
        </div>
      </section>

      {/* Interlinks */}
      <HubInterlinks groups={interlinkGroups} />

      <AffiliateDisclosure />
    </>
  );
}
