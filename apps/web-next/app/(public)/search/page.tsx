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
import { RecommendationItem } from "@/lib/api";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

const trending = [
  "Hampta Pass", "Winter treks December", "Kedarkantha vs Brahmatal",
  "Monsoon Sahyadri", "Valley of Flowers permit",
];
const recent = ["Kashmir Great Lakes", "Beginner Himachal"];

const guides = [
  { t: "Hampta Pass complete guide", type: "Trek detail", to: "/trek/hampta-pass", icon: Mountain },
  { t: "Hampta Pass packing list", type: "Packing", to: "/packing", icon: Backpack },
  { t: "Hampta Pass permit guide", type: "Permits", to: "/permits", icon: FileCheck },
  { t: "Brahmatal vs Kedarkantha", type: "Comparison", to: "/compare", icon: GitCompare },
  { t: "Best winter treks India", type: "Seasonal", to: "/seasons/winter", icon: Calendar },
  { t: "Himachal regional guide", type: "Region", to: "/regions/himachal", icon: MapPin },
];

const tabs = ["All", "Treks", "Guides", "Comparisons", "Packing", "Permits", "Cost", "Gear"];

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

// Suggestion pool for dropdown autocomplete
const allSuggestions = [
  ...treks.map((t) => ({
    label: t.name,
    sub: `${t.state} · ${t.difficulty}`,
    type: "trek" as const,
    to: `/trek/${t.slug}`,
  })),
  ...guides.map((g) => ({
    label: g.t,
    sub: g.type,
    type: "guide" as const,
    to: g.to,
  })),
];

const suggestionFuse = new Fuse(allSuggestions, {
  keys: [{ name: "label", weight: 3 }, { name: "sub", weight: 1 }],
  threshold: 0.3,
  minMatchCharLength: 1,
});

export default function SearchResults() {
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("All");
  const [semanticResults, setSemanticResults] = useState<RecommendationItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

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

  // Semantic search for long queries (>3 words, needs OPENAI_API_KEY on backend)
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

  // Fuzzy results
  const matchingTreks = useMemo(() => {
    if (!q.trim()) return [];
    return trekFuse.search(q).map(r => r.item);
  }, [q]);

  const matchingGuides = useMemo(() => {
    if (!q.trim()) return [];
    return guideFuse.search(q).map(r => r.item);
  }, [q]);

  // Autocomplete suggestions (max 7)
  const suggestions = useMemo(() => {
    if (!q.trim()) return [];
    return suggestionFuse.search(q, { limit: 7 }).map(r => r.item);
  }, [q]);

  const handleSuggestionClick = useCallback((to: string, label: string) => {
    setQ(label);
    setShowSuggestions(false);
    window.location.href = to;
  }, []);

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
              onFocus={() => q.trim() && setShowSuggestions(true)}
              onKeyDown={(e) => {
                if (e.key === "Escape") { setShowSuggestions(false); }
                if (e.key === "Enter") { setShowSuggestions(false); }
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
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-50 bg-card border border-border rounded-2xl shadow-xl overflow-hidden">
                <div className="px-4 py-2 border-b border-border/50">
                  <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Suggestions</span>
                </div>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(s.to, s.label); }}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted text-left transition-colors border-b border-border/30 last:border-0"
                  >
                    <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      {s.type === "trek"
                        ? <Mountain className="h-3.5 w-3.5 text-accent" />
                        : <ChevronRight className="h-3.5 w-3.5 text-accent" />}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <span className="text-sm font-medium text-foreground">{s.label}</span>
                      <span className="text-xs text-muted-foreground ml-2">{s.sub}</span>
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
              <div className="space-y-1">
                {recent.map(r => (
                  <button key={r} onClick={() => setQ(r)} className="block w-full text-left p-3 rounded-xl hover:bg-muted text-sm">{r}</button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-accent" /> Trending
              </h3>
              <div className="flex flex-wrap gap-2">
                {trending.map(t => (
                  <button key={t} onClick={() => setQ(t)} className="px-3 py-1.5 rounded-full border border-border bg-card text-sm hover:border-accent hover:bg-accent/5 transition-colors">{t}</button>
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
              {showTreks && matchingTreks.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl font-semibold mb-1">Treks</h2>
                  <p className="text-sm text-muted-foreground mb-4">{matchingTreks.length} matching trek{matchingTreks.length !== 1 ? "s" : ""} — fuzzy matched</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                    {matchingTreks.map(t => <TrekCard key={t.slug} trek={t} />)}
                  </div>
                </div>
              )}

              {showGuides && matchingGuides.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl font-semibold mb-4">Guides &amp; resources</h2>
                  <div className="space-y-2">
                    {matchingGuides.map(r => (
                      <Link key={r.t} href={r.to} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-accent transition-colors group">
                        <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <r.icon className="h-4 w-4 text-accent" />
                        </div>
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

              {semanticResults.length > 0 && (
                <div>
                  <h2 className="font-display text-2xl font-semibold mb-1 flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-accent" /> AI-matched results
                  </h2>
                  <p className="text-sm text-muted-foreground mb-4">Semantic matches for &ldquo;{q}&rdquo;</p>
                  <div className="space-y-2">
                    {semanticResults.map(item => {
                      const href = `/${item.page_type === "trek_guide" ? "trek" : "guides"}/${item.slug}`;
                      return (
                        <Link key={item.id} href={href} className="flex items-center gap-4 p-4 bg-card border border-border rounded-xl hover:border-accent transition-colors group">
                          {item.hero_image_url
                            ? <img src={item.hero_image_url} alt={item.title} className="h-10 w-10 rounded-lg object-cover flex-shrink-0" />
                            : <div className="h-10 w-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 text-lg">⛰</div>}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium line-clamp-1">{item.title}</div>
                            {item.seo_description && <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{item.seo_description}</div>}
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
