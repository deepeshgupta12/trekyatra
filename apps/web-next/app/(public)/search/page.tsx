"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Fuse from "fuse.js";
import { TrekCard } from "@/components/trek/TrekCard";
import { treks } from "@/data/treks";
import {
  Search, X, TrendingUp, Clock, ArrowRight, Mountain, MapPin,
  Calendar, GitCompare, Backpack, FileCheck, Sparkles, ChevronRight,
} from "lucide-react";
import { RecommendationItem, fetchSearchSuggestions, logSearchEvent, SearchSuggestion } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const RECENT_KEY = "ty_recent_searches";
const MAX_RECENT = 5;

const STATIC_TRENDING = [
  "Hampta Pass", "Winter treks December", "Kedarkantha vs Brahmatal",
  "Monsoon Sahyadri", "Valley of Flowers permit",
];

const guides = [
  { t: "Hampta Pass complete guide", type: "Trek detail", to: "/trek/hampta-pass", icon: Mountain },
  { t: "Hampta Pass packing list", type: "Packing", to: "/packing", icon: Backpack },
  { t: "Hampta Pass permit guide", type: "Permits", to: "/permits", icon: FileCheck },
  { t: "Brahmatal vs Kedarkantha", type: "Comparison", to: "/compare", icon: GitCompare },
  { t: "Best winter treks India", type: "Seasonal", to: "/seasons/winter", icon: Calendar },
  { t: "Himachal regional guide", type: "Region", to: "/regions/himachal", icon: MapPin },
];

const tabs = ["All", "Treks", "Guides", "Comparisons", "Packing", "Permits", "Cost", "Gear"];

const PAGE_TYPE_LABELS: Record<string, string> = {
  trek_guide: "Trek Guide",
  packing_list: "Packing List",
  permit_guide: "Permit Guide",
  beginner_guide: "Beginner Guide",
  comparison: "Comparison",
  seasonal: "Seasonal Guide",
  regional_hub: "Region Guide",
  cluster_hub: "Trek Type",
  cost_guide: "Cost Guide",
  gear_guide: "Gear Guide",
  itinerary: "Itinerary",
  editorial: "Article",
};

const PAGE_TYPE_HREF: Record<string, (slug: string) => string> = {
  trek_guide: (s) => `/trek/${s}`,
  packing_list: (s) => `/packing/${s}`,
  permit_guide: (s) => `/permits/${s}`,
};

function getPageHref(slug: string, pageType: string): string {
  const fn = PAGE_TYPE_HREF[pageType];
  return fn ? fn(slug) : `/guides/${slug}`;
}

// ── Fuse.js instances ──────────────────────────────────────────────────────────
const trekFuse = new Fuse(treks, {
  keys: [
    { name: "name", weight: 3 },
    { name: "region", weight: 2 },
    { name: "state", weight: 2 },
    { name: "season", weight: 1.5 },
    { name: "difficulty", weight: 1 },
    { name: "description", weight: 1 },
  ],
  threshold: 0.35,
  includeScore: true,
  minMatchCharLength: 2,
});

const guideFuse = new Fuse(guides, {
  keys: [{ name: "t", weight: 3 }, { name: "type", weight: 1 }],
  threshold: 0.4,
  includeScore: true,
  minMatchCharLength: 2,
});

// ── localStorage helpers ───────────────────────────────────────────────────────
function readRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch { return []; }
}
function saveRecent(q: string) {
  const prev = readRecent().filter((s) => s !== q);
  localStorage.setItem(RECENT_KEY, JSON.stringify([q, ...prev].slice(0, MAX_RECENT)));
}

