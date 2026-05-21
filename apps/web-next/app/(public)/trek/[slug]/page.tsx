import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import { TrekCard } from "@/components/trek/TrekCard";
import { Button } from "@/components/ui/button";
import { fetchTreks, fetchTrekBySlug } from "@/lib/trekApi";
import { fetchCMSPage, fetchCMSPages, fetchRelatedPages, type CMSPage, type FAQItem, type RelatedPage } from "@/lib/api";
import { TrekViewTracker } from "@/components/trek/TrekViewTracker";
import TableOfContents from "@/components/content/TableOfContents";
import RecommendedContent from "@/components/content/RecommendedContent";
import FAQAccordion from "@/components/content/FAQAccordion";
import Breadcrumb from "@/components/content/Breadcrumb";
import AuthorBlock from "@/components/content/AuthorBlock";
import SafetyDisclaimer from "@/components/content/SafetyDisclaimer";
import SchemaInjector from "@/components/seo/SchemaInjector";
import InArticleAdSlot from "@/components/monetization/InArticleAdSlot";
import AffiliateRail from "@/components/monetization/AffiliateRail";
import TrustSignals from "@/components/trust/TrustSignals";
import StickyMobileCTA from "@/components/trust/StickyMobileCTA";
import type { AffiliateCardItem } from "@/components/monetization/AffiliateCard";
import { buildArticleSchema, buildFAQSchema, buildBreadcrumbSchema, buildTrekSchema } from "@/lib/schema";
import {
  Clock, TrendingUp, Calendar,
  Shield, FileCheck, Backpack, Wallet, ChevronRight, Star, MapPin,
  Check, Mountain, Info,
} from "lucide-react";
import { TrekCTAs } from "@/components/trek/TrekCTAs";
import type { Trek } from "@/components/trek/TrekCard";

// Allow CMS-published slugs not in static data to be served on-demand (Step 43)
export const dynamicParams = true;
// Revalidate cached pages every 60s so newly published CMS content appears quickly
export const revalidate = 60;

