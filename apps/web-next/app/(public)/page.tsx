import Link from "next/link";
import { Mountain, Sparkles, ArrowRight, Star, Shield, FileCheck, Backpack, Wallet, Compass, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrekCard } from "@/components/trek/TrekCard";
import { fetchTreks } from "@/lib/trekApi";
import SchemaInjector from "@/components/seo/SchemaInjector";
import { buildWebSiteSchema } from "@/lib/schema";
import HomeSearchBar from "@/components/home/HomeSearchBar";
import PersonalisedFeed from "@/components/content/PersonalisedFeed";
import { SeasonalTreksSection } from "@/components/home/SeasonalTreksSection";
import { DifficultyTabsSection } from "@/components/home/DifficultyTabsSection";

const regions = [
  { name: "Himachal Pradesh", count: "48 treks", image: "/images/region-himachal-camp.jpg", slug: "himachal" },
  { name: "Uttarakhand", count: "62 treks", image: "/images/region-uttarakhand-snow.jpg", slug: "uttarakhand" },
  { name: "Kashmir & Ladakh", count: "29 treks", image: "/images/region-kashmir.jpg", slug: "kashmir" },
  { name: "Sahyadris", count: "70+ treks", image: "/images/region-sahyadri.jpg", slug: "maharashtra" },
  { name: "Sikkim & NE", count: "24 treks", image: "/images/region-ladakh.jpg", slug: "sikkim" },
];

const trustStats = [
  { value: "250+", label: "Trek guides" },
  { value: "32", label: "States & regions" },
  { value: "Weekly", label: "Permit updates" },
  { value: "100%", label: "Editorially reviewed" },
];

