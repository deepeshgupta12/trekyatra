import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { TrekCard } from "@/components/trek/TrekCard";
import { Button } from "@/components/ui/button";
import { fetchTreks, fetchTrekBySlug } from "@/lib/trekApi";
import { fetchCMSPage, fetchCMSPages, fetchRelatedPages, fetchNewsByTrek, fetchTrekProfile, type CMSPage, type FAQItem, type RelatedPage, type NewsArticle, type TrekProfile } from "@/lib/api";
import TrekAskAI from "@/components/trek/TrekAskAI";
import { TrekViewTracker } from "@/components/trek/TrekViewTracker";
import TableOfContents from "@/components/content/TableOfContents";
import RecommendedContent from "@/components/content/RecommendedContent";
import FAQAccordion from "@/components/content/FAQAccordion";
import Breadcrumb from "@/components/content/Breadcrumb";
import AuthorBlock from "@/components/content/AuthorBlock";
import SafetyDisclaimer from "@/components/content/SafetyDisclaimer";
import SchemaInjector from "@/components/seo/SchemaInjector";
import InArticleAdSlot from "@/components/monetization/InArticleAdSlot";
import { Suspense } from "react";
import MonetizationSlot from "@/components/monetization/MonetizationSlot";
import TrustSignals from "@/components/trust/TrustSignals";
import StickyMobileCTA from "@/components/trust/StickyMobileCTA";
import GatedContent from "@/components/subscription/GatedContent";
import { buildArticleSchema, buildFAQSchema, buildBreadcrumbSchema, buildTrekSchema } from "@/lib/schema";
import { regionSlugForState } from "@/lib/regions";
import { formatDate } from "@/lib/date";
import {
  Clock, TrendingUp, Calendar,
  Shield, FileCheck, Backpack, Wallet, ChevronRight, Star, MapPin,
  Check, Mountain, Info, Newspaper, ExternalLink,
} from "lucide-react";
import { TrekCTAs } from "@/components/trek/TrekCTAs";
import { TrekReportsSection } from "@/components/trek/TrekReportsSection";
import { BuddySection } from "@/components/trek/BuddySection";
import { LiveConditionsWidget } from "@/components/trek/LiveConditionsWidget";
import type { Trek } from "@/components/trek/TrekCard";

// ISR: cached statically, revalidated every 60s. Safe now that every CMS fetch on this
// page is cacheable (fetchCMSPage is ISR-tagged; conditions/reports/buddy use
// next:{revalidate}; the rest use apiFetch's default cache) — no `no-store` fetch remains
// to trigger "static to dynamic at runtime". On-demand slugs render + cache via
// dynamicParams; the Master CMS cache-clear / publish flow busts them instantly through
// /api/revalidate (revalidateTag `cms:{slug}` + revalidatePath `/trek/{slug}`).
export const dynamicParams = true;
export const revalidate = 60;

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  let cmsPage: CMSPage | null = null;
  try {
    const page = await fetchCMSPage(params.slug);
    if (page.status === "published") cmsPage = page;
  } catch { /* not found */ }

  const trekRaw = await fetchTrekBySlug(params.slug).catch(() => null);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";
  // Strip trailing "| TrekYatra" the LLM may have written into seo_title.
  // Do NOT append "| TrekYatra" here — the root layout template: "%s | TrekYatra" adds it.
  const rawSeoTitle = cmsPage?.seo_title?.replace(/\s*\|\s*TrekYatra\s*$/i, "").trim();
  const title = rawSeoTitle
    || (trekRaw?.name ? `${trekRaw.name} — Trek Guide` : params.slug.replace(/-/g, " "));
  const description = cmsPage?.seo_description ?? trekRaw?.description ?? "";
  const canonicalUrl = `${siteUrl}/trek/${params.slug}`;
  const ogImage = cmsPage?.hero_image_url ?? trekRaw?.image ?? null;

  const hasHiTranslation = !!(cmsPage?.translations?.hi);

  // Resolve OG image: prefer CMS hero, fallback to static trek image, then site default
  const ogImageUrl = ogImage ?? `${siteUrl}/images/og-default.jpg`;
  const ogImages = [{ url: ogImageUrl, width: 1200, height: 630, alt: title }];

  return {
    title,
    description,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        "en": canonicalUrl,
        ...(hasHiTranslation ? { "hi": `${siteUrl}/hi/trek/${params.slug}` } : {}),
      },
    },
    openGraph: {
      title,
      description,
      type: "article",
      url: canonicalUrl,
      siteName: "TrekYatra",
      locale: "en_IN",
      images: ogImages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImageUrl],
    },
  };
}