export default function SearchResults() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("All");
  const [semanticResults, setSemanticResults] = useState<RecommendationItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [cmssuggestions, setCmsSuggestions] = useState<SearchSuggestion[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    setRecent(readRecent());
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  // Re-read recent searches whenever query becomes empty (e.g. X button clicked)
  useEffect(() => {
    if (!q.trim()) setRecent(readRecent());
  }, [q]);

  // Debounced CMS suggestions fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) { setCmsSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      const results = await fetchSearchSuggestions(q.trim(), 6);
      setCmsSuggestions(results);
    }, 250);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [q]);

  // Semantic search for long queries (>3 words)
  useEffect(() => {
    const words = q.trim().split(/\s+/);
    if (words.length <= 3) { setSemanticResults([]); return; }
    const controller = new AbortController();
    fetch(`${API}/api/v1/search?q=${encodeURIComponent(q)}&limit=6`, { signal: controller.signal })
      .then(r => r.ok ? r.json() : { items: [] })
      .then(data => setSemanticResults(data.items ?? []))
      .catch(() => {});
    return () => controller.abort();
  }, [q]);

  // Fuzzy results (with scores for "did you mean?")
  const trekResults = useMemo(() => {
    if (!q.trim()) return [];
    return trekFuse.search(q);
  }, [q]);

  const matchingTreks = useMemo(() => trekResults.map(r => r.item), [trekResults]);

  const matchingGuides = useMemo(() => {
    if (!q.trim()) return [];
    return guideFuse.search(q).map(r => r.item);
  }, [q]);

  // "Did you mean?" — show when query is a fuzzy/typo variation of a known trek name.
  // Score 0 = exact match, 1 = no match. We suggest when 0.05 ≤ score ≤ 0.5:
  //   - Below 0.05 = essentially exact → no suggestion needed
  //   - Above 0.5 = too far off to give a useful suggestion
  const didYouMeanTrek = useMemo(() => {
    if (!q.trim()) return null;
    const topResult = trekFuse.search(q, { limit: 1 })[0];
    if (!topResult) return null;
    const score = topResult.score ?? 1;
    if (score < 0.05 || score > 0.5) return null;
    // Don't suggest the same name the user already typed
    if (topResult.item.name.toLowerCase() === q.trim().toLowerCase()) return null;
    return topResult.item;
  }, [q]);

  const handleQueryCommit = useCallback((value: string) => {
    if (value.trim().length >= 2) saveRecent(value.trim());
    setRecent(readRecent());
  }, []);

  const handleSuggestionClick = useCallback((href: string, label: string, slug?: string, pageType?: string) => {
    setQ(label);
    setShowSuggestions(false);
    handleQueryCommit(label);
    if (slug && pageType) {
      logSearchEvent({ query: label, clicked_slug: slug, clicked_page_type: pageType }).catch(() => {});
    }
    window.location.href = href;
  }, [handleQueryCommit]);

  const handleResultClick = useCallback((slug: string, pageType: string) => {
    logSearchEvent({
      query: q,
      results_count: matchingTreks.length + matchingGuides.length,
      clicked_slug: slug,
      clicked_page_type: pageType,
    }).catch(() => {});
  }, [q, matchingTreks.length, matchingGuides.length]);

  const totalCount = matchingTreks.length + matchingGuides.length;
  const showTreks = tab === "All" || tab === "Treks";
  const showGuides = tab !== "Treks";

  return (
    <>
      {/* Search bar section */}
      <section className="py-10 bg-gradient-paper border-b border-border">
        <div className="container-wide">
          <div ref={containerRef} className="relative max-w-3xl">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => { setQ(e.target.value); setShowSuggestions(true); }}
              onFocus={() => setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === "Escape") { setShowSuggestions(false); }
                if (e.key === "Enter") { setShowSuggestions(false); handleQueryCommit(q); }
              }}
              placeholder="Search treks, regions, difficulty, season…"
              className="w-full h-14 pl-14 pr-12 rounded-2xl border border-border bg-card text-base font-medium outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {q && (
              <button
                onClick={() => { setQ(""); setShowSuggestions(false); inputRef.current?.focus(); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-muted flex items-center justify-center hover:bg-border transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            {/* ── Autocomplete dropdown ─────────────────────────────────────── */}
            {showSuggestions && (cmssuggestions.length > 0) && (
              <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-50 bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
                <div className="px-4 py-2 border-b border-border/50">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Suggestions</span>
                </div>
                {cmssuggestions.map((s, i) => (
                  <button
                    key={i}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSuggestionClick(getPageHref(s.slug, s.page_type), s.title, s.slug, s.page_type);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted text-left transition-colors border-b border-border/30 last:border-0"
                  >
                    <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      {s.hero_image_url
                        ? <img src={s.hero_image_url} alt="" className="w-full h-full object-cover rounded-lg" />
                        : <Mountain className="h-3.5 w-3.5 text-accent" />}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <span className="text-sm font-medium text-foreground">{s.title}</span>
                      <span className="ml-2 text-[10px] font-medium text-accent/80 bg-accent/8 px-1.5 py-0.5 rounded-full">
                        {PAGE_TYPE_LABELS[s.page_type] ?? s.page_type}
                      </span>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="text-sm text-muted-foreground mt-3">
            {q
              ? <>{totalCount} result{totalCount !== 1 ? "s" : ""} for <span className="font-medium text-foreground">&ldquo;{q}&rdquo;</span>{totalCount === 0 ? " — showing approximate matches" : ""}</>
              : "Start typing to search across treks, guides, packing, permits and more."}
          </div>
        </div>
      </section>

      {/* Empty — no query */}
      {!q.trim() ? (
        <section className="py-12">
          <div className="container-wide grid md:grid-cols-2 gap-8 max-w-3xl">
            <div>
              <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                <Clock className="h-4 w-4 text-accent" /> Recent
              </h3>
              {recent.length === 0 ? (
                <p className="text-sm text-muted-foreground px-3">No recent searches yet.</p>
              ) : (
                <div className="space-y-1">
                  {recent.map(r => (
                    <button key={r} onClick={() => { setQ(r); setShowSuggestions(true); }} className="flex items-center gap-2 w-full text-left p-3 rounded-xl hover:bg-muted text-sm">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground/60 flex-shrink-0" />
                      {r}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" /> Trending
              </h3>
              <div className="flex flex-wrap gap-2">
                {STATIC_TRENDING.map(t => (
                  <button key={t} onClick={() => { setQ(t); setShowSuggestions(true); }} className="px-3 py-1.5 rounded-full border border-border bg-card text-sm hover:border-accent hover:bg-accent/5 transition-colors">{t}</button>
                ))}
              </div>
            </div>
          </div>
        </section>

      ) : totalCount === 0 && semanticResults.length === 0 ? (
        <section className="py-20">
          <div className="container-narrow text-center">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-muted mb-6">
              <Search className="h-9 w-9 text-muted-foreground" />
            </div>
            <h2 className="font-display text-3xl font-semibold mb-2">No matches for &ldquo;{q}&rdquo;</h2>
            {/* "Did you mean?" */}
            {didYouMeanTrek && (
              <p className="text-muted-foreground mb-3">
                Did you mean{" "}
                <button
                  className="text-accent font-medium underline underline-offset-2"
                  onClick={() => setQ(didYouMeanTrek.name)}
                >
                  {didYouMeanTrek.name}
                </button>
                ?
              </p>
            )}
            <p className="text-muted-foreground mb-6">Try a region (Himachal), a season (winter), or a difficulty (beginner).</p>
            <div className="flex flex-wrap justify-center gap-2">
              {["Kedarkantha", "Hampta Pass", "Beginner", "Monsoon", "Uttarakhand"].map(s => (
                <button key={s} onClick={() => setQ(s)} className="px-3 py-1.5 rounded-full border border-border bg-card text-sm hover:border-accent">{s}</button>
              ))}
            </div>
          </div>
        </section>

      ) : (
        <section className="py-12">
          <div className="container-wide grid lg:grid-cols-[200px_1fr] gap-10">
            <aside className="space-y-1">
              {tabs.map(t => (
                <button key={t} onClick={() => setTab(t)} className={`w-full flex items-center px-4 py-2.5 rounded-xl text-sm transition-colors ${tab === t ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted"}`}>
                  {t}
                </button>
              ))}
            </aside>

            <div className="space-y-10 min-w-0">
              {/* "Did you mean?" — shown at top of results whenever query looks like a typo */}
              {didYouMeanTrek && (
                <p className="text-sm text-muted-foreground bg-muted/50 rounded-xl px-4 py-3">
                  Did you mean{" "}
                  <button
                    className="text-accent font-semibold underline underline-offset-2"
                    onClick={() => setQ(didYouMeanTrek.name)}
                  >
                    {didYouMeanTrek.name}
                  </button>
                  ?
                </p>
              )}

              {showTreks && matchingTreks.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl font-semibold mb-4">Treks</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {matchingTreks.map(t => (
                      <div key={t.slug} onClick={() => handleResultClick(t.slug, "trek_guide")}>
                        <TrekCard trek={t} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {showGuides && matchingGuides.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl font-semibold mb-4">Guides &amp; resources</h2>
                  <div className="space-y-2">
                    {matchingGuides.map(r => (
                      <Link key={r.t} href={r.to} onClick={() => handleResultClick(r.to, "guide")} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-accent transition-colors group">
                        <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <r.icon className="h-4 w-4 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium">{r.t}</div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-muted-foreground">{r.type}</span>
                            <span className="text-[10px] font-medium text-accent/80 bg-accent/8 px-1.5 py-0.5 rounded-full">{r.type}</span>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {semanticResults.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl font-semibold mb-1 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" /> AI-matched results
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">Semantic matches for &ldquo;{q}&rdquo;</p>
                  <div className="space-y-2">
                    {semanticResults.map(item => {
                      const href = getPageHref(item.slug, item.page_type);
                      return (
                        <Link key={item.id} href={href} onClick={() => handleResultClick(item.slug, item.page_type)} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-accent transition-colors group">
                          {item.hero_image_url
                            ? <img src={item.hero_image_url} alt={item.title} className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
                            : <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 text-lg">⛰</div>}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium line-clamp-1">{item.title}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.seo_description && <span className="text-xs text-muted-foreground line-clamp-1">{item.seo_description}</span>}
                              <span className="text-[10px] font-medium text-accent/80 bg-accent/8 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                {PAGE_TYPE_LABELS[item.page_type] ?? item.page_type}
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-accent flex-shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

              </div>
          </div>
        </section>
      )}
    </>
  );
}