export default async function Home() {
  const trekList = await fetchTreks();
  const trending = trekList.slice(0, 4);
  // DifficultyTabsSection and SeasonalTreksSection filter client-side from trekList

  return (
    <>
      <SchemaInjector schemas={[buildWebSiteSchema()]} />
      {/* HERO — 78vh on desktop, 85vh on mobile so content+search are always above fold */}
      <section className="relative min-h-[85vh] md:min-h-[78vh] flex flex-col">
        {/* Background image + gradients */}
        <div className="absolute inset-0 overflow-hidden">
          <img
            src="/images/hero-himalaya-dawn.jpg"
            alt="Himalayan dawn ridge"
            width={1920}
            height={1280}
            className="w-full h-full object-cover object-center"
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

      {/* TRENDING */}
      <Section eyebrow="Trending this month" title="Treks Indians are obsessing over right now" cta={{ label: "View all treks", to: "/explore" }}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {trending.map(t => <TrekCard key={t.slug} trek={t} />)}
        </div>
      </Section>

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

      {/* REGIONS */}
      <Section eyebrow="Explore by geography" title="India's great trekking regions" cta={{ label: "All regions", to: "/regions/himachal" }}>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {regions.map((r) => (
            <Link key={r.slug} href={`/regions/${r.slug}`} className="group relative h-72 overflow-hidden rounded-2xl lift">
              <img src={r.image} alt={r.name} loading="lazy" width={500} height={700} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/20 to-transparent" />
              <div className="absolute bottom-0 inset-x-0 p-5 text-surface">
                <h3 className="font-display text-xl font-semibold leading-tight">{r.name}</h3>
                <div className="text-xs text-accent-glow uppercase tracking-widest mt-1">{r.count}</div>
              </div>
            </Link>
          ))}
        </div>
      </Section>

      {/* DIFFICULTY TABS — Easy | Moderate | Challenging with view-all per tab */}
      <DifficultyTabsSection treks={trekList} />

      {/* EDITORIAL FEATURE */}
      <section className="py-16 md:py-24">
        <div className="container-wide">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <div className="relative h-[520px] rounded-2xl overflow-hidden stack-shadow">
              <img src="/images/trek-summit.jpg" alt="Trekker at Himalayan summit" loading="lazy" width={1200} height={1200} className="w-full h-full object-cover" />
              <div className="absolute top-5 left-5 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs uppercase tracking-widest font-semibold">Editorial spotlight</div>
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-accent mb-4">The first Himalayan trek</div>
              <h2 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-6">What nobody tells you about your first trek above 12,000 ft.</h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-6">Acclimatisation isn&apos;t optional. Cotton kills above the snowline. Our editor walks you through the 11 things that decide whether your first Himalayan trek becomes a story you tell forever.</p>
              <div className="flex flex-wrap items-center gap-4 mb-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-full bg-gradient-pine" />
                  <div><div className="text-foreground font-medium">TrekYatra Editorial</div><div className="text-xs">Verified by our editorial team</div></div>
                </div>
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> 12 min read</span>
                <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-accent fill-accent" /> Updated last week</span>
              </div>
              <Link href="/trek/kedarkantha">
                <Button variant="default" size="lg">Read the guide <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* SEASONAL TABS — auto-select based on current month, shows state tags */}
      <SeasonalTreksSection treks={trekList} />

      {/* PERSONALISED FEED */}
      <Section eyebrow="For you" title="Treks matched to your interests">
        <PersonalisedFeed limit={6} />
      </Section>

      {/* COMPARISON CTA */}
      <section className="py-12 md:py-20 bg-gradient-pine text-surface relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" viewBox="0 0 1200 600" preserveAspectRatio="none">
            <path d="M0,400 L120,340 L240,360 L360,300 L480,340 L600,260 L720,310 L840,250 L960,320 L1080,260 L1200,310 L1200,600 L0,600 Z" fill="hsl(var(--accent))" />
          </svg>
        </div>
        <div className="container-wide relative grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-accent-glow mb-3">Decision-grade comparisons</div>
            {/* Constrained heading — no overflow on any viewport */}
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight mb-4">
              Kedarkantha vs Brahmatal?<br className="hidden sm:block" /> Hampta vs Bhrigu?
            </h2>
            <p className="text-surface/80 text-base leading-relaxed mb-6 max-w-xl">
              Side-by-side comparisons scoring difficulty, scenery, snow probability, beginner-fit, cost, and logistics.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/compare"><Button variant="hero" size="sm">Browse comparisons</Button></Link>
              <Link href="/explore"><Button variant="glass" size="sm">Explore all treks</Button></Link>
            </div>
          </div>

          {/* Comparison cards — 2 cols on all sizes, smaller text + padding on mobile */}
          <div className="grid grid-cols-2 gap-2 md:gap-3 mt-6 lg:mt-0">
            {[
              ["Kedarkantha", "Brahmatal"],
              ["Hampta Pass", "Bhrigu Lake"],
              ["Valley of Flowers", "Hampta Pass"],
              ["Kashmir Lakes", "Sandakphu"],
            ].map(([a, b]) => (
              <Link
                key={a + b}
                href="/compare"
                className="glass-dark rounded-xl p-3 md:p-4 hover:bg-surface/10 transition-colors"
              >
                <div className="text-[10px] uppercase tracking-widest text-accent-glow mb-1.5">vs</div>
                <div className="font-display text-sm md:text-base font-semibold leading-snug">
                  {a}
                </div>
                <div className="text-surface/55 text-xs font-normal font-sans my-1">vs</div>
                <div className="font-display text-sm md:text-base font-semibold leading-snug">
                  {b}
                </div>
                <ChevronRight className="h-3.5 w-3.5 mt-2 text-accent" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* RESOURCES */}
      <Section eyebrow="Free downloads" title="Planning resources, made by trekkers">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { title: "The complete Himalayan packing checklist", type: "PDF · 24 pages", image: "/images/region-uttarakhand-snow.jpg" },
            { title: "First-trek prep — 4 week training plan", type: "PDF · 12 pages", image: "/images/trek-summit.jpg" },
            { title: "India trekking cost calculator (Notion)", type: "Notion template", image: "/images/region-himachal-camp.jpg" },
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
