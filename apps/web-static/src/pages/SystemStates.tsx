import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { SiteLayout } from "@/components/layout/SiteLayout";
import { TrekCard } from "@/components/trek/TrekCard";
import { treks } from "@/data/treks";
import { Search, X, TrendingUp, Clock, ArrowRight, Mountain, MapPin, Calendar, GitCompare, Backpack, FileCheck } from "lucide-react";

const trending = ["Hampta Pass", "Winter treks December", "Kedarkantha vs Brahmatal", "Monsoon Sahyadri", "Valley of Flowers permit"];
const recent = ["Kashmir Great Lakes", "Beginner Himachal"];

const guides = [
  { t: "Hampta Pass complete guide", type: "Trek detail", to: "/trek/hampta-pass", icon: Mountain },
  { t: "Hampta Pass packing list", type: "Packing", to: "/packing", icon: Backpack },
  { t: "Hampta Pass permit guide", type: "Permits", to: "/permits", icon: FileCheck },
  { t: "Brahmatal vs Kedarkantha", type: "Comparison", to: "/compare", icon: GitCompare },
  { t: "Best winter treks India", type: "Seasonal", to: "/seasons/winter", icon: Calendar },
  { t: "Himachal regional guide", type: "Region", to: "/regions/himachal", icon: MapPin },
  { t: "Beginner trek packing basics", type: "Beginner", to: "/beginner", icon: Backpack },
  { t: "Cost guide — Himalayan treks", type: "Cost", to: "/costs", icon: FileCheck },
];

const tabs = ["All", "Treks", "Guides", "Comparisons", "Packing", "Permits", "Cost", "Gear"];

