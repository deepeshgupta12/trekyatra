"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TrekCard, type Trek } from "@/components/trek/TrekCard";
import type { CMSPage } from "@/lib/api";
import { cmsPageToTrek } from "@/lib/trek-utils";

type Season = "Summer" | "Monsoon" | "Autumn" | "Winter";

const SEASONS: { label: Season; emoji: string; months: string[]; hint: string }[] = [
  { label: "Summer",  emoji: "☀️",  months: ["Apr", "May"],                    hint: "Apr – May" },
  { label: "Monsoon", emoji: "🌧️", months: ["Jun", "Jul", "Aug", "Sep"],       hint: "Jun – Sep" },
  { label: "Autumn",  emoji: "🍂",  months: ["Oct", "Nov"],                    hint: "Oct – Nov" },
  { label: "Winter",  emoji: "❄️",  months: ["Dec", "Jan", "Feb", "Mar"],      hint: "Dec – Mar" },
];

// Month index (0=Jan … 11=Dec) → auto-selected tab
const MONTH_TO_SEASON: Record<number, Season> = {
  0: "Winter", 1: "Winter", 2: "Winter",
  3: "Summer", 4: "Summer",
  5: "Monsoon", 6: "Monsoon", 7: "Monsoon", 8: "Monsoon",
  9: "Autumn", 10: "Autumn",
  11: "Winter",
};

const SEASON_PAGES: Record<Season, string> = {
  Summer:  "/seasons/summer",
  Monsoon: "/seasons/monsoon",
  Autumn:  "/seasons/autumn",
  Winter:  "/seasons/winter",
};

// Month abbreviation → numeric month (1-based)
const MONTH_NUM: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

function seasonStringToMonths(season: string): number[] {
  // Handles both "Apr, May" (short month names) and "Dec – Apr" (range notation)
  const abbrs = season.match(/[A-Z][a-z]{2}/g) ?? [];
  if (abbrs.length === 0) return [];
  if (abbrs.length === 1) return [MONTH_NUM[abbrs[0]] ?? 0].filter(Boolean);
  // Range: expand "Dec – Apr" → [12, 1, 2, 3, 4]
  if (abbrs.length === 2 && (season.includes("–") || season.includes("-") || season.includes("to"))) {
    const start = MONTH_NUM[abbrs[0]] ?? 1;
    const end   = MONTH_NUM[abbrs[1]] ?? 12;
    const months: number[] = [];
    let m = start;
    for (let i = 0; i < 12; i++) {
      months.push(m);
      if (m === end) break;
      m = (m % 12) + 1;
    }
    return months;
  }
  return abbrs.map(a => MONTH_NUM[a] ?? 0).filter(Boolean);
}

function trekMatchesSeason(trek: Trek, season: Season): boolean {
  const seasonMonthNums = SEASONS.find((s) => s.label === season)?.months.map(m => MONTH_NUM[m] ?? 0) ?? [];
  const trekMonths = seasonStringToMonths(trek.season ?? "");
  return trekMonths.some(m => seasonMonthNums.includes(m));
}


interface Props {
  treks: Trek[];
  cmsPages?: CMSPage[];
}

export function SeasonalTreksSection({ treks, cmsPages = [] }: Props) {
  // Use a static default to prevent SSR/client hydration mismatch.
  // useEffect updates to the correct season after client-side mount.
  const [active, setActive] = useState<Season>("Monsoon");
  useEffect(() => {
    setActive(MONTH_TO_SEASON[new Date().getMonth()] ?? "Monsoon");
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
            href={SEASON_PAGES[active]}
            className="flex items-center gap-1 text-sm text-accent hover:underline font-medium whitespace-nowrap"
          >
            {active} collection <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Season tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1 -mx-1 px-1">
          {SEASONS.map((s) => (
            <button
              key={s.label}
              onClick={() => setActive(s.label)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                active === s.label
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
            No treks in our catalog for {active} yet.{" "}
            <Link href="/explore" className="text-accent hover:underline">
              Explore all treks →
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
