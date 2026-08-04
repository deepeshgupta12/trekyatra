import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TrekCard } from "@/components/trek/TrekCard";
import { Button } from "@/components/ui/button";
import { MapPin, Sparkles, ArrowRight } from "lucide-react";
import { treks } from "@/data/treks";
import {
  fetchCMSPage,
  fetchTrekCMSOverrides,
  fetchCMSTreksByState,
  fetchAllCMSTreks,
  fetchTrekStateCounts,
  type CMSTrekOverride,
  type CMSTrekCard,
} from "@/lib/api";
import {
  REGIONS,
  regionBySlug,
  regionSlugForState,
  type RegionMeta,
} from "@/lib/regions";
import SchemaInjector from "@/components/seo/SchemaInjector";
import { buildBreadcrumbSchema, buildFAQSchema, buildRegionSchema, buildCollectionPageSchema } from "@/lib/schema";
import FAQAccordion, { type FAQItem } from "@/components/content/FAQAccordion";
import { TrekComparisonTable } from "@/components/hub/TrekComparisonTable";
import { HubInterlinks } from "@/components/hub/HubInterlinks";

interface Props {
  params: { slug: string };
}

/**
 * /regions is EXCLUSIVELY the curated regions (lib/regions.REGIONS). Any other slug 404s — no
 * synthesised junk region pages. New regions must be added to REGIONS to get a page.
 */
export function generateStaticParams() {
  return REGIONS.map((r) => ({ slug: r.slug }));
}

