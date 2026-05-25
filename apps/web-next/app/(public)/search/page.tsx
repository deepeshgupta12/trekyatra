"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Fuse from "fuse.js";
import { TrekCard, type Trek } from "@/components/trek/TrekCard";
import { treks } from "@/data/treks";
import {
  Search, X, TrendingUp, Clock, ArrowRight, Mountain, MapPin,
  Calendar, GitCompare, Backpack, FileCheck, Sparkles, ChevronRight,
} from "lucide-react";
import { RecommendationItem, fetchSearchSuggestions, logSearchEvent, SearchSuggestion, fetchTrekCMSOverrides, fetchAllCMSTreks, semanticSearch, type CMSTrekOverride, type SemanticSearchResult } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const RECENT_KEY = "ty_recent_searches";
const MAX_RECENT = 5;

const STATIC_TRENDING = [
  "Hampta Pass", "Winter treks December", "Kedarkantha vs Brahmatal",
  "Monsoon Sahyadri", "Valley of Flowers permit",
];

const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

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

// ── Search tag computation ─────────────────────────────────────────────────────
// Builds a string of semantic keywords from trek metadata so Fuse.js can match
// natural queries like "Summer treks", "Beginner treks", "March treks", etc.
type TrekWithTags = Trek & { suitability?: string; tags: string };

const MONTH_MAP: Record<string, string> = {
  Jan: "January winter", Feb: "February winter", Mar: "March spring winter",
  Apr: "April summer spring", May: "May summer spring",
  Jun: "June summer monsoon", Jul: "July monsoon summer",
  Aug: "August monsoon summer", Sep: "September monsoon autumn",
  Oct: "October autumn fall", Nov: "November autumn fall winter",
  Dec: "December winter",
};
const SEASON_BUCKETS: [string, string][] = [
  ["winter",  "Nov Dec Jan Feb Mar"],
  ["spring",  "Mar Apr May"],
  ["summer",  "Apr May Jun"],
  ["monsoon", "Jun Jul Aug Sep"],
  ["autumn",  "Sep Oct Nov"],
];

function buildSearchTags(trek: Trek & { suitability?: string }): string {
  const tags: string[] = [];
  const s = trek.season ?? "";
  // Month → full name + bucket names
  for (const [abbr, expanded] of Object.entries(MONTH_MAP)) {
    if (s.includes(abbr)) tags.push(expanded);
  }
  // Explicit season bucket labels
  for (const [bucket, months] of SEASON_BUCKETS) {
    if (months.split(" ").some(m => s.includes(m))) tags.push(bucket);
  }
  // Difficulty/suitability → human labels
  const suit = (trek.suitability ?? "").toLowerCase();
  const diff = (trek.difficulty ?? "").toLowerCase();
  if (suit.includes("begin") || diff === "easy" || diff.startsWith("easy")) {
    tags.push("beginner easy first-time first trek");
  }
  if (suit.includes("intermediate") || diff.includes("moderate")) {
    tags.push("intermediate moderate");
  }
  if (suit.includes("experienced") || diff.includes("difficult") || diff.includes("challenging")) {
    tags.push("challenging difficult experienced expert advanced");
  }
  // State synonyms for common misspellings/abbreviations
  const st = (trek.state ?? "").toLowerCase();
  if (st.includes("uttarakhand") || st.includes("uttrakhand")) tags.push("uttarakhand kumaon garhwal uk");
  if (st.includes("himachal")) tags.push("himachal hp himachal pradesh");
  if (st.includes("kashmir") || st.includes("j&k")) tags.push("kashmir j&k jk jammu");
  if (st.includes("ladakh")) tags.push("ladakh leh");
  if (st.includes("sikkim")) tags.push("sikkim northeast north east");
  return tags.join(" ");
}

const TREK_FUSE_CONFIG = {
  keys: [
    { name: "name",       weight: 4.0 },
    { name: "state",      weight: 3.0 },
    { name: "region",     weight: 2.0 },
    { name: "tags",       weight: 2.5 },
    { name: "difficulty", weight: 1.5 },
    { name: "season",     weight: 1.5 },
    { name: "suitability", weight: 1.5 },
    { name: "description", weight: 1.0 },
  ],
  threshold: 0.4,
  includeScore: true,
  minMatchCharLength: 2,
};

