"use client";

import { useState, useEffect } from "react";
import { TrekCard } from "@/components/trek/TrekCard";
import { treks as staticTreks } from "@/data/treks";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { fetchTreks } from "@/lib/trekApi";

const filterGroups = [
  { name: "State", options: ["Uttarakhand", "Himachal Pradesh", "Jammu & Kashmir", "Ladakh", "Maharashtra", "West Bengal / Sikkim"] },
  { name: "Difficulty", options: ["Easy", "Moderate", "Difficult", "Challenging"] },
  { name: "Duration", options: ["1 day", "2-3 days", "4-6 days", "7+ days"] },
  { name: "Season", options: ["Winter", "Summer", "Monsoon", "Autumn"] },
  { name: "Suitability", options: ["Beginner", "Family", "Snow", "High altitude"] },
];

export default function Explore() {
  const [trekList, setTrekList] = useState(staticTreks);
  const [active, setActive] = useState<string[]>(["Beginner"]);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  useEffect(() => {
    fetchTreks().then(setTrekList).catch(() => {});
  }, []);

  const toggle = (v: string) => setActive(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-pine text-surface pt-16 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" viewBox="0 0 1200 400" preserveAspectRatio="none">
            <path d="M0,300 L100,260 L200,280 L300,220 L400,260 L500,180 L600,230 L700,170 L800,240 L900,180 L1000,230 L1100,200 L1200,250 L1200,400 L0,400 Z" fill="hsl(var(--accent))" />
          </svg>
        </div>
        <div className="container-wide relative">
          <div className="text-xs uppercase tracking-[0.25em] text-accent-glow mb-3">The discovery hub</div>
          <h1 className="font-display text-5xl md:text-6xl font-semibold leading-tight mb-4 max-w-3xl">Explore every trek in India.</h1>
          <p className="text-surface/80 text-lg max-w-2xl mb-8">Filter by state, season, difficulty, altitude, permit need, and beginner-friendliness. 250+ guides, all editorially reviewed.</p>
          <div className="glass rounded-2xl p-2 max-w-2xl flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground ml-3" />
            <input placeholder="Try 'Kashmir', 'snow', 'monsoon Mumbai'…" className="flex-1 bg-transparent outline-none text-sm text-foreground py-3" />
            <Button variant="hero" size="default">Search</Button>
          </div>
        </div>
      </section>

      <section className="py-12">
        <div className="container-wide grid lg:grid-cols-[280px_1fr] gap-10">
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-7">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-xl font-semibold">Filters</h3>
                {active.length > 0 && (
                  <button onClick={() => setActive([])} className="text-xs text-muted-foreground hover:text-accent">Clear ({active.length})</button>
                )}
              </div>
              {filterGroups.map(g => (
                <div key={g.name}>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">{g.name}</div>
                  <div className="space-y-2">
                    {g.options.map(o => (
                      <label key={o} className="flex items-center gap-2.5 cursor-pointer group">
                        <input type="checkbox" checked={active.includes(o)} onChange={() => toggle(o)} className="rounded border-border accent-accent" />
                        <span className="text-sm text-foreground/80 group-hover:text-foreground">{o}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <div className="min-w-0">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => setShowMobileFilters(true)} className="lg:hidden flex items-center gap-2 h-9 px-4 rounded-full border border-border bg-surface text-sm">
                  <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
                </button>
                {active.map(a => (
                  <span key={a} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-accent/15 text-accent text-xs font-medium">
                    {a} <button onClick={() => toggle(a)}><X className="h-3 w-3" /></button>
                  </span>
                ))}
                <span className="text-sm text-muted-foreground ml-2">Showing {trekList.length} treks</span>
              </div>
              <select className="h-9 px-3 rounded-full border border-border bg-surface text-sm w-auto">
                <option>Sort: Editor&apos;s pick</option>
                <option>Difficulty (low → high)</option>
                <option>Altitude (low → high)</option>
                <option>Duration (short → long)</option>
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {trekList.map(t => <TrekCard key={t.slug} trek={t} />)}
            </div>

            <div className="mt-16 space-y-12">
              {[
                { title: "Best winter treks in India", desc: "Snow-line treks for December – April." },
                { title: "Weekend treks near Mumbai", desc: "Reachable in under 4 hours from Mumbai or Pune." },
                { title: "Beginner Himalayan treks", desc: "Gentler routes under 14,000 ft to start with." },
              ].map((rail) => (
                <div key={rail.title} className="min-w-0">
                  <div className="flex items-end justify-between mb-5 gap-3">
                    <div className="min-w-0">
                      <h3 className="font-display text-2xl font-semibold">{rail.title}</h3>
                      <p className="text-sm text-muted-foreground">{rail.desc}</p>
                    </div>
                    <button className="text-sm text-accent font-medium whitespace-nowrap flex-shrink-0">View all →</button>
                  </div>
                  <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                    {trekList.slice(0, 5).map(t => (
                      <div key={t.slug} className="w-[280px] flex-shrink-0">
                        <TrekCard trek={t} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute inset-x-0 bottom-0 bg-background rounded-t-3xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-background flex items-center justify-between p-5 border-b border-border">
              <h3 className="font-display text-xl font-semibold">Filters</h3>
              <button onClick={() => setShowMobileFilters(false)} className="h-9 w-9 rounded-full bg-muted flex items-center justify-center"><X className="h-4 w-4" /></button>
            </div>
            <div className="p-5 space-y-6">
              {filterGroups.map(g => (
                <div key={g.name}>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">{g.name}</div>
                  <div className="grid grid-cols-2 gap-2">
                    {g.options.map(o => (
                      <button key={o} onClick={() => toggle(o)} className={`text-left text-sm px-4 py-3 rounded-xl border transition-all ${active.includes(o) ? "border-accent bg-accent/10 text-accent" : "border-border bg-surface text-foreground"}`}>
                        {o}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="sticky bottom-0 bg-background p-5 border-t border-border flex gap-3">
              <Button variant="outline" size="lg" className="flex-1" onClick={() => setActive([])}>Clear</Button>
              <Button variant="hero" size="lg" className="flex-1" onClick={() => setShowMobileFilters(false)}>Apply ({trekList.length})</Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