/** Permit answer copy per country — used in generated FAQs + stat strip. */
function permitCopy(r: RegionMeta): { label: string; answer: string } {
  switch (r.country) {
    case "Nepal":
      return {
        label: "Required",
        answer: `Yes. Most treks in the ${r.name} require a TIMS card plus the relevant national-park or conservation-area entry permit, issued in Kathmandu or Pokhara. Restricted areas (Upper Mustang, Manaslu, etc.) need a special permit and a registered guide. Each trek guide lists the exact permits.`,
      };
    case "Pakistan":
      return {
        label: "Required",
        answer: `Yes. ${r.name} treks need a Pakistan visa and, for peaks and restricted zones near the borders, a trekking permit / NOC arranged through a licensed operator. Open-zone valley treks are lighter on paperwork. Each trek guide details what is required.`,
      };
    case "Tibet":
      return {
        label: "Required",
        answer: `Yes, and they are strict. Trekking in ${r.name} requires a Tibet Travel Permit, an Alien's Travel Permit for many areas, and travel as part of an organised group with a registered guide — independent trekking is not permitted. Each trek guide explains the process.`,
      };
    default:
      return {
        label: "Varies by trek",
        answer: `Many Himalayan treks in ${r.name} require forest or wildlife-sanctuary permits, and some border-area routes need an Inner Line Permit. Weekend Sahyadri and Western Ghats treks are usually permit-free. Each trek guide lists the exact permits and where to get them.`,
      };
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";
  const r = regionBySlug(params.slug);
  if (!r) return {}; // non-curated slug → the page 404s
  const canonical = `${siteUrl}/regions/${r.slug}`;
  try {
    const page = await fetchCMSPage(`regions/${params.slug}`);
    return {
      title: page.seo_title?.replace(/\s*\|\s*TrekYatra\s*$/i, "").trim() ?? `${r.name} Treks`,
      description: page.seo_description ?? r.blurb,
      alternates: { canonical },
      openGraph: { title: page.title, images: page.hero_image_url ? [page.hero_image_url] : [r.image] },
    };
  } catch {
    return {
      title: `${r.name} Treks — Routes, Permits, Seasons & Costs`,
      description: r.blurb,
      alternates: { canonical },
      openGraph: { title: `${r.name} Treks`, images: [r.image] },
    };
  }
}

export const revalidate = 3600;

export default async function Region({ params }: Props) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";
  const r = regionBySlug(params.slug);
  if (!r) {
    notFound();
  }

  // Try CMS regional hub first (optional — enriches with editor content + custom FAQs)
  let cmsPage = null;
  try {
    cmsPage = await fetchCMSPage(`regions/${params.slug}`);
  } catch {
    // fall back to code-derived hub (fully functional without a CMS page)
  }

  // Fetch CMS trek_guide pages for this region, static-data overrides, all CMS treks
  // (to honour CMS state over static state), and live per-state counts (for the total).
  const [cmsStateTreks, cmsOverrides, allCMSTreks, stateCounts] = await Promise.all([
    fetchCMSTreksByState(r.matchWord).catch((): CMSTrekCard[] => []),
    fetchTrekCMSOverrides().catch((): Record<string, CMSTrekOverride> => ({})),
    fetchAllCMSTreks().catch((): CMSTrekCard[] => []),
    fetchTrekStateCounts().catch((): { state: string; count: number }[] => []),
  ]);

  // Live total for this region = sum of every state that resolves to this region's slug.
  const regionTrekCount =
    stateCounts.filter((s) => regionSlugForState(s.state) === r.slug).reduce((n, s) => n + s.count, 0) ||
    cmsStateTreks.length;

  // Beginner routes — counted across the full state trek set (not the sliced grid).
  const beginnerTreks = cmsStateTreks.filter(
    (t) => t.beginner || /begin|easy/i.test(t.suitability ?? ""),
  );

  // Peak season — the most common non-empty season string across the region's treks.
  const seasonTally = new Map<string, number>();
  for (const t of cmsStateTreks) {
    const s = (t.season ?? "").trim();
    if (s && s !== "—") seasonTally.set(s, (seasonTally.get(s) ?? 0) + 1);
  }
  const peakSeason = Array.from(seasonTally.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Varies";
  const permits = permitCopy(r);

  // Build a slug → CMS state map so we can honour CMS state over static state
  const cmsStateMap: Record<string, string> = {};
  for (const trek of allCMSTreks) {
    if (trek.slug && trek.state) cmsStateMap[trek.slug] = trek.state;
  }

  // Static treks for this region — only India regions have static seed data; international
  // regions have none, so this naturally yields [] for them.
  const regionWord = r.matchWord;
  const staticFiltered = treks
    .filter((t) => {
      const staticStateMatch = t.state.toLowerCase().includes(regionWord);
      if (!staticStateMatch) return false;
      const cmsState = cmsStateMap[t.slug];
      if (cmsState && regionSlugForState(cmsState) !== r.slug) return false;
      return true;
    })
    .map((t) => {
      const ov = cmsOverrides[t.slug] ?? {};
      return {
        ...t,
        image: ov.image ?? t.image,
        name: ov.title ?? t.name,
        difficulty: ov.difficulty ?? t.difficulty,
        duration: ov.duration ?? t.duration,
        season: ov.season ?? t.season,
        altitude: ov.altitude ?? t.altitude,
        suitability: ov.suitability ?? undefined,
        region: t.region,
      };
    });

  // Merge: CMS treks first, then fill with static treks not already covered by CMS slug
  const cmsSlugSet = new Set(cmsStateTreks.map((p) => p.slug));
  const combinedTreks = [
    ...cmsStateTreks.map((p) => ({
      slug: p.slug, name: p.name, region: p.region,
      state: p.state, image: p.image,
      duration: p.duration, altitude: p.altitude,
      difficulty: p.difficulty, season: p.season,
      description: p.description, beginner: p.beginner,
      suitability: p.suitability,
    })),
    ...staticFiltered.filter((t) => !cmsSlugSet.has(t.slug)),
  ].slice(0, 6);

  // FAQs — prefer editor-authored (CMS content_json.faqs, already {q,a}), else generate.
  const cmsFaqs: FAQItem[] = (cmsPage?.content_json?.faqs ?? []).filter((f) => f.q && f.a);

  const generatedFaqs: FAQItem[] = [
    {
      q: `How many treks are documented in ${r.name}?`,
      a: `TrekYatra documents ${regionTrekCount} trek${regionTrekCount !== 1 ? "s" : ""} across ${r.name}, each with a detailed route breakdown, permits, cost estimates, and live trail conditions.`,
    },
    {
      q: `When is the best time to trek in ${r.name}?`,
      a:
        peakSeason !== "Varies"
          ? `The peak trekking window for most routes in ${r.name} is ${peakSeason}. Higher-altitude routes have shorter, later windows — always check current conditions before departing.`
          : `Season windows vary by altitude and route in ${r.name}. Each trek guide lists its recommended months and current on-the-ground conditions.`,
    },
    { q: `Do I need permits for treks in ${r.name}?`, a: permits.answer },
    ...(beginnerTreks.length
      ? [
          {
            q: `Which treks in ${r.name} are good for beginners?`,
            a: `${beginnerTreks.length} route${beginnerTreks.length !== 1 ? "s are" : " is"} suitable for first-time trekkers in ${r.name}${
              beginnerTreks.length ? `, including ${beginnerTreks.slice(0, 3).map((t) => t.name).join(", ")}` : ""
            }. Each guide flags the fitness level and prior experience needed.`,
          },
        ]
      : []),
  ];
  const faqs: FAQItem[] = cmsFaqs.length ? cmsFaqs : generatedFaqs;

  // Dynamic stat strip — real numbers, no hardcoded placeholders.
  const statCards: [string, string][] = [
    [String(regionTrekCount), regionTrekCount === 1 ? "Trek documented" : "Treks documented"],
    [String(beginnerTreks.length), "Beginner routes"],
    [peakSeason, "Peak season"],
    [permits.label, "Permits"],
  ];

  const breadcrumbItems = [
    { label: "Home", href: `${siteUrl}/` },
    { label: "Regions", href: `${siteUrl}/explore` },
    { label: r.name, href: `${siteUrl}/regions/${r.slug}` },
  ];

  const heroImage = cmsPage?.hero_image_url ?? r.image;
  const description = cmsPage?.seo_description ?? r.blurb;

  // Interlinking targets beyond the trek cards.
  const otherRegions = REGIONS.filter((x) => x.slug !== r.slug).slice(0, 6);
  const interlinkGroups = [
    { title: "Nearby regions", links: otherRegions.map((x) => ({ label: x.name, href: `/regions/${x.slug}` })) },
    { title: "Trek by season", links: [
      { label: "Spring treks", href: "/seasons/spring" },
      { label: "Summer treks", href: "/seasons/summer" },
      { label: "Autumn treks", href: "/seasons/autumn" },
      { label: "Winter treks", href: "/seasons/winter" },
    ] },
    { title: "Trek by type", links: [
      { label: "Beginner friendly treks", href: "/trek-types/beginner-friendly-treks" },
      { label: "Weekend treks", href: "/trek-types/weekend-treks" },
      { label: "Lake treks", href: "/trek-types/lake-treks" },
      { label: "Snow treks", href: "/trek-types/snow-treks" },
    ] },
    { title: "Plan your trek", links: [
      { label: "Packing checklists", href: "/packing" },
      { label: "Permit guides", href: "/permits" },
      { label: "Cost estimators", href: "/costs" },
      { label: "Compare treks", href: "/compare" },
      { label: "Plan my trek", href: "/plan" },
    ] },
  ];

  return (
    <>
      <SchemaInjector
        schemas={[
          buildBreadcrumbSchema(breadcrumbItems),
          buildRegionSchema({
            name: `${r.name} Treks`,
            description,
            url: `/regions/${r.slug}`,
            imageUrl: heroImage,
            country: r.country,
            treks: combinedTreks.map((t) => ({ name: t.name, slug: t.slug })),
          }),
          buildCollectionPageSchema({
            name: `${r.name} Treks`,
            description,
            url: `/regions/${r.slug}`,
            image: heroImage,
            dateModified: cmsPage?.updated_at ?? null,
            about: { type: "Place", name: r.name, description: r.whyTrek ?? r.blurb },
            treks: combinedTreks.map((t) => ({ name: t.name, slug: t.slug, image: t.image, description: t.description, difficulty: t.difficulty, duration: t.duration, altitude: t.altitude, season: t.season })),
            significantLinks: [...interlinkGroups.flatMap((g) => g.links.map((l) => l.href))],
            keywords: [`${r.name.toLowerCase()} treks`, `best treks in ${r.name.toLowerCase()}`, `${r.name.toLowerCase()} trekking`],
          }),
          ...(faqs.length ? [buildFAQSchema(faqs)!] : []),
        ]}
      />

      <section className="relative h-[68vh] min-h-[500px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImage} alt={r.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/30 to-foreground/10" />
        </div>
        <div className="container-wide relative pb-12 text-surface">
          <div className="text-xs uppercase tracking-[0.25em] text-accent-glow mb-3 flex items-center gap-2">
            <MapPin className="h-3 w-3" /> Region · {r.country}
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-semibold leading-[0.95] mb-4 max-w-4xl">{r.name}</h1>
          <p className="text-xl text-accent-glow mb-4">{r.tagline}</p>
          <p className="hub-intro text-surface/85 max-w-2xl text-lg">{description}</p>
        </div>
      </section>

      <section className="bg-card border-b border-border">
        <div className="container-wide grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          {statCards.map(([v, l]) => (
            <div key={l} className="p-6 text-center">
              <div className="font-display text-3xl font-semibold text-accent">{v}</div>
              <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Why trek in {region} — unique narrative (SEO/AEO substance) */}
      {(cmsPage?.content_json?.hub?.why ?? r.whyTrek) && (
        <section className="py-14">
          <div className="container-wide max-w-4xl">
            <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">{r.tagline}</div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold mb-5">Why trek in {r.name}?</h2>
            <p className="text-lg text-foreground/85 leading-relaxed">{cmsPage?.content_json?.hub?.why ?? r.whyTrek}</p>
          </div>
        </section>
      )}

      {/* CMS rich content block (if available) */}
      {cmsPage?.content_html && (
        <section className="py-12">
          <div className="container-wide max-w-4xl">
            <div
              className="cms-section prose max-w-none text-foreground/85"
              dangerouslySetInnerHTML={{ __html: cmsPage.content_html }}
            />
          </div>
        </section>
      )}

      <section className="py-16">
        <div className="container-wide">
          <div className="flex items-end justify-between mb-8">
            <h2 className="font-display text-3xl md:text-4xl font-semibold">Top treks in {r.name}</h2>
            <Link href={`/explore?state=${encodeURIComponent(r.name)}`} className="text-sm text-accent font-medium hidden md:block whitespace-nowrap">
              View all treks in {r.name} →
            </Link>
          </div>
          {combinedTreks.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {combinedTreks.map((t) => (
                <TrekCard key={t.slug} trek={t} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-surface-muted p-10 text-center">
              <p className="text-muted-foreground">
                Trek guides for {r.name} are being published. Meanwhile, explore our full catalogue.
              </p>
              <Link href="/explore" className="inline-flex items-center gap-1.5 text-accent font-medium mt-3">
                Browse all treks <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Comparison table */}
      <TrekComparisonTable treks={combinedTreks} title={`Compare treks in ${r.name}`} caption={`How the top ${r.name} treks compare on difficulty, duration, season and altitude.`} />

      {faqs.length > 0 && (
        <section className="py-12 border-t border-border">
          <div className="hub-faq container-wide max-w-3xl">
            <h2 className="font-display text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
            <FAQAccordion items={faqs} />
          </div>
        </section>
      )}

      {/* Season summary derived from the treks in this region */}
      {combinedTreks.some((t) => t.season && t.season !== "—") && (
        <section className="py-12 bg-surface-muted">
          <div className="container-wide max-w-4xl">
            <h2 className="font-display text-2xl md:text-3xl font-semibold mb-6">When to trek in {r.name}</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {combinedTreks.filter((t) => t.season && t.season !== "—").slice(0, 6).map((t) => (
                <div key={t.slug} className="bg-card border border-border rounded-xl p-4 flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                    <span className="text-accent text-xs font-bold">⛰</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{t.name}</p>
                    <p className="text-xs text-accent font-medium mt-0.5">{t.season}</p>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-5">
              Peak trekking months vary by altitude and route. Always check current conditions before departing.
            </p>
          </div>
        </section>
      )}

      <section className="py-16">
        <div className="container-wide grid lg:grid-cols-2 gap-10">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">Getting there</div>
            <h2 className="font-display text-3xl font-semibold mb-5">Logistics &amp; access points</h2>
            <div className="space-y-3">
              {r.logistics.map(([c, t]) => (
                <div key={c} className="p-4 bg-card border border-border rounded-xl flex justify-between items-center gap-4">
                  <div className="font-medium whitespace-nowrap">{c}</div>
                  <div className="text-sm text-muted-foreground text-right">{t}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-gradient-pine text-surface rounded-2xl p-10 flex flex-col justify-between">
            <div>
              <Sparkles className="h-8 w-8 text-accent mb-4" />
              <h3 className="font-display text-3xl font-semibold mb-3 leading-tight">
                Need help picking the right trek in {r.name}?
              </h3>
              <p className="text-surface/80">Tell us your fitness, dates and budget. We&apos;ll match you to the right trail.</p>
            </div>
            <Link href="/plan">
              <Button variant="hero" size="lg" className="mt-6 w-fit">
                Plan My Trek <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Interlinks */}
      <HubInterlinks groups={interlinkGroups} />
    </>
  );
}