// Module-level static instances (12 treks) — used as initial fallback until CMS data loads
const _staticTreksWithTags: TrekWithTags[] = (treks as (Trek & { suitability?: string })[])
  .map(t => ({ ...t, tags: buildSearchTags(t) }));
let _trekFuse = new Fuse(_staticTreksWithTags, TREK_FUSE_CONFIG);
let _didYouMeanFuse = new Fuse(_staticTreksWithTags, {
  keys: [{ name: "name", weight: 1 }, { name: "tags", weight: 0.5 }],
  threshold: 0.55, includeScore: true, minMatchCharLength: 3,
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
  const [trending, setTrending] = useState<string[]>(STATIC_TRENDING);
  const [cmsOverrides, setCmsOverrides] = useState<Record<string, CMSTrekOverride>>({});
  // fuseVersion increments when the Fuse index is rebuilt, forcing useMemo to re-run
  const [fuseVersion, setFuseVersion] = useState(0);
  // Step 58: semantic search results from backend (for 5+ char queries)
  const [semanticResults58, setSemanticResults58] = useState<SemanticSearchResult[]>([]);
  const semanticDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    setRecent(readRecent());

    // Fetch real trending queries (falls back to static if API unavailable)
    fetch(`${API_BASE}/api/v1/search/trending?limit=6`)
      .then(r => r.ok ? r.json() : null)
      .then((data: string[] | null) => {
        if (Array.isArray(data) && data.length > 0) {
          // Client-side safety: skip any very short entries that slipped through
          const clean = data.filter(q => q.trim().length >= 3);
          if (clean.length > 0) setTrending(clean);
        }
      })
      .catch(() => {});

    // Fetch ALL CMS trek_guide pages and rebuild Fuse with full dataset + tags.
    // This is the key fix: replaces the 12-trek static index with 100+ CMS treks.
    Promise.all([fetchAllCMSTreks(), fetchTrekCMSOverrides()]).then(([cmsAll, ov]) => {
      setCmsOverrides(ov);
      // Merge: CMS treks first, then static treks not already in CMS (by slug)
      const cmsSlugSet = new Set(cmsAll.map(t => t.slug));
      const staticFallbacks = (treks as (Trek & { suitability?: string })[])
        .filter(t => !cmsSlugSet.has(t.slug))
        .map(t => { const o = ov[t.slug]; return o ? { ...t, image: o.image ?? t.image, difficulty: o.difficulty ?? t.difficulty, season: o.season ?? t.season, suitability: o.suitability } : t; });
      const merged: TrekWithTags[] = [
        ...cmsAll.map(t => ({ ...t, tags: buildSearchTags(t as Trek & { suitability?: string }) })),
        ...staticFallbacks.map(t => ({ ...t, tags: buildSearchTags(t) })),
      ];
      // Rebuild both Fuse instances from the full merged dataset
      _trekFuse = new Fuse(merged, TREK_FUSE_CONFIG);
      _didYouMeanFuse = new Fuse(merged, {
        keys: [{ name: "name", weight: 1 }, { name: "tags", weight: 0.5 }],
        threshold: 0.55, includeScore: true, minMatchCharLength: 3,
      });
      setFuseVersion(v => v + 1);  // triggers useMemo re-run
    }).catch(() => {});
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

  // Step 58: semantic backend search for queries ≥ 5 chars
  // Supplements Fuse.js results with pgvector similarity + intent detection
  useEffect(() => {
    if (semanticDebounceRef.current) clearTimeout(semanticDebounceRef.current);
    if (q.trim().length < 5) { setSemanticResults58([]); return; }
    semanticDebounceRef.current = setTimeout(async () => {
      const results = await semanticSearch(q.trim(), undefined, 6);
      setSemanticResults58(results);
    }, 400);
    return () => { if (semanticDebounceRef.current) clearTimeout(semanticDebounceRef.current); };
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
  // fuseVersion in deps ensures results re-compute when CMS data finishes loading
  const trekResults = useMemo(() => {
    if (!q.trim()) return [];
    return _trekFuse.search(q);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, fuseVersion]);

  // trekResults already include full CMS data (from _trekFuse built from fetchAllCMSTreks)
  const matchingTreks = useMemo(() => trekResults.map(r => r.item), [trekResults]);

  const matchingGuides = useMemo(() => {
    if (!q.trim()) return [];
    return guideFuse.search(q).map(r => r.item);
  }, [q]);

  // "Did you mean?" — uses a name-only Fuse instance (didYouMeanFuse, threshold 0.55)
  // to avoid multi-field score compression that suppressed the banner with trekFuse.
  const didYouMeanTrek = useMemo(() => {
    const trimmed = q.trim();
    if (!trimmed || trimmed.length < 3) return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const results = _didYouMeanFuse.search(trimmed, { limit: 1 });
    if (!results.length) return null;
    const { item, score = 1 } = results[0];
    // Don't suggest when the user already typed the exact trek name
    const qNorm = trimmed.toLowerCase().replace(/\s+/g, "");
    const nameNorm = item.name.toLowerCase().replace(/\s+/g, "");
    if (qNorm === nameNorm) return null;
    // Omit near-perfect matches (score < 0.02 means essentially exact)
    if (score < 0.02) return null;
    return item;
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

  // ── Exact vs fuzzy segregation (#5) ─────────────────────────────────────
  // Score < 0.05 = essentially exact match; ≥ 0.05 = fuzzy/partial match.
  const exactTreks  = useMemo(() => trekResults.filter(r => (r.score ?? 1) < 0.05).map(r => r.item),  [trekResults]);
  const fuzzyTreks  = useMemo(() => trekResults.filter(r => (r.score ?? 1) >= 0.05).map(r => r.item), [trekResults]);

  // Semantic results deduplicated against Fuse exact matches so nothing repeats (#6)
  const semanticUniq = useMemo(
    () => semanticResults58.filter(r => !exactTreks.some(t => t.slug === r.slug)),
    [semanticResults58, exactTreks],
  );
  // Fuse fuzzy results deduplicated against semantic results
  const fuzzyNotInSemantic = useMemo(
    () => fuzzyTreks.filter(t => !semanticUniq.some(r => r.slug === t.slug)),
    [fuzzyTreks, semanticUniq],
  );

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
                {trending.map(t => (
                  <button key={t} onClick={() => { setQ(t); setShowSuggestions(true); }} className="px-3 py-1.5 rounded-full border border-border bg-card text-sm hover:border-accent hover:bg-accent/5 transition-colors">{t}</button>
                ))}
              </div>
            </div>
          </div>
        </section>

      ) : totalCount === 0 && semanticResults.length === 0 && semanticResults58.length === 0 ? (
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

              {/* ── Exact match (#5) — shown first when score is near-perfect ── */}
              {showTreks && exactTreks.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl font-semibold mb-4">
                    {exactTreks.length === 1 ? "Top result" : "Top results"}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {exactTreks.map(t => (
                      <div key={t.slug} onClick={() => handleResultClick(t.slug, "trek_guide")}>
                        <TrekCard trek={t} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── Semantic results (#6) — moved to top, right after exact match ── */}
              {semanticUniq.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" />
                    {exactTreks.length > 0 ? "Related results" : `Results for "${q}"`}
                  </h2>
                  <div className="space-y-2">
                    {semanticUniq.map(item => {
                      const href = getPageHref(item.slug, item.page_type);
                      return (
                        <Link key={item.slug} href={href} onClick={() => handleResultClick(item.slug, item.page_type)}
                          className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-accent transition-colors group">
                          {item.hero_image_url
                            ? <img src={item.hero_image_url} alt={item.title} className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
                            : <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 text-lg">⛰</div>}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium line-clamp-1">{item.title}</div>
                            <div className="flex items-center gap-2 mt-0.5">
                              {item.trek_state && <span className="text-xs text-muted-foreground">{item.trek_state}</span>}
                              {item.trek_difficulty && <span className="text-xs text-muted-foreground">· {item.trek_difficulty}</span>}
                              {item.trek_duration && <span className="text-xs text-muted-foreground">· {item.trek_duration}</span>}
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

              {/* ── Fuzzy Fuse.js results — only those not already in semantic ── */}
              {showTreks && fuzzyNotInSemantic.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl font-semibold mb-4">
                    {exactTreks.length > 0 || semanticUniq.length > 0 ? "More treks" : "Treks"}
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {fuzzyNotInSemantic.map(t => (
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

              {/* Legacy AI results (long queries only, no pgvector results available) */}
              {semanticResults.length > 0 && semanticResults58.length === 0 && (
                <div>
                  <h2 className="font-display text-2xl font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" /> More results
                  </h2>
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
