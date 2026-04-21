import Link from "next/link";
import { Search, MapPin, Calendar, Mountain, Sparkles, ArrowRight, Star, Shield, FileCheck, Backpack, Wallet, Compass, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TrekCard } from "@/components/trek/TrekCard";
import { fetchTreks } from "@/lib/trekApi";

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
  const beginner = trekList.filter((t) => t.beginner);
  const monsoon = trekList.filter((t) => t.state === "Maharashtra");

  return (
    <>
      {/* HERO */}
      <section className="relative min-h-[88vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          <img src="/images/hero-himalaya-dawn.jpg" alt="Himalayan dawn ridge" width={1920} height={1280} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/30 to-foreground/40" />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 via-transparent to-transparent" />
        </div>

        <div className="container-wide relative z-10 pb-16 pt-32 text-surface">
          <div className="max-w-3xl animate-fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-dark text-xs uppercase tracking-widest mb-6">
              <Sparkles className="h-3 w-3 text-accent-glow" />
              India&apos;s editorial trekking companion
            </div>
            <h1 className="font-display text-5xl md:text-7xl lg:text-[88px] font-semibold leading-[0.95] tracking-tight mb-6">
              Find the right trail.<br />
              <span className="text-gradient-saffron">Walk it with confidence.</span>
            </h1>
            <p className="text-lg md:text-xl text-surface/85 max-w-2xl leading-relaxed mb-10">
              Discover, compare and plan India&apos;s best treks — from the Sahyadri&apos;s monsoon ridges to high Himalayan snow passes. Trail-tested guides, real permit updates, honest cost notes.
            </p>
          </div>

          <div className="relative max-w-4xl animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <div className="absolute -inset-2 bg-accent/20 blur-2xl rounded-3xl" />
            <div className="relative glass rounded-2xl p-3 md:p-4 shadow-elevated">
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr_auto_1fr_auto] gap-1 items-center">
                <div className="flex items-center gap-3 px-4 py-2.5">
                  <Search className="h-4 w-4 text-muted-foreground" />
                  <input placeholder="Trek name or keyword" className="bg-transparent outline-none w-full text-sm placeholder:text-muted-foreground" />
                </div>
                <div className="hidden md:block w-px h-8 bg-border" />
                <div className="flex items-center gap-3 px-4 py-2.5">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <select className="bg-transparent outline-none w-full text-sm appearance-none">
                    <option>Any region</option>
                    <option>Himachal</option><option>Uttarakhand</option><option>Kashmir</option><option>Sahyadris</option>
                  </select>
                </div>
                <div className="hidden md:block w-px h-8 bg-border" />
                <div className="flex items-center gap-3 px-4 py-2.5">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <select className="bg-transparent outline-none w-full text-sm appearance-none">
                    <option>Any season</option>
                    <option>Winter (Dec–Feb)</option><option>Monsoon (Jun–Sep)</option><option>Summer (Mar–Jun)</option>
                  </select>
                </div>
                <Button variant="hero" size="lg" className="md:ml-2">
                  <Search className="h-4 w-4" /> Discover
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 mt-5">
              {["Beginner snow treks", "Weekend treks near Mumbai", "December in Uttarakhand", "Monsoon Sahyadri", "First Himalayan trek"].map((q) => (
                <button key={q} className="text-xs px-3.5 py-1.5 rounded-full glass-dark text-surface/90 hover:bg-accent hover:text-accent-foreground transition-all">
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
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

      {/* BEGINNER */}
      <Section eyebrow="Just starting out?" title="Beginner-friendly treks across India" cta={{ label: "Beginner guide", to: "/beginner" }} muted>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {beginner.slice(0, 3).map(t => <TrekCard key={t.slug} trek={t} />)}
        </div>
      </Section>

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
                  <div><div className="text-foreground font-medium">Aarav Sharma</div><div className="text-xs">Editor · 14 yrs in the Himalayas</div></div>
                </div>
                <span className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> 12 min read</span>
                <span className="flex items-center gap-1.5"><Star className="h-3.5 w-3.5 text-accent fill-accent" /> Updated last week</span>
              </div>
              <Button variant="default" size="lg">Read the guide <ArrowRight className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>
      </section>

      {/* MONSOON */}
      <Section eyebrow="Sahyadri season" title="Monsoon treks in Maharashtra & Karnataka" cta={{ label: "Monsoon collection", to: "/seasons/monsoon" }}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {monsoon.slice(0, 3).map(t => <TrekCard key={t.slug} trek={t} />)}
        </div>
      </Section>

      {/* COMPARISON CTA */}
      <section className="py-16 md:py-24 bg-gradient-pine text-surface relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" viewBox="0 0 1200 600" preserveAspectRatio="none">
            <path d="M0,400 L120,340 L240,360 L360,300 L480,340 L600,260 L720,310 L840,250 L960,320 L1080,260 L1200,310 L1200,600 L0,600 Z" fill="hsl(var(--accent))" />
          </svg>
        </div>
        <div className="container-wide relative grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-accent-glow mb-4">Decision-grade comparisons</div>
            <h2 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-6">Kedarkantha or Brahmatal? Hampta or Bhrigu?</h2>
            <p className="text-surface/80 text-lg leading-relaxed mb-8 max-w-xl">Our side-by-side comparisons score difficulty, scenery, snow probability, beginner-fit, cost, and logistics.</p>
            <div className="flex gap-3">
              <Link href="/compare"><Button variant="hero" size="lg">Browse comparisons</Button></Link>
              <Link href="/explore"><Button variant="glass" size="lg">Explore all treks</Button></Link>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[["Kedarkantha", "Brahmatal"], ["Hampta Pass", "Bhrigu Lake"], ["Valley of Flowers", "Hampta Pass"], ["Kashmir Lakes", "Sandakphu"]].map(([a, b]) => (
              <Link key={a + b} href="/compare" className="glass-dark rounded-2xl p-5 hover:bg-surface/10 transition-colors">
                <div className="text-xs uppercase tracking-widest text-accent-glow mb-2">vs</div>
                <div className="font-display text-lg font-semibold leading-tight">{a}<br /><span className="text-surface/60 text-sm font-normal font-sans">vs</span><br />{b}</div>
                <ChevronRight className="h-4 w-4 mt-3 text-accent" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* RESOURCES */}
      <Section eyebrow="Free downloads" title="Planning resources, made by trekkers">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { title: "The complete Himalayan packing checklist", type: "PDF · 24 pages", color: "bg-gradient-saffron" },
            { title: "First-trek prep — 4 week training plan", type: "PDF · 12 pages", color: "bg-gradient-pine" },
            { title: "India trekking cost calculator (Notion)", type: "Notion template", color: "bg-gradient-dawn" },
          ].map((r) => (
            <div key={r.title} className="group p-6 bg-card border border-border rounded-2xl lift">
              <div className={`h-32 rounded-xl ${r.color} mb-5 relative overflow-hidden`} />
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{r.type}</div>
              <h3 className="font-display text-xl font-semibold leading-snug mb-4">{r.title}</h3>
              <Button variant="outline" size="sm" className="w-full">Download free</Button>
            </div>
          ))}
        </div>
      </Section>

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
