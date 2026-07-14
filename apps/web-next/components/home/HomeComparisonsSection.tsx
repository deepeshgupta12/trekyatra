"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getBehaviorProfile, BEHAVIOR_UPDATED_EVENT } from "@/lib/behavior-tracker";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Scale } from "lucide-react";

// PT3 — enhanced, personalized home comparisons section. Cards link to the clean
// `/compare/{a-vs-b}` SEO pages (Step 81). Ranking: trending treks first, then a
// boost for comparisons matching the viewer's most-viewed difficulty / region
// (from the local behavior profile). The interactive `/compare?slugs=` tool stays
// intact and is linked from the CTA.

export interface HomeComparisonCard {
  slug: string;          // clean pair slug → /compare/{slug}
  aName: string;
  bName: string;
  aDifficulty?: string;
  bDifficulty?: string;
  state?: string;
  trending?: boolean;    // either trek is currently trending (server-computed)
}

interface Props {
  comparisons: HomeComparisonCard[];
  /** Interactive-tool fallback pairs, used only when no clean comparison pages exist yet. */
  fallbackPairs: { a: string; b: string; slugs: string }[];
}

export default function HomeComparisonsSection({ comparisons, fallbackPairs }: Props) {
  const [topDifficulties, setTopDifficulties] = useState<string[]>([]);
  const [topRegions, setTopRegions] = useState<string[]>([]);

  // Read the behavior profile on mount AND whenever it changes. On a fresh logged-in
  // device the server-synced cross-device profile is merged into localStorage
  // asynchronously (auth-context → pullAndMergeBehaviorProfileFromBackend), which fires
  // BEHAVIOR_UPDATED_EVENT after this component has already mounted — so a one-shot mount
  // read would miss it. Subscribing re-ranks the cards once the synced signal lands.
  useEffect(() => {
    const loadProfile = () => {
      const profile = getBehaviorProfile();
      setTopDifficulties(profile ? profile.topDifficulties.map((d) => d.toLowerCase()) : []);
      setTopRegions(profile ? profile.topRegions.map((r) => r.toLowerCase()) : []);
    };
    loadProfile();
    window.addEventListener(BEHAVIOR_UPDATED_EVENT, loadProfile);
    return () => window.removeEventListener(BEHAVIOR_UPDATED_EVENT, loadProfile);
  }, []);

  const ranked = useMemo(() => {
    const score = (c: HomeComparisonCard): number => {
      let s = 0;
      if (c.trending) s += 100;
      const diffs = [c.aDifficulty, c.bDifficulty].map((d) => (d ?? "").toLowerCase());
      if (topDifficulties.some((d) => diffs.includes(d))) s += 40;
      if (c.state && topRegions.includes(c.state.toLowerCase())) s += 25;
      return s;
    };
    return [...comparisons].sort((a, b) => score(b) - score(a)).slice(0, 6);
  }, [comparisons, topDifficulties, topRegions]);

  const personalized = topDifficulties.length > 0 || topRegions.length > 0;
  const hasCleanPages = ranked.length > 0;

  return (
    <section className="py-12 md:py-20 bg-gradient-pine text-surface relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <svg width="100%" height="100%" viewBox="0 0 1200 600" preserveAspectRatio="none">
          <path d="M0,400 L120,340 L240,360 L360,300 L480,340 L600,260 L720,310 L840,250 L960,320 L1080,260 L1200,310 L1200,600 L0,600 Z" fill="hsl(var(--accent))" />
        </svg>
      </div>

      <div className="container-wide relative">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between mb-8">
          <div className="max-w-xl">
            <div className="text-xs uppercase tracking-[0.25em] text-accent-glow mb-3">Decision-grade comparisons</div>
            <h2 className="font-display text-2xl sm:text-3xl md:text-4xl font-semibold leading-tight mb-3">
              Two treks, side by side.
            </h2>
            <p className="text-surface/80 text-base leading-relaxed">
              {personalized
                ? "Picked for you — based on the treks and difficulty you've been exploring."
                : "Difficulty, altitude, best season, permits and cost — scored head-to-head so you can decide fast."}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/compare"><Button variant="hero" size="sm">Browse all comparisons <ArrowRight className="h-4 w-4" /></Button></Link>
            <Link href="/explore"><Button variant="glass" size="sm">Explore all treks</Button></Link>
          </div>
        </div>

        {hasCleanPages ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ranked.map((c) => (
              <Link
                key={c.slug}
                href={`/compare/${c.slug}`}
                className="group glass-dark rounded-2xl p-5 hover:bg-surface/10 transition-colors flex flex-col"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] uppercase tracking-widest text-accent-glow flex items-center gap-1">
                    <Scale className="h-3 w-3" /> Compare
                  </span>
                  {c.trending && (
                    <span className="text-[10px] uppercase tracking-widest text-accent-glow flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" /> Trending
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-display text-base md:text-lg font-semibold leading-snug">{c.aName}</div>
                  <div className="text-surface/55 text-xs font-normal my-1.5">vs</div>
                  <div className="font-display text-base md:text-lg font-semibold leading-snug">{c.bName}</div>
                </div>
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  {c.aDifficulty && <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface/10 text-surface/70">{c.aDifficulty}</span>}
                  {c.bDifficulty && c.bDifficulty !== c.aDifficulty && <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface/10 text-surface/70">{c.bDifficulty}</span>}
                  {c.state && <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface/10 text-surface/70">{c.state}</span>}
                  <span className="ml-auto text-accent-glow text-xs font-medium flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    View <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* Fallback — no clean comparison pages yet: link the interactive tool */
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-3">
            {fallbackPairs.map((p) => (
              <Link
                key={p.slugs}
                href={`/compare?slugs=${p.slugs}`}
                className="glass-dark rounded-xl p-3 md:p-4 hover:bg-surface/10 transition-colors"
              >
                <div className="text-[10px] uppercase tracking-widest text-accent-glow mb-1.5">vs</div>
                <div className="font-display text-sm md:text-base font-semibold leading-snug">{p.a}</div>
                <div className="text-surface/55 text-xs font-normal my-1">vs</div>
                <div className="font-display text-sm md:text-base font-semibold leading-snug">{p.b}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
