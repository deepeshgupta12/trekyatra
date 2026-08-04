/**
 * Canonical SEASON taxonomy for the web — MIRRORS `services/api/app/modules/hubs/season_meta.py`.
 * One 5-season definition (spring/summer/monsoon/autumn/winter) so the home season tabs, the
 * `/seasons/[slug]` hub, and the backend `/treks/seasonal` endpoint all agree.
 *
 * Trek→season matching uses the Trek Backfill month arrays first (`trek_best_months` →
 * `trek_open_months`), falling back to parsing the free-text `trek_season` string — identical to
 * the backend rule (decided 2026-08-04).
 */

export type SeasonSlug = "spring" | "summer" | "monsoon" | "autumn" | "winter";

export interface SeasonMeta {
  slug: SeasonSlug;
  label: string;      // display name
  emoji: string;
  months: number[];   // 1 = Jan
  hint: string;       // month range label
}

export const SEASONS: SeasonMeta[] = [
  { slug: "spring",  label: "Spring",  emoji: "🌸", months: [3, 4],      hint: "Mar – Apr" },
  { slug: "summer",  label: "Summer",  emoji: "☀️", months: [5, 6],      hint: "May – Jun" },
  { slug: "monsoon", label: "Monsoon", emoji: "🌧️", months: [7, 8, 9],   hint: "Jul – Sep" },
  { slug: "autumn",  label: "Autumn",  emoji: "🍂", months: [10, 11],    hint: "Oct – Nov" },
  { slug: "winter",  label: "Winter",  emoji: "❄️", months: [12, 1, 2],  hint: "Dec – Feb" },
];

export const SEASON_BY_SLUG: Record<SeasonSlug, SeasonMeta> = SEASONS.reduce(
  (acc, s) => { acc[s.slug] = s; return acc; },
  {} as Record<SeasonSlug, SeasonMeta>,
);

/** The canonical season for a given month (1=Jan) — used to auto-select the current tab. */
export function seasonForMonth(month: number): SeasonSlug {
  return SEASONS.find((s) => s.months.includes(month))?.slug ?? "winter";
}

const MONTH_ABBR: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

/** Expand a free-text season string ("Dec – Apr", "May, Jun") into month numbers. */
export function parseSeasonString(season: string | null | undefined): number[] {
  if (!season) return [];
  const abbrs = season.match(/[A-Za-z]{3,}/g) ?? [];
  const nums = abbrs.map((a) => MONTH_ABBR[a.slice(0, 3).toLowerCase()]).filter(Boolean) as number[];
  if (nums.length <= 1) return nums;
  if (nums.length === 2 && /[-–—]|to/.test(season)) {
    const [start, end] = nums;
    const out: number[] = [];
    let m = start;
    for (let i = 0; i < 12; i++) {
      out.push(m);
      if (m === end) break;
      m = (m % 12) + 1;
    }
    return out;
  }
  return nums;
}

/** A trek's active months — backfill arrays first, then the season string (mirrors the backend). */
export function trekMonths(t: {
  trek_best_months?: number[] | null;
  trek_open_months?: number[] | null;
  season?: string | null;
  trek_season?: string | null;
}): number[] {
  if (t.trek_best_months && t.trek_best_months.length) return t.trek_best_months;
  if (t.trek_open_months && t.trek_open_months.length) return t.trek_open_months;
  return parseSeasonString(t.season ?? t.trek_season);
}

export function trekMatchesSeason(
  t: { trek_best_months?: number[] | null; trek_open_months?: number[] | null; season?: string | null; trek_season?: string | null },
  slug: SeasonSlug,
): boolean {
  const wanted = SEASON_BY_SLUG[slug].months;
  return trekMonths(t).some((m) => wanted.includes(m));
}
