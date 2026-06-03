"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { TrekCard, type Trek } from "@/components/trek/TrekCard";
import { treks as staticTreks } from "@/data/treks";
import { Button } from "@/components/ui/button";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { fetchTreks } from "@/lib/trekApi";
import { fetchAllCMSTreks, fetchTrekCMSOverrides, fetchFilterFacets, STATIC_FILTER_FACETS, type CMSTrekOverride, type FilterFacets } from "@/lib/api";
import PersonalisedFeed from "@/components/content/PersonalisedFeed";
import Breadcrumb from "@/components/content/Breadcrumb";

// ── Sort + pagination ─────────────────────────────────────────────────────────
const PAGE_SIZE = 12;

const DIFFICULTY_RANK: Record<string, number> = {
  Easy: 1, "Easy–Moderate": 2, Moderate: 3,
  "Moderate–Difficult": 4, Difficult: 5, "Very Difficult": 6, Challenging: 7,
};
const parseDays = (d: string) => parseInt(d.replace(/[^\d]/g, "")) || 999;
const parseFt   = (a: string) => parseInt(a.replace(/[^\d]/g, "")) || 0;
const diffRank  = (d: string) => DIFFICULTY_RANK[d] ?? 3;

function sortTreks(list: Trek[], sortBy: string): Trek[] {
  if (sortBy === "featured") {
    // Featured-flagged treks first; remaining by insertion order (= published_at desc from CMS)
    return [
      ...list.filter(t => (t as Trek & { is_featured?: boolean }).is_featured),
      ...list.filter(t => !(t as Trek & { is_featured?: boolean }).is_featured),
    ];
  }
  return [...list].sort((a, b) => {
    if (sortBy === "difficulty")
      return diffRank(a.difficulty) - diffRank(b.difficulty)
          || parseDays(a.duration) - parseDays(b.duration)
          || parseFt(a.altitude) - parseFt(b.altitude);
    if (sortBy === "duration")
      return parseDays(a.duration) - parseDays(b.duration)
          || diffRank(a.difficulty) - diffRank(b.difficulty)
          || parseFt(a.altitude) - parseFt(b.altitude);
    if (sortBy === "altitude")
      return parseFt(a.altitude) - parseFt(b.altitude)
          || diffRank(a.difficulty) - diffRank(b.difficulty)
          || parseDays(a.duration) - parseDays(b.duration);
    return 0;
  });
}

function mergeCMSOverride(t: Trek, ov: CMSTrekOverride): Trek {
  return {
    ...t,
    image:       ov.image       ?? t.image,
    name:        ov.title       ?? t.name,
    difficulty:  ov.difficulty  ?? t.difficulty,
    duration:    ov.duration    ?? t.duration,
    season:      ov.season      ?? t.season,
    altitude:    ov.altitude    ?? t.altitude,
    suitability: ov.suitability ?? undefined,
  };
}

// ── Filter logic ───────────────────────────────────────────────────────────────
function parseDaysNum(d: string): number { return parseInt(d.replace(/[^\d]/g, "")) || 0; }

function durationMatchesBucket(trekDuration: string, bucket: string): boolean {
  const days = parseDaysNum(trekDuration);
  if (!days) return false;
  if (bucket === "1–3 days")  return days >= 1  && days <= 3;
  if (bucket === "4–6 days")  return days >= 4  && days <= 6;
  if (bucket === "7–9 days")  return days >= 7  && days <= 9;
  if (bucket === "10+ days")  return days >= 10;
  return false;
}

function seasonMonths(season: string): number[] {
  const m: Record<string, number> = {
    Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
    Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
  };
  const parts = season.match(/[A-Za-z]{3}/g) ?? [];
  return parts.map(p => m[p] ?? 0).filter(Boolean);
}

const SEASON_MONTHS: Record<string, number[]> = {
  Winter: [12, 1, 2, 3],
  Spring: [3, 4, 5],
  Summer: [5, 6, 7],
  Monsoon: [6, 7, 8, 9],
  Autumn: [9, 10, 11],
};

function seasonMatchesBucket(trekSeason: string, bucket: string): boolean {
  const bucketMonths = SEASON_MONTHS[bucket] ?? [];
  const trekMonths = seasonMonths(trekSeason);
  return trekMonths.some(m => bucketMonths.includes(m));
}

function applyFilters(list: Trek[], active: string[], facets: FilterFacets): Trek[] {
  if (!active.length) return list;

  // Group active selections by facet category for AND-across/OR-within logic
  const byGroup: Record<string, string[]> = {};
  for (const sel of active) {
    if (facets.states.includes(sel))        { (byGroup.State ??= []).push(sel); continue; }
    if (facets.difficulties.includes(sel))  { (byGroup.Difficulty ??= []).push(sel); continue; }
    if (facets.durations.includes(sel))     { (byGroup.Duration ??= []).push(sel); continue; }
    if (facets.seasons.includes(sel))       { (byGroup.Season ??= []).push(sel); continue; }
    if (facets.suitabilities.includes(sel)) { (byGroup.Suitability ??= []).push(sel); continue; }
    // Static options fallback
    (byGroup.State ??= []).push(sel);
  }

  let result = list;

  if (byGroup.State?.length) {
    result = result.filter(t => byGroup.State.some(s =>
      t.state.toLowerCase().includes(s.toLowerCase()) ||
      s.toLowerCase().includes(t.state.toLowerCase())
    ));
  }
  if (byGroup.Difficulty?.length) {
    result = result.filter(t => byGroup.Difficulty.some(d =>
      t.difficulty?.toLowerCase().includes(d.toLowerCase())
    ));
  }
  if (byGroup.Duration?.length) {
    result = result.filter(t => byGroup.Duration.some(b => durationMatchesBucket(t.duration, b)));
  }
  if (byGroup.Season?.length) {
    result = result.filter(t => byGroup.Season.some(b => seasonMatchesBucket(t.season, b)));
  }
  if (byGroup.Suitability?.length) {
    result = result.filter(t => byGroup.Suitability.some(s =>
      t.suitability?.toLowerCase().includes(s.toLowerCase()) ||
      (s.toLowerCase().includes("begin") && t.beginner)
    ));
  }

  return result;
}

