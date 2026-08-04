"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TrekCard, type Trek } from "@/components/trek/TrekCard";
import type { CMSPage } from "@/lib/api";
import { cmsPageToTrek } from "@/lib/trek-utils";
import { SEASONS, seasonForMonth, trekMatchesSeason, type SeasonSlug } from "@/lib/seasons";

interface Props {
  treks: Trek[];
  cmsPages?: CMSPage[];
}

export function SeasonalTreksSection({ treks, cmsPages = [] }: Props) {
  // Static default prevents SSR/client hydration mismatch; useEffect picks the current season.
  const [active, setActive] = useState<SeasonSlug>("monsoon");
  useEffect(() => {
    setActive(seasonForMonth(new Date().getMonth() + 1));
  }, []);

  // Convert CMS pages to Trek objects, prefer these over static treks
  const cmsTreks = useMemo(() => cmsPages.map(cmsPageToTrek), [cmsPages]);
  const allTreks = useMemo(() => {
    const cmsSlugSet = new Set(cmsTreks.map(t => t.slug));
    return [...cmsTreks, ...treks.filter(t => !cmsSlugSet.has(t.slug))];
  }, [cmsTreks, treks]);

  const filtered = useMemo(
    () => allTreks.filter((t) => trekMatchesSeason(t, active)).slice(0, 3),
    [allTreks, active],
  );
  const activeLabel = SEASONS.find((s) => s.slug === active)?.label ?? "";

  return (
    <section className="py-16 md:py-24">
      <div className="container-wide">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-accent mb-2">Trek by season</div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold leading-tight">
              Best treks to do right now
            </h2>
          </div>
          <Link
            href={`/seasons/${active}`}
            className="flex items-center gap-1 text-sm text-accent hover:underline font-medium whitespace-nowrap"
          >
            {activeLabel} collection <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Season tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1 -mx-1 px-1">
          {SEASONS.map((s) => (
            <button
              key={s.slug}
              onClick={() => setActive(s.slug)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                active === s.slug
                  ? "bg-accent text-accent-foreground border-accent shadow"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-accent/40"
              }`}
            >
              <span aria-hidden="true">{s.emoji}</span>
              {s.label}
              <span className="text-[10px] opacity-60 hidden sm:inline">{s.hint}</span>
            </button>
          ))}
        </div>

        {/* Trek cards — state shown as tag by TrekCard */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {filtered.map((t) => (
              <TrekCard key={t.slug} trek={t} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm py-8 text-center">
            No treks in our catalog for {activeLabel} yet.{" "}
            <Link href="/explore" className="text-accent hover:underline">
              Explore all treks →
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