export default async function TrekDetailPage({ params }: { params: { slug: string } }) {
  const [trekRaw, allTreks] = await Promise.all([
    fetchTrekBySlug(params.slug),
    fetchTreks(),
  ]);

  let cmsPage: CMSPage | null = null;
  try {
    const page = await fetchCMSPage(params.slug);
    if (page.status === "published") cmsPage = page;
  } catch { /* render with static data only */ }

  // Route guard (Bug fix): /trek/[slug] must serve ONLY trek_guide pages. A CMS page of
  // another type sharing this slug must NOT render here as a broken trek page.
  //   - news_article: the /trek/{news-slug} pattern is DELETED → 404 (per product decision).
  //     News lives ONLY at /news/{slug} (a direct 200); we do NOT redirect — the spurious
  //     duplicate is simply removed. Internal links no longer point here (news is excluded
  //     from the linking graph + the cluster URL builder), so nothing legitimately 404s.
  //   - other content types: 301/308-redirect to their canonical prefix so any inbound
  //     links are preserved.
  // notFound()/permanentRedirect() are OUTSIDE try/catch so their control-flow signals
  // are never swallowed.
  if (cmsPage && cmsPage.page_type !== "trek_guide") {
    const REDIRECT_PREFIX: Record<string, string> = {
      packing_list: "/packing", packing_guide: "/packing",
      permit_guide: "/permits",
      beginner_guide: "/guides", beginner_roundup: "/guides", cost_guide: "/guides",
      gear_guide: "/guides", safety_guide: "/guides", itinerary: "/guides", expert_guide: "/guides",
      seasonal: "/seasons", trek_types: "/trek-types",
    };
    const prefix = REDIRECT_PREFIX[cmsPage.page_type]; // news_article intentionally absent → 404
    if (prefix) permanentRedirect(`${prefix}/${cmsPage.slug}`);
    notFound();
  }

  // Legacy / clean-slug redirect (PT4 / Step 81): the 12 hardcoded stub trek pages
  // were removed, so a bare slug like /trek/kedarkantha no longer resolves on its own.
  // If a real CMS trek exists whose slug starts with this slug (e.g.
  // kedarkantha-trek-guide-xxxx) or whose name slugifies to it, permanently redirect
  // so old URLs + inbound links/SEO are preserved. permanentRedirect() is called
  // OUTSIDE the try/catch — its internal NEXT_REDIRECT signal must not be swallowed.
  let redirectTarget: string | null = null;
  if (!cmsPage) {
    try {
      const allGuides = await fetchCMSPages({ page_type: "trek_guide", status: "published", limit: 200 });
      const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      const cmsVersion = allGuides.find(
        (p) =>
          p.slug !== params.slug &&
          (p.slug.startsWith(params.slug) || (p.trek_name ? slugify(p.trek_name) === params.slug : false))
      );
      if (cmsVersion) redirectTarget = `/trek/${cmsVersion.slug}`;
    } catch { /* API unavailable — fall through to notFound/static */ }
  }
  if (redirectTarget) permanentRedirect(redirectTarget);

  if (!trekRaw && !cmsPage) notFound();

  const cmsDisplayName = cmsPage?.title
    ? cmsPage.title.split(/[:—]/)[0].trim()
    : null;

  // Extract trek_facts early so we can use them in the Trek fallback object
  const tf = cmsPage?.content_json?.trek_facts ?? {};
  // Parse state from trek_facts.base — format is usually "Town, StateName"
  const tfBase = (tf as { base?: string }).base ?? "";
  const parsedState = tfBase.includes(",") ? tfBase.split(",").pop()?.trim() ?? "" : tfBase;
  const parsedRegion = tfBase || "";

  const trek: Trek = trekRaw ?? {
    slug: params.slug,
    name: cmsDisplayName ?? cmsPage!.title,
    description: cmsPage!.seo_description ?? "",
    region: parsedRegion,
    state: parsedState,
    image: cmsPage!.hero_image_url ?? "/images/trek-forest.jpg",
    duration: (tf as { duration?: string }).duration ?? "—",
    altitude: (tf as { altitude?: string }).altitude ?? "—",
    difficulty: ((tf as { difficulty?: string }).difficulty ?? "Moderate") as Trek["difficulty"],
    season: (tf as { season?: string }).season ?? "—",
    beginner: ((tf as { difficulty?: string }).difficulty ?? "").toLowerCase().includes("easy"),
  };

  const related = allTreks.filter(t => t.slug !== trek.slug).slice(0, 3);

  // Fetch cluster-related CMS pages for "In this cluster" sidebar
  let clusterPages: RelatedPage[] = [];
  try {
    clusterPages = await fetchRelatedPages(params.slug, 5);
  } catch { /* sidebar degrades gracefully */ }

  // Fetch related news articles for this trek
  let trekNewsArticles: NewsArticle[] = [];
  try {
    trekNewsArticles = await fetchNewsByTrek(params.slug, 3);
  } catch { /* news section degrades gracefully */ }

  // Fetch live conditions + report count + buddy count for schema enrichment and effective updated date.
  // All three are best-effort — failures degrade gracefully (schema omits the missing entries).
  const _schemaApiBase = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";
  let trekConditions: {
    trail_status?: string;
    condition_summary?: string | null;
    weather?: { temp_c?: number | null; label?: string } | null;
    last_updated_at?: string | null;
  } | null = null;
  let trekReportCount = 0;
  let trekBuddyCount = 0;
  {
    const [condRes, repRes, budRes] = await Promise.allSettled([
      fetch(`${_schemaApiBase}/api/v1/public/treks/${params.slug}/conditions`, { next: { revalidate: 60 } }),
      fetch(`${_schemaApiBase}/api/v1/public/treks/${params.slug}/reports`, { next: { revalidate: 60 } }),
      fetch(`${_schemaApiBase}/api/v1/public/treks/${params.slug}/buddy-count`, { next: { revalidate: 60 } }),
    ]);
    if (condRes.status === "fulfilled" && condRes.value.ok) {
      try { trekConditions = await condRes.value.json(); } catch { /* ignore */ }
    }
    if (repRes.status === "fulfilled" && repRes.value.ok) {
      try { const d = await repRes.value.json(); trekReportCount = (d?.total as number) ?? 0; } catch { /* ignore */ }
    }
    if (budRes.status === "fulfilled" && budRes.value.ok) {
      try { const d = await budRes.value.json(); trekBuddyCount = (d?.count as number) ?? 0; } catch { /* ignore */ }
    }
  }
  // Effective updated date = GREATEST(cms updated_at, conditions last_updated_at).
  // Used in JSON-LD schemas and the hero "Updated" badge so conditions refreshes
  // cause Google to re-crawl the page (same logic as the sitemap endpoint).
  const _condDate = trekConditions?.last_updated_at ? new Date(trekConditions.last_updated_at) : null;
  const _cmsDate = cmsPage?.updated_at ? new Date(cmsPage.updated_at) : null;
  const effectiveUpdatedAt: string | undefined = (() => {
    if (_condDate && _cmsDate) return _condDate > _cmsDate ? trekConditions!.last_updated_at! : cmsPage!.updated_at;
    if (_condDate && trekConditions?.last_updated_at) return trekConditions.last_updated_at;
    return cmsPage?.updated_at ?? undefined;
  })();

  // Step 72 — TrekSage structured profile (permits, budget, themes, crowd level, Ask AI)
  let trekProfile: TrekProfile | null = null;
  if (cmsPage) {
    trekProfile = await fetchTrekProfile(cmsPage.slug);
  }
  const facts = [
    { icon: Clock,      label: "Duration",    value: tf.duration    || trek.duration    || "—" },
    { icon: TrendingUp, label: "Max altitude", value: tf.altitude    || trek.altitude    || "—" },
    { icon: Mountain,   label: "Difficulty",  value: tf.difficulty  || trek.difficulty  || "—" },
    { icon: Calendar,   label: "Best season", value: tf.season      || trek.season      || "—" },
    { icon: FileCheck,  label: "Permits",     value: tf.permits     || "—" },
    { icon: MapPin,     label: "Base",        value: tf.base        || "—" },
  ];

  const heroImg = cmsPage?.hero_image_url ?? trek.image ?? "/images/trek-forest.jpg";

  const toc = [
    { id: "why-this-trek",  label: "Why this trek" },
    { id: "quick-facts",    label: "Quick facts" },
    { id: "route-overview", label: "Route overview" },
    { id: "itinerary",      label: "Day-wise itinerary" },
    { id: "best-time",      label: "Best time" },
    { id: "difficulty",     label: "Difficulty" },
    { id: "permits",        label: "Permits" },
    { id: "cost-estimate",  label: "Cost estimate" },
    { id: "packing",        label: "Packing" },
    { id: "safety",         label: "Safety" },
    { id: "alternatives",   label: "Alternatives" },
    { id: "faqs",           label: "FAQs" },
    { id: "live-conditions",  label: "Live Conditions" },
    { id: "trail-conditions", label: "Trail Reports" },
    { id: "trek-buddy",       label: "Find a Buddy" },
  ];

  const sec = (cmsPage?.content_json?.sections ?? {}) as Record<string, string>;
  const S = (key: string) => sec[key] || null;

  // Structured FAQ items from CMS (auto-extracted or editor-supplied)
  const faqItems: FAQItem[] = cmsPage?.content_json?.faqs ?? [];

  const isPremiumGated = cmsPage?.is_premium === true;

  // JSON-LD schemas
  const pageUrl = `/trek/${params.slug}`;
  const articleSchema = buildArticleSchema({
    title: cmsPage?.seo_title ?? trek.name,
    description: cmsPage?.seo_description ?? trek.description ?? "",
    url: pageUrl,
    publishedAt: cmsPage?.published_at ?? undefined,
    updatedAt: effectiveUpdatedAt,
    imageUrl: cmsPage?.hero_image_url ?? trek.image ?? undefined,
  });

  // TouristTrip schema — enriches Article with trek-specific structured data
  // following Schema.org/TouristTrip + Google structured data guidelines.
  // additionalProperty (PropertyValue) is the correct vehicle for TouristTrip extension data —
  // amenityFeature is only valid on Place/Accommodation subtypes, not TouristTrip.
  const baseTrekSchema = buildTrekSchema({
    name:          cmsPage?.trek_name ?? cmsDisplayName ?? trek.name,
    description:   cmsPage?.seo_description ?? trek.description ?? "",
    url:           pageUrl,
    imageUrl:      cmsPage?.hero_image_url ?? trek.image ?? undefined,
    routeImageUrl: cmsPage?.route_image_url ?? undefined,
    publishedAt:   cmsPage?.published_at ?? undefined,
    updatedAt:     effectiveUpdatedAt,
    duration:    tf.duration    || trek.duration    || null,
    altitude:    tf.altitude    || trek.altitude    || null,
    difficulty:  cmsPage?.trek_difficulty || tf.difficulty  || trek.difficulty || null,
    season:      cmsPage?.trek_season     || tf.season      || trek.season     || null,
    permits:     tf.permits     || null,
    base:        tf.base        || null,
    trekState:   cmsPage?.trek_state || trek.state || null,
    suitability: cmsPage?.trek_suitability || null,
  });
  // Build condition-related schema entries only when real data exists.
  // Empty sections should not appear in structured data (misleads search engines).
  const _condProps: object[] = [];
  if (trekConditions?.last_updated_at) {
    const w = trekConditions.weather;
    const weatherStr = w?.temp_c != null ? `${Math.round(w.temp_c)}°C, ${(w.label ?? "").trim()}`.trim() : null;
    const condValue = trekConditions.condition_summary
      ?? (weatherStr
        ? `Trail ${trekConditions.trail_status ?? "open"} — ${weatherStr}`
        : `Trail ${trekConditions.trail_status ?? "open"}`);
    _condProps.push({ "@type": "PropertyValue", name: "Live Trail Conditions", value: condValue });
  }
  if (trekReportCount > 0) {
    _condProps.push({ "@type": "PropertyValue", name: "Community Trail Reports",
      value: `${trekReportCount} verified report${trekReportCount !== 1 ? "s" : ""}` });
  }
  if (trekBuddyCount > 0) {
    _condProps.push({ "@type": "PropertyValue", name: "Trek Buddy Matching",
      value: `${trekBuddyCount} trekker${trekBuddyCount !== 1 ? "s" : ""} looking for a buddy` });
  }
  const trekSchema = _condProps.length > 0 ? {
    ...baseTrekSchema,
    additionalProperty: [
      ...((baseTrekSchema as { additionalProperty?: object[] }).additionalProperty ?? []),
      ..._condProps,
    ],
  } : baseTrekSchema;

  const faqSchema = faqItems.length ? buildFAQSchema(faqItems) : null;
  // Resolve the trek's state to its canonical region hub slug via the shared taxonomy
  // (lib/regions.ts) — handles India states, composite international trek_states (e.g.
  // "Koshi Province, Nepal / Tibet, China" → /regions/nepal), and LLM misspellings.
  const stateLabel = cmsPage?.trek_state || trek.state || "Treks";
  const stateHref = stateLabel !== "Treks" ? `/regions/${regionSlugForState(stateLabel)}` : "/explore";
  const breadcrumbSchema = buildBreadcrumbSchema([
    { label: "Home", href: "/" },
    { label: stateLabel === "Treks" ? "Explore" : stateLabel, href: stateHref },
    { label: cmsPage?.trek_name || cmsDisplayName || trek.name },
  ]);

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.trekyatra.co.in";
  const trekUrl = `${siteUrl}/trek/${params.slug}`;
  // SiteNavigation schema — all interlinking for this trek
  const siteNavSchema = {
    "@context": "https://schema.org",
    "@type": "SiteNavigationElement",
    name: `${cmsPage?.trek_name || trek.name} Trek — Navigation`,
    url: trekUrl,
    hasPart: [
      { "@type": "WebPage", name: "Trek Guide", url: trekUrl },
      { "@type": "WebPage", name: "Packing Checklist", url: `${trekUrl}/packing` },
      { "@type": "WebPage", name: "Permit Guide", url: `${trekUrl}/permits` },
      { "@type": "WebPage", name: "Cost Guide", url: `${trekUrl}/costs` },
      ...(trekNewsArticles.length > 0
        ? trekNewsArticles.map((n) => ({
            "@type": "WebPage",
            name: n.title,
            url: `${siteUrl}/news/${n.slug}`,
          }))
        : [{ "@type": "WebPage", name: "Latest News", url: `${siteUrl}/news` }]
      ),
    ],
  };

  return (
    <>
      {/* Invisible behavior tracker — records this trek visit for cookie-based personalisation */}
      <TrekViewTracker
        slug={trek.slug}
        title={cmsDisplayName ?? trek.name}
        region={cmsPage?.trek_state || trek.state || trek.region}
        difficulty={trek.difficulty}
        season={trek.season}
      />
      <SchemaInjector schemas={[articleSchema, trekSchema, faqSchema, breadcrumbSchema, siteNavSchema]} />
      {/* Hero */}
      <section className="relative h-[78vh] min-h-[600px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt={trek.name} className="w-full h-full object-cover" width={1920} height={1080} fetchPriority="high" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/40 to-foreground/20" />
        </div>
        {/* Breadcrumb — dark semi-transparent pill so it's readable on any hero image */}
        <div className="absolute top-20 left-0 right-0 z-10 container-wide">
          <div className="inline-flex items-center bg-black/45 backdrop-blur-sm rounded-full px-3 py-1.5">
            <Breadcrumb
              items={[
                { label: "Home", href: "/" },
                { label: stateLabel === "Treks" ? (trek.region?.split(",")[0] ?? "Explore") : stateLabel, href: stateHref },
                { label: cmsPage?.trek_name || cmsDisplayName || trek.name },
              ]}
              className="!text-white/90 [&>span>a]:!text-white/80 [&>span>a:hover]:!text-white [&>span>span]:!text-white"
            />
          </div>
        </div>
        <div className="container-wide relative pb-12 text-surface">
          <div className="flex items-center gap-2 mt-3 mb-3 flex-wrap">
            {/* Difficulty badge — full value from CMS column or trek_facts */}
            {(cmsPage?.trek_difficulty || tf.difficulty) && (
              <span className="px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold uppercase tracking-widest">
                {cmsPage?.trek_difficulty || tf.difficulty}
              </span>
            )}
            {/* Suitability badge — only shown when it adds NEW information not already shown
                by the difficulty badge (case-insensitive dedup) */}
            {(() => {
              const diff = (cmsPage?.trek_difficulty || tf.difficulty || "").toLowerCase().trim();
              const suit = (cmsPage?.trek_suitability || (trek.beginner ? "Beginner-friendly" : "")).toLowerCase().trim();
              const label = cmsPage?.trek_suitability || (trek.beginner ? "Beginner-friendly" : "");
              if (!label || suit === diff) return null;
              return (
                <span className="px-3 py-1 rounded-full glass-dark text-xs uppercase tracking-widest">
                  {label}
                </span>
              );
            })()}
            <span className="px-3 py-1 rounded-full glass-dark text-xs uppercase tracking-widest flex items-center gap-1.5">
              <Star className="h-3 w-3 text-accent fill-accent" /> {formatUpdatedAt(effectiveUpdatedAt ?? cmsPage?.published_at)}
            </span>
          </div>
          <h1 className="font-display text-4xl sm:text-5xl md:text-7xl font-semibold leading-[0.95] mb-4 max-w-4xl">
            {cmsDisplayName ?? trek.name}
          </h1>
          <p className="text-base sm:text-lg text-surface/85 max-w-2xl mb-6">{trek.description}</p>
          <TrekCTAs slug={trek.slug} region={trek.region} name={trek.name} />
        </div>
      </section>

      {/* Quick facts sticky strip */}
      <section id="quick-facts-strip" className="bg-card border-b border-border sticky top-16 z-30 hidden md:block">
        <div className="container-wide grid grid-cols-6 divide-x divide-border">
          {facts.map(f => (
            <div key={f.label} className="px-4 py-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
                <f.icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{f.label}</div>
                <div className="text-sm font-semibold">{f.value}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="pt-16 pb-16 md:pt-20 md:pb-20">
        <div className="container-wide grid lg:grid-cols-[200px_1fr_320px] gap-10">

          {/* Left TOC sidebar — client component with scroll spy */}
          <aside className="hidden lg:block">
            <div className="sticky top-44">
              <TableOfContents items={toc} />
            </div>
          </aside>

          <article className="prose prose-lg max-w-none min-w-0">
            {isPremiumGated ? (
              <div className="not-prose my-8">
                <GatedContent
                  title={`${cmsPage!.seo_title ?? trek.name} — Premium Guide`}
                  teaser={cmsPage?.seo_description ?? undefined}
                />
              </div>
            ) : (<>
            <Block id="why-this-trek" eyebrow="Why this trek" title={`Why ${cmsDisplayName ?? trek.name} is on every trekker's list`}>
              {S("why_this_trek") ? (
                <div className="not-prose cms-section" dangerouslySetInnerHTML={{ __html: S("why_this_trek")! }} />
              ) : (
                <>
                  <p>From the snowy summit&apos;s 360° view to the silent pine campsites, this trek delivers the full Himalayan experience in a beginner-friendly window.</p>
                  <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {["Snow guarantee from late December to early April", "Reachable from Delhi in one overnight drive", "Multiple operators, competitive pricing", "Excellent acclimatisation profile"].map(p => (
                      <li key={p} className="flex items-start gap-2 text-base"><Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" /> {p}</li>
                    ))}
                  </ul>
                </>
              )}
            </Block>

            {/* Quick facts — body-level anchor so TOC scroll works */}
            <section id="quick-facts" className="mb-12 scroll-mt-44">
              <div className="text-xs uppercase tracking-[0.25em] text-accent mb-2">Quick facts</div>
              <h2 className="font-display text-3xl md:text-4xl font-semibold leading-tight mb-5">At a glance</h2>
              <div className="not-prose grid grid-cols-2 sm:grid-cols-3 gap-3">
                {facts.filter(f => f.value !== "—").map(f => (
                  <div key={f.label} className="flex items-center gap-3 p-4 bg-card border border-border rounded-2xl">
                    <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
                      <f.icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{f.label}</div>
                      <div className="text-sm font-semibold">{f.value}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Step 72 — structured TrekSage facts (only shown when verified data exists) */}
              {trekProfile && (trekProfile.budget_min || trekProfile.crowd_level || (trekProfile.themes?.length)) && (
                <div className="not-prose flex flex-wrap gap-2 mt-3">
                  {(trekProfile.budget_min || trekProfile.budget_max) && (
                    <span className="px-3 py-1.5 rounded-full bg-surface-muted border border-border text-xs font-medium flex items-center gap-1.5">
                      <Wallet className="h-3.5 w-3.5 text-accent" />
                      {trekProfile.budget_min && trekProfile.budget_max
                        ? `₹${trekProfile.budget_min.toLocaleString("en-IN")} – ₹${trekProfile.budget_max.toLocaleString("en-IN")}`
                        : `From ₹${(trekProfile.budget_min ?? trekProfile.budget_max)!.toLocaleString("en-IN")}`}
                    </span>
                  )}
                  {trekProfile.crowd_level && (
                    <span className="px-3 py-1.5 rounded-full bg-surface-muted border border-border text-xs font-medium capitalize">
                      {trekProfile.crowd_level} crowd
                    </span>
                  )}
                  {trekProfile.themes?.map((theme) => (
                    <span key={theme} className="px-3 py-1.5 rounded-full bg-surface-muted border border-border text-xs font-medium capitalize">
                      {theme}
                    </span>
                  ))}
                </div>
              )}
            </section>

            {/* Step 72 — Trek Detail Q&A widget */}
            <section className="mb-12">
              <TrekAskAI slug={cmsPage?.slug ?? params.slug} trekName={cmsDisplayName ?? trek.name} />
            </section>

            <Block id="route-overview" eyebrow="Route overview" title="The route at a glance">
              {S("route_overview") ? (
                <div className="not-prose cms-section" dangerouslySetInnerHTML={{ __html: S("route_overview")! }} />
              ) : (
                <p>This trek follows a well-established trail from the base village through forested ridgelines to the summit. The path is clearly marked for most of the route.</p>
              )}
              {cmsPage?.route_image_url && (
                <div className="not-prose mt-6">
                  <img
                    src={cmsPage.route_image_url}
                    alt={`${cmsDisplayName ?? trek.name} — trail route map`}
                    className="w-full rounded-2xl border border-border"
                    loading="lazy"
                  />
                </div>
              )}
            </Block>

            <InArticleAdSlot />

            <Block id="itinerary" eyebrow="Day-wise itinerary" title="What each day actually looks like">
              {S("itinerary") ? (
                <div className="not-prose cms-section" dangerouslySetInnerHTML={{ __html: S("itinerary")! }} />
              ) : (
                <p className="text-muted-foreground italic">Detailed itinerary coming soon. Contact us for a day-by-day breakdown.</p>
              )}
            </Block>

            <Block id="best-time" eyebrow="Best time to visit" title="When to go">
              {S("best_time") ? (
                <div className="not-prose cms-section" dangerouslySetInnerHTML={{ __html: S("best_time")! }} />
              ) : (
                <div className="not-prose grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { season: "Dec – Feb", label: "Peak snow", note: "Best for summit views" },
                    { season: "Mar – Apr", label: "Late winter", note: "Lighter crowds" },
                    { season: "May – Jun", label: "Spring", note: "Meadows in bloom" },
                    { season: "Oct – Nov", label: "Autumn", note: "Crisp skies, dry trail" },
                  ].map(s => (
                    <div key={s.season} className="p-4 bg-card border border-border rounded-2xl text-center">
                      <div className="text-xs uppercase tracking-widest text-accent font-semibold">{s.season}</div>
                      <div className="font-semibold text-sm mt-1">{s.label}</div>
                      <div className="text-xs text-muted-foreground mt-1">{s.note}</div>
                    </div>
                  ))}
                </div>
              )}
            </Block>

            <Block id="difficulty" eyebrow="Difficulty & fitness" title="Is this trek right for you?">
              {S("difficulty") ? (
                <div className="not-prose cms-section" dangerouslySetInnerHTML={{ __html: S("difficulty")! }} />
              ) : (
                <div className="not-prose">
                  <p className="text-foreground/85 mb-4">Basic cardiovascular fitness is recommended. No technical climbing experience required.</p>
                  <ul className="space-y-2">
                    {["Can walk/jog 5–8 km without stopping", "No prior Himalayan experience needed", "Acclimatisation built into the itinerary", "Altitude gain per day is gradual"].map(p => (
                      <li key={p} className="flex items-start gap-2 text-sm"><Check className="h-4 w-4 text-success flex-shrink-0 mt-0.5" /> {p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Block>

            <Block id="permits" eyebrow="Permits" title="What permits you need">
              {trekProfile?.permit_required != null && (
                <div className={`not-prose p-5 rounded-2xl border flex gap-3 mb-4 ${trekProfile.permit_required ? "bg-warning/10 border-warning/30" : "bg-success/10 border-success/30"}`}>
                  {trekProfile.permit_required ? <Info className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" /> : <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />}
                  <div className="text-sm min-w-0">
                    {trekProfile.permit_required ? "A permit is required for this trek." : "No special permit is required for this trek."}
                    {trekProfile.permit_notes && <span className="block mt-1 text-foreground/70">{trekProfile.permit_notes}</span>}
                  </div>
                </div>
              )}
              {S("permits") ? (
                <div className="not-prose cms-section" dangerouslySetInnerHTML={{ __html: S("permits")! }} />
              ) : trekProfile?.permit_required == null ? (
                <div className="not-prose p-5 rounded-2xl bg-warning/10 border border-warning/30 flex gap-3 mb-4">
                  <Info className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <div className="text-sm min-w-0">Check with the local forest department for current permit requirements before starting the trek.</div>
                </div>
              ) : null}
            </Block>

            <Block id="cost-estimate" eyebrow="Cost estimate" title="What this trek will cost you">
              {(trekProfile?.budget_min || trekProfile?.budget_max) && (
                <div className="not-prose p-5 rounded-2xl bg-accent/5 border border-accent/20 flex gap-3 mb-4">
                  <Wallet className="h-5 w-5 text-accent flex-shrink-0 mt-0.5" />
                  <div className="text-sm min-w-0">
                    Typical cost for this trek: {trekProfile.budget_min && trekProfile.budget_max
                      ? <strong>₹{trekProfile.budget_min.toLocaleString("en-IN")} – ₹{trekProfile.budget_max.toLocaleString("en-IN")}</strong>
                      : <strong>From ₹{(trekProfile.budget_min ?? trekProfile.budget_max)!.toLocaleString("en-IN")}</strong>}
                    {" "}per person, depending on operator and group size.
                  </div>
                </div>
              )}
              {S("cost_estimate") ? (
                <div className="not-prose cms-section" dangerouslySetInnerHTML={{ __html: S("cost_estimate")! }} />
              ) : (
                <div className="not-prose p-5 rounded-2xl bg-muted/50 border border-border flex gap-3">
                  <Wallet className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-muted-foreground min-w-0">
                    Trek costs vary by operator, group size, and season. <Link href="/plan" className="text-accent underline">Get in touch</Link> for a tailored quote or compare operators on our planning page.
                  </div>
                </div>
              )}
            </Block>

            <Block id="packing" eyebrow="Packing & gear" title="What to pack">
              {S("packing") ? (
                <div className="not-prose cms-section" dangerouslySetInnerHTML={{ __html: S("packing")! }} />
              ) : (
                <div className="not-prose grid grid-cols-1 md:grid-cols-2 gap-2">
                  {["Layered clothing (thermal base, fleece, waterproof shell)", "Trekking poles", "Waterproof trekking boots", "Sunscreen SPF 50+ and UV sunglasses", "Hydration pack or water bottles (2 L minimum)", "First aid kit with altitude medication"].map(item => (
                    <div key={item} className="flex items-start gap-2 text-sm p-3 bg-surface-muted rounded-xl">
                      <Backpack className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" /> {item}
                    </div>
                  ))}
                </div>
              )}
            </Block>

            <Suspense fallback={null}>
              <MonetizationSlot slug={params.slug} sourcePage={pageUrl} />
            </Suspense>

            <Block id="safety" eyebrow="Safety" title="Staying safe on the mountain">
              {S("safety") ? (
                <div className="not-prose cms-section" dangerouslySetInnerHTML={{ __html: S("safety")! }} />
              ) : (
                <div className="not-prose space-y-3">
                  <SafetyDisclaimer />
                  <ul className="space-y-2">
                    {["Register with the Forest Department before entering the trail", "Never trek alone above base camp", "Carry an emergency whistle and headlamp", "Inform your guide of any health conditions"].map(s => (
                      <li key={s} className="flex items-start gap-2 text-sm"><Shield className="h-4 w-4 text-accent flex-shrink-0 mt-0.5" /> {s}</li>
                    ))}
                  </ul>
                </div>
              )}
            </Block>

            {/* Alternatives — vector similarity if available, static fallback.
                Slugs from the cluster sidebar are excluded so the two sections
                never show the same link twice. */}
            <section id="alternatives" className="mb-12 scroll-mt-44">
              <RecommendedContent
                slug={params.slug}
                limit={3}
                excludeSlugs={clusterPages.map((p) => p.slug)}
              />
            </section>

            {/* FAQs — structured accordion when CMS data available, fallback HTML otherwise */}
            <Block id="faqs" eyebrow="FAQs" title="Common questions answered">
              {faqItems.length > 0 ? (
                <div className="not-prose">
                  <FAQAccordion items={faqItems} />
                </div>
              ) : S("faqs") ? (
                <div className="not-prose cms-section" dangerouslySetInnerHTML={{ __html: S("faqs")! }} />
              ) : (
                <p className="text-muted-foreground italic text-sm">No FAQs available yet. <Link href="/contact" className="text-accent underline">Ask us a question</Link>.</p>
              )}
            </Block>

            {/* Latest News — shows when news articles exist for this trek */}
            {trekNewsArticles.length > 0 && (
              <section id="trek-news" className="mb-12 scroll-mt-44">
                <div className="text-xs uppercase tracking-[0.25em] text-accent mb-2">Latest News</div>
                <h2 className="font-display text-3xl md:text-4xl font-semibold leading-tight mb-5">
                  {trek.name} — Latest News
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose">
                  {trekNewsArticles.map((article) => (
                    <a
                      key={article.id}
                      href={`/news/${article.slug}`}
                      className="group block bg-surface-muted rounded-2xl border border-border hover:border-accent/40 p-4 transition-colors"
                    >
                      {/* News thumbnail — fallback to accent gradient when no image */}
                      <div className="relative h-36 rounded-xl overflow-hidden mb-3 bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                        {article.hero_image_url ? (
                          <img
                            src={article.hero_image_url}
                            alt={article.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Newspaper className="h-10 w-10 text-accent/40" />
                        )}
                        <span className="absolute top-2 left-2 bg-accent text-accent-foreground text-xs font-semibold px-2 py-0.5 rounded-full">
                          News
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold leading-snug line-clamp-2 group-hover:text-accent transition-colors mb-1">
                        {article.title}
                      </h3>
                      {article.seo_description && (
                        <p className="text-muted-foreground text-xs line-clamp-2">{article.seo_description}</p>
                      )}
                      <div className="flex items-center gap-1 mt-2 text-accent text-xs font-medium">
                        Read update <ExternalLink className="h-3 w-3" />
                      </div>
                    </a>
                  ))}
                </div>
                <div className="mt-4">
                  <Link href="/news" className="text-accent text-sm font-medium hover:underline flex items-center gap-1">
                    View all trek news <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </section>
            )}

            <TrustSignals
              publishedAt={cmsPage?.published_at}
              updatedAt={cmsPage?.updated_at}
              factChecked={true}
            />

            <AuthorBlock
              publishedAt={cmsPage?.published_at}
              updatedAt={cmsPage?.updated_at}
            />

            {/* Live Conditions — in-page section, part of TOC */}
            <section id="live-conditions" className="not-prose mb-12 scroll-mt-44">
              <LiveConditionsWidget slug={params.slug} />
            </section>

            {/* Trail Conditions — UGC community reports */}
            <section id="trail-conditions" className="not-prose mb-12 scroll-mt-44">
              <TrekReportsSection slug={params.slug} />
            </section>

            {/* Trek Buddy Matching */}
            <section id="trek-buddy" className="not-prose mb-12 scroll-mt-44">
              <BuddySection trekSlug={params.slug} />
            </section>
            </>)}

            {/* Mobile-only Plan CTA — desktop shows this in the right sidebar */}
            <div className="not-prose block lg:hidden mt-8 bg-gradient-pine text-surface rounded-2xl p-6 stack-shadow">
              <div className="text-xs uppercase tracking-widest text-accent-glow mb-2">Plan this trek</div>
              <div className="font-display text-2xl font-semibold mb-4 leading-tight">Get matched with a vetted operator</div>
              <p className="text-sm text-surface/80 mb-5">Free planning help. We respond in 48 hrs.</p>
              <Link href="/plan">
                <Button variant="hero" size="default" className="w-full">Plan My Trek</Button>
              </Link>
              <div className="mt-4 pt-4 border-t border-surface/15 text-xs text-surface/70 flex items-center gap-2">
                <Shield className="h-3 w-3" /> Editorially vetted operators only
              </div>
            </div>
          </article>

          {/* Right utility sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-44">
              <div className="max-h-[calc(100vh-13rem)] overflow-y-auto space-y-4">
                <div className="bg-gradient-pine text-surface rounded-2xl p-6 stack-shadow">
                  <div className="text-xs uppercase tracking-widest text-accent-glow mb-2">Plan this trek</div>
                  <div className="font-display text-2xl font-semibold mb-4 leading-tight">Get matched with a vetted operator</div>
                  <p className="text-sm text-surface/80 mb-5">Free planning help. We respond in 48 hrs.</p>
                  <Link href="/plan">
                    <Button variant="hero" size="default" className="w-full">Plan My Trek</Button>
                  </Link>
                  <div className="mt-4 pt-4 border-t border-surface/15 text-xs text-surface/70 flex items-center gap-2">
                    <Shield className="h-3 w-3" /> Editorially vetted operators only
                  </div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-6">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Quick utilities</div>
                  <div className="space-y-2">
                    {[
                      // Jump to the in-page sections (always rendered) — the per-trek
                      // /packing|/permits|/costs sub-pages 404 unless a dedicated CMS
                      // page exists for this slug, so link to the guaranteed anchors.
                      [Backpack, "Packing checklist", `#packing`],
                      [FileCheck, "Permit guide", `#permits`],
                      [Wallet, "Cost calculator", `#cost-estimate`],
                    ].map(([Icon, label, to]: any) => (
                      <Link key={to} href={to} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors">
                        <span className="flex items-center gap-2.5 text-sm font-medium"><Icon className="h-4 w-4 text-accent" /> {label}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* "In this cluster" — ONLY published trek detail links + this trek's news
                    (as /news/{slug}). news_article is excluded from the linking graph (so
                    clusterPages carries none), and we additionally filter to trek_guide as a
                    belt so a graph-mis-typed page can never render at /trek/. News comes from
                    the trek's own news feed (fetchNewsByTrek) and is routed to /news/{slug}. */}
                {(clusterPages.some((p) => p.page_type === "trek_guide") || trekNewsArticles.length > 0) && (
                  <div className="bg-card border border-border rounded-2xl p-5">
                    <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">In this cluster</div>
                    <div className="space-y-2">
                      {clusterPages
                        .filter((page) => page.page_type === "trek_guide")
                        .map((page) => (
                          <Link
                            key={page.id}
                            href={`/trek/${page.slug}`}
                            className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-muted transition-colors group"
                          >
                            <Mountain className="h-3.5 w-3.5 text-accent flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                                {page.title}
                              </p>
                            </div>
                          </Link>
                        ))}
                      {trekNewsArticles.map((article) => (
                        <Link
                          key={`news-${article.id}`}
                          href={`/news/${article.slug}`}
                          className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-muted transition-colors group"
                        >
                          <Newspaper className="h-3.5 w-3.5 text-accent flex-shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                              {article.title}
                            </p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </aside>
        </div>
      </section>

      <StickyMobileCTA
        label="Plan this trek — free"
        subLabel="Matched with vetted operators. No spam."
        href="/plan"
        dismissKey="trek_sticky_cta"
      />
    </>
  );
}

function formatUpdatedAt(dateStr?: string | null): string {
  if (!dateStr) return "Recently updated";
  const date = new Date(dateStr);
  const diffDays = Math.floor((Date.now() - date.getTime()) / 86_400_000);
  if (diffDays === 0) return "Updated today";
  if (diffDays === 1) return "Updated yesterday";
  if (diffDays < 30) return `Updated ${diffDays} days ago`;
  return `Updated ${formatDate(date)}`;
}

function Block({ id, eyebrow, title, children }: { id: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mb-12 scroll-mt-44">
      <div className="text-xs uppercase tracking-[0.25em] text-accent mb-2">{eyebrow}</div>
      <h2 className="font-display text-3xl md:text-4xl font-semibold leading-tight mb-5">{title}</h2>
      <div className="text-foreground/85 leading-relaxed">{children}</div>
    </section>
  );
}
