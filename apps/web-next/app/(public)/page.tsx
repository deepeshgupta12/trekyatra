// Always render fresh — never serve a build-time static snapshot that was
// generated when the backend wasn't running (CMS pages would be empty → stubs).
export const dynamic = "force-dynamic";

import Link from "next/link";
import Image from "next/image";
import { Mountain, Sparkles, ArrowRight, Star, Shield, FileCheck, Backpack, Wallet, Compass, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrekCard } from "@/components/trek/TrekCard";
import { fetchTreks } from "@/lib/trekApi";
import { fetchCMSPages, fetchTrendingTreks, fetchTrekCMSOverrides, fetchTrekStateCounts, type CMSTrekCard, type CMSTrekOverride } from "@/lib/api";
import SchemaInjector from "@/components/seo/SchemaInjector";
import { buildWebSiteSchema } from "@/lib/schema";
import HomeSearchBar from "@/components/home/HomeSearchBar";
import { SeasonalTreksSection } from "@/components/home/SeasonalTreksSection";
import { DifficultyTabsSection } from "@/components/home/DifficultyTabsSection";
import { HomeWelcomeBanner } from "@/components/home/HomeWelcomeBanner";
import { HomeTrendingHeader } from "@/components/home/HomeTrendingHeader";
import HomeComparisonsSection, { type HomeComparisonCard } from "@/components/home/HomeComparisonsSection";
import makeDynamic from "next/dynamic";

// Below-fold client components deferred to reduce initial JS bundle and TBT
const RecentlyViewedSection = makeDynamic(
  () => import("@/components/home/RecentlyViewedSection").then(m => m.RecentlyViewedSection),
  { ssr: false }
);
const PersonalisedFeed = makeDynamic(
  () => import("@/components/content/PersonalisedFeed"),
  { ssr: false }
);