export const SearchResults = () => {
  const [q, setQ] = useState("hampta");
  const [tab, setTab] = useState("All");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const matchingTreks = useMemo(() => {
    if (!q.trim()) return [];
    const lower = q.toLowerCase();
    return treks.filter(t =>
      t.name.toLowerCase().includes(lower) ||
      t.region.toLowerCase().includes(lower) ||
      t.state.toLowerCase().includes(lower) ||
      t.description.toLowerCase().includes(lower) ||
      t.season.toLowerCase().includes(lower) ||
      t.difficulty.toLowerCase().includes(lower)
    );
  }, [q]);

  const matchingGuides = useMemo(() => {
    if (!q.trim()) return [];
    const lower = q.toLowerCase();
    return guides.filter(g => g.t.toLowerCase().includes(lower) || g.type.toLowerCase().includes(lower));
  }, [q]);

  const counts: Record<string, number> = {
    All: matchingTreks.length + matchingGuides.length,
    Treks: matchingTreks.length,
    Guides: matchingGuides.filter(g => ["Trek detail","Beginner","Region","Seasonal"].includes(g.type)).length,
    Comparisons: matchingGuides.filter(g => g.type === "Comparison").length,
    Packing: matchingGuides.filter(g => g.type === "Packing").length,
    Permits: matchingGuides.filter(g => g.type === "Permits").length,
    Cost: matchingGuides.filter(g => g.type === "Cost").length,
    Gear: 0,
  };

  const showTreks = tab === "All" || tab === "Treks";
  const showGuides = tab !== "Treks";

  return (
    <SiteLayout>
      <section className="py-10 bg-gradient-paper border-b border-border">
        <div className="container-wide">
          <div className="relative max-w-3xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search treks, regions, packing, permits…"
              className="w-full h-14 pl-14 pr-12 rounded-2xl border border-border bg-card text-base font-medium outline-none focus:border-accent transition-colors"
            />
            {q && (
              <button onClick={() => setQ("")} className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="text-sm text-muted-foreground mt-3">
            {q ? <>{counts.All} result{counts.All !== 1 && 's'} for <span className="font-medium text-foreground">"{q}"</span></> : "Start typing to search across treks, guides, packing, permits and more."}
          </div>
        </div>
      </section>

      {!q.trim() ? (
        <section className="py-12">
          <div className="container-wide grid md:grid-cols-2 gap-8 max-w-3xl">
            <div>
              <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2"><Clock className="h-4 w-4 text-accent" /> Recent</h3>
              <div className="space-y-1">
                {recent.map(r => (
                  <button key={r} onClick={() => setQ(r)} className="block w-full text-left p-3 rounded-xl hover:bg-muted text-sm">{r}</button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-accent" /> Trending</h3>
              <div className="flex flex-wrap gap-2">
                {trending.map(t => (
                  <button key={t} onClick={() => setQ(t)} className="px-3 py-1.5 rounded-full border border-border bg-card text-sm hover:border-accent hover:bg-accent/5">{t}</button>
                ))}
              </div>
            </div>
          </div>
        </section>
      ) : counts.All === 0 ? (
        <section className="py-20">
          <div className="container-narrow text-center">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-muted mb-6"><Search className="h-9 w-9 text-muted-foreground" /></div>
            <h2 className="font-display text-3xl font-semibold mb-2">No matches for "{q}"</h2>
            <p className="text-muted-foreground mb-6">Try a region (Himachal), a season (winter), or a difficulty (beginner).</p>
            <div className="flex gap-2 justify-center flex-wrap">
              {trending.slice(0, 4).map(t => (
                <button key={t} onClick={() => setQ(t)} className="px-3 py-1.5 rounded-full border border-border bg-card text-sm hover:border-accent">{t}</button>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="py-12">
          <div className="container-wide grid lg:grid-cols-[220px_1fr] gap-10">
            <aside className="space-y-1">
              {tabs.map(t => (
                <button key={t} onClick={() => setTab(t)} className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm transition-colors ${tab === t ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}>
                  <span>{t}</span><span className="text-xs text-muted-foreground">{counts[t] ?? 0}</span>
                </button>
              ))}
            </aside>
            <div className="space-y-10 min-w-0">
              {showTreks && matchingTreks.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl font-semibold mb-4">Treks <span className="text-sm text-muted-foreground font-sans font-normal">· {matchingTreks.length}</span></h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {matchingTreks.map(t => <TrekCard key={t.slug} trek={t} />)}
                  </div>
                </div>
              )}
              {showGuides && matchingGuides.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl font-semibold mb-4">Guides & resources <span className="text-sm text-muted-foreground font-sans font-normal">· {matchingGuides.length}</span></h2>
                  <div className="space-y-2">
                    {matchingGuides.map(r => (
                      <Link key={r.t} to={r.to} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-accent transition-colors group">
                        <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0"><r.icon className="h-4 w-4 text-accent" /></div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{r.t}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">{r.type}</div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}
    </SiteLayout>
  );
};

export const NoResults = () => (
  <SiteLayout>
    <section className="py-20">
      <div className="container-narrow text-center">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-muted mb-6"><Search className="h-9 w-9 text-muted-foreground" /></div>
        <h1 className="font-display text-4xl font-semibold mb-3">No matches yet</h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">We couldn't find treks matching your filters. Try widening the season or difficulty range.</p>
        <div className="flex gap-3 justify-center mb-12">
          <Link to="/explore"><button className="h-11 px-5 rounded-xl bg-accent text-accent-foreground font-medium">Browse all treks</button></Link>
        </div>
        <div className="text-left">
          <h3 className="font-display text-xl font-semibold mb-4 text-center">You might also like</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {treks.slice(0, 3).map(t => <TrekCard key={t.slug} trek={t} />)}
          </div>
        </div>
      </div>
    </section>
  </SiteLayout>
);

export const EmptySaved = () => (
  <SiteLayout>
    <section className="py-20">
      <div className="container-narrow text-center">
        <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-accent/10 mb-6"><Mountain className="h-9 w-9 text-accent" /></div>
        <h1 className="font-display text-4xl font-semibold mb-3">Your saved list is empty</h1>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">Tap the bookmark icon on any trek to start your shortlist. We'll keep it synced across devices.</p>
        <Link to="/explore"><button className="h-12 px-6 rounded-xl bg-accent text-accent-foreground font-medium inline-flex items-center gap-2">Discover treks <ArrowRight className="h-4 w-4" /></button></Link>
      </div>
    </section>
  </SiteLayout>
);

export const UnderReview = () => (
  <SiteLayout>
    <section className="py-20">
      <div className="container-narrow">
        <div className="p-8 bg-warning/10 border border-warning/30 rounded-2xl text-center">
          <div className="inline-flex h-12 w-12 rounded-full bg-warning/20 items-center justify-center mb-4"><FileCheck className="h-6 w-6 text-warning" /></div>
          <h1 className="font-display text-3xl font-semibold mb-2">Under review</h1>
          <p className="text-muted-foreground mb-6 max-w-lg mx-auto">This guide is being re-verified by our editors. Some sections may show last-season data. Full refresh expected within 7 days.</p>
          <div className="text-xs uppercase tracking-widest text-muted-foreground">Last verified · Oct 2025</div>
        </div>
      </div>
    </section>
  </SiteLayout>
);

export const Maintenance = () => (
  <div className="min-h-screen bg-gradient-twilight text-surface flex items-center justify-center p-6">
    <div className="text-center max-w-md">
      <div className="inline-flex items-center justify-center h-20 w-20 rounded-full glass-dark mb-6"><Mountain className="h-9 w-9 text-accent-glow" /></div>
      <h1 className="font-display text-5xl font-semibold mb-3">Quick refresh</h1>
      <p className="text-surface/80 mb-8">TrekYatra is getting a small update. We'll be back in about 15 minutes.</p>
      <div className="text-sm text-surface/60">For urgent enquiries, email <a className="text-accent-glow underline" href="mailto:hello@trekyatra.in">hello@trekyatra.in</a></div>
    </div>
  </div>
);