export async function generateStaticParams() {
  const treks = await fetchTreks();
  return treks.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  let cmsPage: CMSPage | null = null;
  try {
    const page = await fetchCMSPage(params.slug);
    if (page.status === "published") cmsPage = page;
  } catch { /* not found */ }

  const trekRaw = await fetchTrekBySlug(params.slug).catch(() => null);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://trekyatra.com";
  // Strip any trailing "| TrekYatra" the LLM wrote into seo_title before appending our own suffix.
  const rawSeoTitle = cmsPage?.seo_title?.replace(/\s*\|\s*TrekYatra\s*$/i, "").trim();
  const title = rawSeoTitle
    ? `${rawSeoTitle} | TrekYatra`
    : trekRaw?.name
    ? `${trekRaw.name} — Trek Guide | TrekYatra`
    : `${params.slug.replace(/-/g, " ")} | TrekYatra`;
  const description = cmsPage?.seo_description ?? trekRaw?.description ?? "";
  const canonicalUrl = `${siteUrl}/treks/${params.slug}`;
  const ogImage = cmsPage?.hero_image_url ?? trekRaw?.image ?? null;

  const hasHiTranslation = !!(cmsPage?.translations?.hi);

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
      ...(ogImage ? { images: [{ url: ogImage, width: 1200, height: 630 }] } : {}),
    },
    twitter: { card: "summary_large_image", title, description },
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

  if (!trekRaw && !cmsPage) notFound();

  // Issue 2 — Deduplication: when a static trek exists at this slug BUT no CMS page
  // exists here, check if the pipeline created a richer CMS page whose slug starts with
  // this slug (e.g. kedarkantha-trek-complete-guide starts with kedarkantha).
  // If found → 301 redirect to the CMS page URL so Google only indexes one canonical URL.
  // With our _slugify fix, future pipeline runs create pages at the same canonical slug,
  // so this redirect only activates for pages created before the fix.
  if (trekRaw && !cmsPage) {
    try {
      const allGuides = await fetchCMSPages({ page_type: "trek_guide", status: "published", limit: 100 });
      const cmsVersion = allGuides.find(
        (p) => p.slug !== params.slug && p.slug.startsWith(params.slug)
      );
      if (cmsVersion) {
        permanentRedirect(`/trek/${cmsVersion.slug}`);
      }
    } catch { /* API unavailable — render static fallback */ }
  }

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
  ];

  const sec = (cmsPage?.content_json?.sections ?? {}) as Record<string, string>;
  const S = (key: string) => sec[key] || null;

  // Structured FAQ items from CMS (auto-extracted or editor-supplied)
  const faqItems: FAQItem[] = cmsPage?.content_json?.faqs ?? [];

  const gearItems: AffiliateCardItem[] = [
    { title: "Quechua SH900 Trek Jacket", description: "Waterproof, windproof — rated for high-altitude winters.", affiliateUrl: "/gear", price: "From ₹4,999", badge: "Editor's pick" },
    { title: "Tata Trekking Pole Set", description: "Adjustable, shock-absorbing — ideal for steep descents.", affiliateUrl: "/gear", price: "From ₹1,499" },
    { title: "Wildcraft Trekking Backpack 55L", description: "Rain-cover included, structured hip belt for load distribution.", affiliateUrl: "/gear", price: "From ₹3,299" },
  ];

  // JSON-LD schemas
  const pageUrl = `/treks/${params.slug}`;
  const articleSchema = buildArticleSchema({
    title: cmsPage?.seo_title ?? trek.name,
    description: cmsPage?.seo_description ?? trek.description ?? "",
    url: pageUrl,
    publishedAt: cmsPage?.published_at ?? undefined,
    updatedAt: cmsPage?.updated_at ?? undefined,
    imageUrl: cmsPage?.hero_image_url ?? trek.image ?? undefined,
  });

  // TouristTrip schema — enriches Article with trek-specific structured data
  // following Schema.org/TouristTrip + Google structured data guidelines.
  const trekSchema = buildTrekSchema({
    name:        cmsPage?.trek_name ?? cmsDisplayName ?? trek.name,
    description: cmsPage?.seo_description ?? trek.description ?? "",
    url:         pageUrl,
    imageUrl:    cmsPage?.hero_image_url ?? trek.image ?? undefined,
    publishedAt: cmsPage?.published_at ?? undefined,
    updatedAt:   cmsPage?.updated_at ?? undefined,
    duration:    tf.duration    || trek.duration    || null,
    altitude:    tf.altitude    || trek.altitude    || null,
    difficulty:  cmsPage?.trek_difficulty || tf.difficulty  || trek.difficulty || null,
    season:      cmsPage?.trek_season     || tf.season      || trek.season     || null,
    permits:     tf.permits     || null,
    base:        tf.base        || null,
    trekState:   cmsPage?.trek_state || trek.state || null,
    suitability: cmsPage?.trek_suitability || null,
  });

  const faqSchema = faqItems.length ? buildFAQSchema(faqItems) : null;
  // Map canonical state names to the region slug used in /regions/[slug].
  // This prevents wrong-page links when trek_state has an LLM misspelling
  // like "Uttrakhand" that would otherwise fall through to the Himachal fallback.
  const STATE_TO_REGION_SLUG: Record<string, string> = {
    "Uttarakhand": "uttarakhand",  "Uttrakhand": "uttarakhand",
    "Himachal Pradesh": "himachal", "Himachal": "himachal",
    "Jammu & Kashmir": "kashmir",   "Ladakh": "ladakh",
    "Maharashtra": "maharashtra",   "Sikkim": "sikkim",
    "West Bengal": "west-bengal",   "Karnataka": "karnataka",
  };
  const stateLabel = cmsPage?.trek_state || trek.state || "Treks";
  const regionSlug = STATE_TO_REGION_SLUG[stateLabel]
    ?? stateLabel.toLowerCase().replace(/\s+/g, "-");
  const stateHref = stateLabel !== "Treks" ? `/regions/${regionSlug}` : "/explore";
  const breadcrumbSchema = buildBreadcrumbSchema([
    { label: "Home", href: "/" },
    { label: stateLabel === "Treks" ? "Explore" : stateLabel, href: stateHref },
    { label: cmsPage?.trek_name || cmsDisplayName || trek.name },
  ]);

  return (
    <>
      {/* Invisible behavior tracker — records this trek visit for cookie-based personalisation */}
      <TrekViewTracker
        slug={trek.slug}
        title={cmsDisplayName ?? trek.name}
        region={trek.region}
        difficulty={trek.difficulty}
        season={trek.season}
      />
      <SchemaInjector schemas={[articleSchema, trekSchema, faqSchema, breadcrumbSchema]} />
      {/* Hero */}
      <section className="relative h-[78vh] min-h-[600px] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src={heroImg} alt={trek.name} className="w-full h-full object-cover" width={1920} height={1080} />
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
              <Star className="h-3 w-3 text-accent fill-accent" /> {formatUpdatedAt(cmsPage?.published_at ?? cmsPage?.updated_at)}
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
            </section>

            <Block id="route-overview" eyebrow="Route overview" title="The route at a glance">
              {S("route_overview") ? (
                <div className="not-prose cms-section" dangerouslySetInnerHTML={{ __html: S("route_overview")! }} />
              ) : (
                <p>This trek follows a well-established trail from the base village through forested ridgelines to the summit. The path is clearly marked for most of the route.</p>
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
              {S("permits") ? (
                <div className="not-prose cms-section" dangerouslySetInnerHTML={{ __html: S("permits")! }} />
              ) : (
                <div className="not-prose p-5 rounded-2xl bg-warning/10 border border-warning/30 flex gap-3 mb-4">
                  <Info className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                  <div className="text-sm min-w-0">Check with the local forest department for current permit requirements before starting the trek.</div>
                </div>
              )}
            </Block>

            <Block id="cost-estimate" eyebrow="Cost estimate" title="What this trek will cost you">
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

            <AffiliateRail items={gearItems} title="Recommended gear for this trek" />

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

            {/* Alternatives — vector similarity if available, static fallback */}
            <section id="alternatives" className="mb-12 scroll-mt-44">
              <RecommendedContent slug={params.slug} limit={3} />
              {/* Static fallback shown only when RecommendedContent returns nothing */}
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

            <TrustSignals
              publishedAt={cmsPage?.published_at}
              updatedAt={cmsPage?.updated_at}
              factChecked={true}
            />

            <AuthorBlock
              publishedAt={cmsPage?.published_at}
              updatedAt={cmsPage?.updated_at}
            />
          </article>

          {/* Right utility sidebar */}
          <aside className="hidden lg:block">
            <div className="sticky top-44">
              <div className="max-h-[calc(100vh-13rem)] overflow-y-auto space-y-4">
                <div className="bg-gradient-pine text-surface rounded-2xl p-6 stack-shadow">
                  <div className="text-xs uppercase tracking-widest text-accent-glow mb-2">Plan this trek</div>
                  <div className="font-display text-2xl font-semibold mb-4 leading-tight">Get matched with a vetted operator</div>
                  <p className="text-sm text-surface/80 mb-5">Free planning help. We respond in 48 hrs.</p>
                  <Button variant="hero" size="default" className="w-full">Plan My Trek</Button>
                  <div className="mt-4 pt-4 border-t border-surface/15 text-xs text-surface/70 flex items-center gap-2">
                    <Shield className="h-3 w-3" /> Editorially vetted operators only
                  </div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-6">
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Quick utilities</div>
                  <div className="space-y-2">
                    {[
                      [Backpack, "Packing checklist", `/trek/${params.slug}/packing`],
                      [FileCheck, "Permit guide", `/trek/${params.slug}/permits`],
                      [Wallet, "Cost calculator", `/trek/${params.slug}/costs`],
                    ].map(([Icon, label, to]: any) => (
                      <Link key={to} href={to} className="flex items-center justify-between p-3 rounded-xl hover:bg-muted transition-colors">
                        <span className="flex items-center gap-2.5 text-sm font-medium"><Icon className="h-4 w-4 text-accent" /> {label}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* "In this cluster" — related CMS pages in the same content cluster */}
                {clusterPages.length > 0 && (
                  <div className="bg-card border border-border rounded-2xl p-5">
                    <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">In this cluster</div>
                    <div className="space-y-2">
                      {clusterPages.map((page) => {
                        const href =
                          page.page_type === "trek_guide" ? `/trek/${page.slug}` :
                          page.page_type === "packing_list" ? `/packing/${page.slug}` :
                          page.page_type === "permit_guide" ? `/permits/${page.slug}` :
                          `/guides/${page.slug}`;
                        return (
                          <Link
                            key={page.id}
                            href={href}
                            className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-muted transition-colors group"
                          >
                            <Mountain className="h-3.5 w-3.5 text-accent flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                                {page.title}
                              </p>
                            </div>
                          </Link>
                        );
                      })}
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
  return `Updated ${date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`;
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