function ExploreContent() {
  const searchParams = useSearchParams();
  const stateParam = searchParams?.get("state") ?? null;

  const [baseList, setBaseList] = useState<Trek[]>(staticTreks as unknown as Trek[]);
  const [sortBy, setSortBy] = useState("featured");
  const [active, setActive] = useState<string[]>(stateParam ? [stateParam] : []);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [facets, setFacets] = useState<FilterFacets>(STATIC_FILTER_FACETS);
  const [page, setPage] = useState(1);

  const filterGroups = [
    { name: "State",       options: facets.states },
    { name: "Difficulty",  options: facets.difficulties },
    { name: "Duration",    options: facets.durations },
    { name: "Season",      options: facets.seasons },
    { name: "Suitability", options: facets.suitabilities },
  ];

  useEffect(() => {
    // Fetch ALL CMS trek_guide pages as the primary source (not just 12 static treks).
    // Static treks are used as fallback for treks not yet pipeline-published.
    Promise.all([fetchAllCMSTreks(), fetchTreks(), fetchTrekCMSOverrides(), fetchFilterFacets()])
      .then(([cmsAll, staticList, cmsOv, f]) => {
        const cmsSlugSet = new Set(cmsAll.map(t => t.slug));
        // CMS-first: all CMS treks + static treks not yet in CMS (de-duped)
        const staticFallbacks = staticList
          .filter(t => !cmsSlugSet.has(t.slug))
          .map(t => mergeCMSOverride(t as unknown as Trek, cmsOv[t.slug] ?? {}));
        const merged: Trek[] = [
          ...cmsAll.map(t => ({ ...t, is_featured: undefined } as unknown as Trek)),
          ...staticFallbacks,
        ];
        setBaseList(merged);
        setFacets(f);
      })
      .catch(() => {
        fetchTreks().then(l => setBaseList(l as unknown as Trek[])).catch(() => {});
      });
  }, []);

  // Apply state pre-filter from ?state= URL param
  useEffect(() => {
    if (stateParam && !active.includes(stateParam)) {
      setActive(prev => [...prev, stateParam]);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stateParam]);

  // Sort THEN filter: AND across groups, OR within each group
  const filteredList = useMemo(
    () => applyFilters(sortTreks(baseList, sortBy), active, facets),
    [baseList, sortBy, active, facets]
  );

  // Reset to page 1 whenever filters or sort change
  useEffect(() => { setPage(1); }, [active, sortBy]);

  // Paginate: show PAGE_SIZE items per page
  const trekList = useMemo(
    () => filteredList.slice(0, page * PAGE_SIZE),
    [filteredList, page]
  );
  const hasMore = trekList.length < filteredList.length;

  const toggle = (v: string) => {
    setActive(p => p.includes(v) ? p.filter(x => x !== v) : [...p, v]);
  };

  return (
    <>
      <div className="container-wide pt-4 pb-0">
        <Breadcrumb items={[{ label: "Home", href: "/" }, { label: "Explore All Treks" }]} />
      </div>
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
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pr-1 space-y-7">
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
                <span className="text-sm text-muted-foreground ml-2">
                  Showing {Math.min(trekList.length, filteredList.length)} of {filteredList.length} trek{filteredList.length !== 1 ? "s" : ""}
                </span>
              </div>
              <select
                aria-label="Sort treks"
                className="h-9 px-3 rounded-full border border-border bg-surface text-sm w-auto"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="featured">Sort: Featured</option>
                <option value="difficulty">Difficulty (low → high)</option>
                <option value="duration">Duration (short → long)</option>
                <option value="altitude">Altitude (low → high)</option>
              </select>
            </div>

            {/* Trek grid or empty state */}
            {filteredList.length === 0 ? (
              <div className="py-20 text-center">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-muted mb-5">
                  <Search className="h-7 w-7 text-muted-foreground" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">No treks match your filters</h3>
                <p className="text-muted-foreground text-sm mb-5">Try removing some filters to see more results.</p>
                <button
                  onClick={() => setActive([])}
                  className="px-4 py-2 rounded-full border border-border bg-surface text-sm hover:border-accent transition-colors"
                >
                  Clear all filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                  {trekList.map(t => <TrekCard key={t.slug} trek={t} />)}
                </div>

                {/* Pagination — Load more */}
                {hasMore && (
                  <div className="mt-10 text-center">
                    <button
                      onClick={() => setPage(p => p + 1)}
                      className="px-6 py-3 rounded-full border border-border bg-surface text-sm font-medium hover:border-accent hover:bg-accent/5 transition-colors"
                    >
                      Load more treks ({filteredList.length - trekList.length} remaining)
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Personalised / trending section below main grid */}
      <section className="py-12 bg-muted/30 border-t border-border">
        <div className="container-wide max-w-4xl">
          <PersonalisedFeed limit={6} />
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

// Wrap in Suspense — required by Next.js when useSearchParams is called in a client component
export default function Explore() {
  return (
    <Suspense fallback={<div className="min-h-screen" />}>
      <ExploreContent />
    </Suspense>
  );
}