// Per-state metadata for the dynamic regions section. Counts come live from the API
// (fetchTrekStateCounts); this only maps a state → its real image + /regions/ slug.
// A state not listed here still appears (slugified, default image) so newly-introduced
// states show up automatically — redirections stay on the /regions/{slug} pattern.
const STATE_META: Record<string, { slug: string; image: string }> = {
  "Uttarakhand": { slug: "uttarakhand", image: "/images/region-uttarakhand-snow.webp" },
  "Himachal Pradesh": { slug: "himachal", image: "/images/region-himachal-camp.webp" },
  "Ladakh": { slug: "ladakh", image: "/images/region-ladakh.webp" },
  "Jammu & Kashmir": { slug: "kashmir", image: "/images/region-kashmir.webp" },
  "Kashmir": { slug: "kashmir", image: "/images/region-kashmir.webp" },
  "Maharashtra": { slug: "maharashtra", image: "/images/region-sahyadri.webp" },
  "Sikkim": { slug: "sikkim", image: "/images/region-ladakh.webp" },
  "West Bengal": { slug: "west-bengal", image: "/images/region-ladakh.webp" },
};
const DEFAULT_REGION_IMAGE = "/images/region-himachal-camp.webp";
function slugifyState(s: string): string {
  return s.toLowerCase().replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const trustStats = [
  { value: "250+", label: "Trek guides" },
  { value: "32", label: "States & regions" },
  { value: "Weekly", label: "Permit updates" },
  { value: "100%", label: "Editorially reviewed" },
];

export default async function Home() {
  const [trekList, cmsTrekPages, trendingCMS, cmsOverrides, stateCounts, comparisonPages] = await Promise.all([
    fetchTreks(),
    fetchCMSPages({ page_type: "trek_guide", status: "published", limit: 50 }).catch(() => []),
    fetchTrendingTreks(4).catch((): CMSTrekCard[] => []),
    fetchTrekCMSOverrides().catch((): Record<string, CMSTrekOverride> => ({})),
    fetchTrekStateCounts().catch(() => []),
    fetchCMSPages({ page_type: "comparison", status: "published", limit: 60 }).catch(() => []),
  ]);

  // #3 Home comparisons — build cards from REAL published /compare/[pair] pages,
  // flagging any comparison that involves a currently-trending trek (server signal).
  // The client component re-ranks by the viewer's difficulty/region behavior.
  const trendingSlugs = new Set(trendingCMS.map((t) => t.slug));
  const comparisonCards: HomeComparisonCard[] = comparisonPages
    .map((p): HomeComparisonCard | null => {
      const c = (p.content_json as { comparison?: { trek_a?: Record<string, unknown>; trek_b?: Record<string, unknown> } } | null)?.comparison;
      const a = c?.trek_a as { slug?: string; name?: string; difficulty?: string; state?: string } | undefined;
      const b = c?.trek_b as { slug?: string; name?: string; difficulty?: string } | undefined;
      if (!a?.name || !b?.name) return null;
      return {
        slug: p.slug,
        aName: a.name,
        bName: b.name,
        aDifficulty: a.difficulty,
        bDifficulty: b.difficulty,
        state: a.state,
        trending: (a.slug ? trendingSlugs.has(a.slug) : false) || (b.slug ? trendingSlugs.has(b.slug) : false),
      };
    })
    .filter((c): c is HomeComparisonCard => c !== null);

  // Interactive-tool fallback pairs (used only when no clean comparison pages exist yet).
  const comparisonFallback = [
    { a: "Kedarkantha", b: "Brahmatal", slugs: "kedarkantha,brahmatal" },
    { a: "Hampta Pass", b: "Bhrigu Lake", slugs: "hampta-pass,bhrigu-lake" },
    { a: "Valley of Flowers", b: "Hampta Pass", slugs: "valley-of-flowers,hampta-pass" },
    { a: "Kashmir Lakes", b: "Sandakphu", slugs: "kashmir-great-lakes,sandakphu" },
  ];

  // #1 Dynamic regions — real states + live counts + real images, sorted by count.
  // New states appear automatically as treks publish; redirects stay /regions/{slug}.
  const regionCards = stateCounts
    .filter((s) => s.count > 0)
    .slice(0, 8)
    .map((s) => {
      const meta = STATE_META[s.state];
      return {
        name: s.state,
        count: `${s.count} trek${s.count !== 1 ? "s" : ""}`,
        image: meta?.image ?? DEFAULT_REGION_IMAGE,
        slug: meta?.slug ?? slugifyState(s.state),
      };
    });
  const regionsAllHref = `/regions/${regionCards[0]?.slug ?? "uttarakhand"}`;

  // #2 Editorial spotlight — feature a REAL published trek guide end-to-end:
  // real hero image, real name, real excerpt, real difficulty/duration chips, real
  // "updated" date, and a link to the actual guide. Prefer a high-altitude guide
  // (matches the "first trek above 12,000 ft" hook) then fall back to newest.
  const editorialCandidates = [...cmsTrekPages]
    .filter((p) => p.hero_image_url && (p.seo_description || p.trek_name))
    .sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
  const editorialSource =
    editorialCandidates.find((p) =>
      /12,?000|13,?000|14,?000|15,?000|high[- ]altitude|snow line|acclimati/i.test(
        `${p.seo_description ?? ""} ${p.trek_name ?? ""}`
      )
    ) ?? editorialCandidates[0];
  const hasRealEditorial = !!editorialSource;
  const editorialImage = editorialSource?.hero_image_url ?? "/images/trek-summit.webp";
  const editorialName = editorialSource?.trek_name ?? editorialSource?.title ?? "";
  const editorialExcerpt = editorialSource?.seo_description ?? "";
  const editorialUpdated = editorialSource?.updated_at
    ? new Date(editorialSource.updated_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
    : null;

  // Robust fallback: apply CMS overrides to static list so images/names are always real
  const staticEnhanced = trekList.slice(0, 4).map(t => {
    const ov = cmsOverrides[t.slug];
    if (!ov) return t;
    return {
      ...t,
      image:       ov.image       ?? t.image,
      name:        ov.title       ?? t.name,
      difficulty:  ov.difficulty  ?? t.difficulty,
      duration:    ov.duration    ?? t.duration,
      season:      ov.season      ?? t.season,
      altitude:    ov.altitude    ?? t.altitude,
      suitability: ov.suitability,
    };
  });

  // trending: prefer CMS trending API → then published CMS trek pages → then static fallback
  const cmsTrendingFallback = cmsTrekPages.slice(0, 4).map(p => ({
    slug: p.slug,
    name: p.trek_name || p.title,
    difficulty: p.trek_difficulty ?? "Moderate",
    duration: p.trek_duration ?? "",
    altitude: "",
    region: p.trek_state ?? "",
    state: p.trek_state ?? "",
    season: p.trek_season ?? "",
    description: p.seo_description ?? "",
    image: p.hero_image_url ?? "",
    suitability: p.trek_suitability ?? undefined,
    tags: [] as string[],
  }));

  const trending = trendingCMS.length > 0
    ? trendingCMS.map(t => ({
        ...t, name: t.name, difficulty: t.difficulty ?? "Moderate",
        region: t.region ?? t.state, description: t.description,
      }))
    : cmsTrendingFallback.length > 0
      ? cmsTrendingFallback
      : staticEnhanced;

  // Build slug → hero_image_url map from CMS pages so RecentlyViewedSection can
  // show images for CMS-only treks that aren't in the 12-item static trekList.
  const cmsImageMap: Record<string, string> = {};
  for (const p of cmsTrekPages) {
    if (p.slug && p.hero_image_url) cmsImageMap[p.slug] = p.hero_image_url;
  }

  return (
    <>
      <SchemaInjector schemas={[buildWebSiteSchema()]} />
      {/* HERO — reduced height; content always above fold */}
      <section className="relative min-h-[65vh] md:min-h-[55vh] flex flex-col">
        {/* Background image + gradients */}
        <div className="absolute inset-0 overflow-hidden">
          <Image
            src="/images/hero-himalaya-dawn.jpg"
            alt="Himalayan dawn ridge"
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/95 via-foreground/40 to-foreground/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/50 via-transparent to-transparent" />
        </div>

        {/* Main content — vertically centred in the available space */}
        <div className="container-wide relative z-10 flex-1 flex flex-col justify-center pt-20 pb-16 text-surface">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-dark text-[11px] uppercase tracking-widest mb-5">
              <Sparkles className="h-3 w-3 text-accent-glow" />
              Explore. Dream. Discover.
            </div>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[64px] font-semibold leading-[0.95] tracking-tight mb-5">
              Find the right trail.<br />
              <span className="text-gradient-saffron">Walk it with confidence.</span>
            </h1>
            <p className="text-base md:text-lg text-surface/80 max-w-2xl leading-relaxed mb-8">
              Discover, compare and plan India&apos;s best treks — from the Sahyadri&apos;s monsoon ridges to high Himalayan snow passes. Trail-tested guides, real permit updates, honest cost notes.
            </p>
          </div>
          <HomeSearchBar />
        </div>

        {/* Trust stats — pinned to the bottom of the hero */}
        <div className="relative z-10 mt-auto">
          <div className="container-wide">
            <div className="border-t border-surface/15 py-5 grid grid-cols-2 md:grid-cols-4 gap-6">
              {trustStats.map((s) => (
                <div key={s.label} className="text-surface">
                  <div className="font-display text-2xl md:text-3xl font-semibold text-accent-glow">{s.value}</div>
                  <div className="text-xs uppercase tracking-widest text-surface/60">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* WELCOME BANNER — logged-in users only (States A + B) */}
      <HomeWelcomeBanner />

      {/* TRENDING — heading personalised per user state via client component */}
      <section className="py-16 md:py-24">
        <div className="container-wide">
          <HomeTrendingHeader cta={{ label: "View all treks", to: "/explore" }} />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {trending.map(t => <TrekCard key={t.slug} trek={t} />)}
          </div>
        </div>
      </section>

      {/* TREKSAGE AI BANNER */}
      <section className="py-14 md:py-20 bg-[#0c0e14] border-y border-white/5">
        <div className="container-wide">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-[11px] uppercase tracking-widest mb-5">
                <Sparkles className="h-3 w-3" />
                AI-powered
              </div>
              <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-semibold text-white leading-tight mb-4">
                Meet TrekSage.<br />
                <span className="text-gradient-saffron">Your AI trek planner.</span>
              </h2>
              <p className="text-white/50 text-base max-w-lg mb-6 mx-auto lg:mx-0">
                Compare treks, plan an itinerary, check permits, get packing advice — TrekSage uses real TrekYatra data to answer in seconds.
              </p>
              <Link href="/treksage">
                <Button variant="hero" size="lg" className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Ask TrekSage
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="flex-1 w-full max-w-md lg:max-w-none">
              <div className="bg-[#0f1117] rounded-2xl border border-white/10 p-4 space-y-2.5">
                {[
                  "Plan a Himalayan trek for July with 6 days",
                  "Compare Hampta Pass vs Kedarkantha",
                  "Best beginner treks in Uttarakhand under ₹10k",
                ].map((prompt) => (
                  <Link
                    key={prompt}
                    href={`/treksage?q=${encodeURIComponent(prompt)}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-white/3 hover:bg-white/6 border border-white/8 hover:border-accent/30 transition-colors group"
                  >
                    <div className="h-6 w-6 rounded-full bg-accent/10 flex-shrink-0 flex items-center justify-center">
                      <Sparkles className="h-3 w-3 text-accent" />
                    </div>
                    <span className="text-white/60 text-sm group-hover:text-white/90 transition-colors flex-1">{prompt}</span>
                    <ArrowRight className="h-3 w-3 text-transparent group-hover:text-accent/60 transition-colors" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORY HUB */}
      <section className="py-16 md:py-24 bg-surface-muted">
        <div className="container-wide">
          <div className="grid lg:grid-cols-3 gap-8 items-center mb-12">
            <div className="lg:col-span-2">
              <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">Plan with confidence</div>
              <h2 className="font-display text-4xl md:text-5xl font-semibold leading-tight">Five trust pillars. Every trek you choose.</h2>
            </div>
            <p className="text-muted-foreground text-base">We don&apos;t just tell you where to go. We tell you when, how, what to pack, what it&apos;ll cost, and what permits you need — all updated weekly.</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { icon: Backpack, title: "Packing", desc: "Season-tuned checklists", to: "/packing" },
              { icon: FileCheck, title: "Permits", desc: "Verified, updated weekly", to: "/permits" },
              { icon: Wallet, title: "Costs", desc: "Honest budget breakdowns", to: "/costs" },
              { icon: Shield, title: "Safety", desc: "Altitude, weather, evac", to: "/safety" },
              { icon: Compass, title: "Plan My Trek", desc: "Custom human help", to: "/plan" },
            ].map((p) => (
              <Link key={p.to} href={p.to} className="group p-6 bg-card rounded-2xl border border-border lift">
                <div className="h-11 w-11 rounded-xl bg-gradient-saffron flex items-center justify-center mb-4 shadow-md-soft">
                  <p.icon className="h-5 w-5 text-accent-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-1">{p.title}</h3>
                <p className="text-xs text-muted-foreground mb-3">{p.desc}</p>
                <div className="text-xs text-accent flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  Open <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* REGIONS — dynamic: real states + live counts + real images (#1) */}
      {regionCards.length > 0 && (
        <Section eyebrow="Explore by geography" title="India's great trekking regions" cta={{ label: "All regions", to: regionsAllHref }}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {regionCards.map((r) => (
              <Link key={r.slug} href={`/regions/${r.slug}`} className="group relative h-72 overflow-hidden rounded-2xl lift">
                <img src={r.image} alt={`${r.name} treks`} loading="lazy" width={500} height={700} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/20 to-transparent" />
                <div className="absolute bottom-0 inset-x-0 p-5 text-surface">
                  <h3 className="font-display text-xl font-semibold leading-tight">{r.name}</h3>
                  <div className="text-xs text-accent-glow uppercase tracking-widest mt-1">{r.count}</div>
                </div>
              </Link>
            ))}
          </div>
        </Section>
      )}

      {/* DIFFICULTY TABS — Easy | Moderate | Challenging with view-all per tab */}
      <DifficultyTabsSection treks={trekList} cmsPages={cmsTrekPages} />

      {/* EDITORIAL FEATURE */}
      <section className="py-16 md:py-24">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="relative h-[520px] rounded-2xl overflow-hidden stack-shadow">
              <img src={editorialImage} alt={hasRealEditorial ? `${editorialName} trek` : "Trekker at Himalayan summit"} loading="lazy" width={1200} height={1200} className="w-full h-full object-cover" />
              <div className="absolute top-5 left-5 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs uppercase tracking-widest font-semibold">Editorial spotlight</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-accent mb-4">
                {hasRealEditorial ? (editorialSource!.trek_state ?? "Featured trek guide") : "The first Himalayan trek"}
              </div>
              {hasRealEditorial ? (
                <>
                  <h2 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-6">{editorialName}</h2>
                  {editorialExcerpt && (
                    <p className="text-muted-foreground text-lg leading-relaxed mb-6">{editorialExcerpt}</p>
                  )}
                  {/* Real, verifiable chips — no invented stats */}
                  <div className="flex flex-wrap items-center gap-2.5 mb-8 text-sm">
                    {editorialSource!.trek_difficulty && (
                      <span className="px-3 py-1 rounded-full bg-accent/10 text-accent font-medium">{editorialSource!.trek_difficulty}</span>
                    )}
                    {editorialSource!.trek_duration && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground"><Clock className="h-3.5 w-3.5" /> {editorialSource!.trek_duration}</span>
                    )}
                    {editorialUpdated && (
                      <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted text-muted-foreground"><Star className="h-3.5 w-3.5 text-accent fill-accent" /> Updated {editorialUpdated}</span>
                    )}
                  </div>
                  <Link href={`/trek/${editorialSource!.slug}`}>
                    <Button variant="default" size="lg">Read the full guide <ArrowRight className="h-4 w-4" /></Button>
                  </Link>
                </>
              ) : (
                <>
                  <h2 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-6">What nobody tells you about your first trek above 12,000 ft.</h2>
                  <p className="text-muted-foreground text-lg leading-relaxed mb-6">Acclimatisation isn&apos;t optional. Cotton kills above the snowline. Our editors walk you through what decides whether your first Himalayan trek becomes a story you tell forever.</p>
                  <Link href="/beginner">
                    <Button variant="default" size="lg">Explore beginner treks <ArrowRight className="h-4 w-4" /></Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* SEASONAL TABS — auto-select based on current month, shows state tags */}
      <SeasonalTreksSection treks={trekList} cmsPages={cmsTrekPages} />

      {/* RECENTLY VIEWED — State D only (repeat logged-out): horizontal scroll of last 5 viewed treks */}
      <RecentlyViewedSection trekList={trekList} cmsImageMap={cmsImageMap} />

      {/* PERSONALISED FEED — States A+B+D; hidden for State C (new logged-out, no behavior).
          PersonalisedFeed manages its own section wrapper + heading so the Section title
          never renders for State C (when PersonalisedFeed returns null). */}
      <PersonalisedFeed limit={6} />

      {/* COMPARISON — enhanced + personalized, links to clean /compare/[pair] pages (#3) */}
      <HomeComparisonsSection comparisons={comparisonCards} fallbackPairs={comparisonFallback} />

      {/* RESOURCES */}
      <Section eyebrow="Free downloads" title="Planning resources, made by trekkers">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { title: "The complete Himalayan packing checklist", type: "PDF · 24 pages", image: "/images/region-uttarakhand-snow.webp" },
            { title: "First-trek prep — 4 week training plan", type: "PDF · 12 pages", image: "/images/trek-summit.webp" },
            { title: "India trekking cost calculator (Notion)", type: "Notion template", image: "/images/region-himachal-camp.webp" },
          ].map((r) => (
            <div key={r.title} className="group bg-card border border-border rounded-2xl lift overflow-hidden">
              <div className="relative h-44 overflow-hidden">
                <img src={r.image} alt={r.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                <div className="absolute bottom-3 left-4">
                  <span className="text-[10px] uppercase tracking-widest text-surface/80 font-semibold bg-black/30 backdrop-blur-sm px-2.5 py-1 rounded-full">{r.type}</span>
                </div>
              </div>
              <div className="p-5">
                <h3 className="font-display text-lg font-semibold leading-snug mb-4">{r.title}</h3>
                <Link href="/products" className="w-full">
                  <Button variant="outline" size="sm" className="w-full">Download free</Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* OPERATORS */}
      <section className="py-16 md:py-20 bg-surface-muted">
        <div className="container-wide text-center">
          <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">Vetted operators</div>
          <h2 className="font-display text-3xl md:text-4xl font-semibold leading-tight mb-4">Find your guide. Trek with confidence.</h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">Browse rated operators across Uttarakhand, Himachal, and beyond. Send a free inquiry — response within 48 hours.</p>
          <Link href="/operators"><Button variant="hero" size="lg">Browse operators <ArrowRight className="h-4 w-4" /></Button></Link>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20">
        <div className="container-narrow">
          <div className="relative rounded-3xl overflow-hidden p-10 md:p-16 bg-gradient-twilight text-surface text-center">
            <div className="absolute inset-0 opacity-30">
              <img src="/images/hero-himalaya-dawn.jpg" alt="" className="w-full h-full object-cover" />
            </div>
            <div className="relative">
              <Mountain className="h-10 w-10 mx-auto mb-6 text-accent" />
              <h2 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-5">
                Not sure where to start? <br /><span className="text-gradient-saffron">Let us plan it.</span>
              </h2>
              <p className="text-surface/80 max-w-xl mx-auto mb-8 text-lg">Tell us your fitness, dates, and budget. We&apos;ll match you to the right trek and the right operator — free, in 48 hours.</p>
              <Link href="/plan"><Button variant="hero" size="xl"><Sparkles className="h-4 w-4" /> Plan My Trek</Button></Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

function Section({ eyebrow, title, cta, children, muted = false }: {
  eyebrow: string; title: string; cta?: { label: string; to: string }; children: React.ReactNode; muted?: boolean;
}) {
  return (
    <section className={`py-16 md:py-24 ${muted ? "bg-surface-muted" : ""}`}>
      <div className="container-wide">
        <div className="flex items-end justify-between mb-10 gap-6">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">{eyebrow}</div>
            <h2 className="font-display text-3xl md:text-5xl font-semibold leading-tight">{title}</h2>
          </div>
          {cta && (
            <Link href={cta.to} className="hidden md:flex items-center gap-1 text-sm font-medium text-foreground/80 hover:text-accent transition-colors whitespace-nowrap">
              {cta.label} <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
        {children}
      </div>
    </section>
  );
}
