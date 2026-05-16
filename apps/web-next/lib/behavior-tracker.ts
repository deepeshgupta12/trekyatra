/**
 * Cookie-based behavior tracker for personalised recommendations.
 * No login required — works purely via localStorage.
 * Tracks which trek pages a user visits, building a preference profile.
 */

const STORAGE_KEY = "ty_behavior_v1";
const MAX_ENTRIES = 25;

export interface TrekViewEntry {
  slug: string;
  region: string;
  difficulty: string;
  season: string;
  ts: number;
}

export interface BehaviorProfile {
  views: TrekViewEntry[];
  topRegions: string[];
  topDifficulties: string[];
  hasData: boolean;
}

/** Record a trek page view. Safe to call on client only. */
export function recordTrekView(entry: Omit<TrekViewEntry, "ts">): void {
  if (typeof window === "undefined") return;
  try {
    const existing = readViews();
    const updated = [
      { ...entry, ts: Date.now() },
      // deduplicate by slug, most recent first
      ...existing.filter((v) => v.slug !== entry.slug),
    ].slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage may be unavailable (private browsing, storage quota)
  }
}

/** Return the full behavior profile. Returns null if no data exists. */
export function getBehaviorProfile(): BehaviorProfile | null {
  if (typeof window === "undefined") return null;
  const views = readViews();
  if (views.length === 0) return null;

  const regionCounts: Record<string, number> = {};
  const diffCounts: Record<string, number> = {};

  for (const v of views) {
    if (v.region) regionCounts[v.region] = (regionCounts[v.region] ?? 0) + 1;
    if (v.difficulty) diffCounts[v.difficulty] = (diffCounts[v.difficulty] ?? 0) + 1;
  }

  const topRegions = Object.entries(regionCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([r]) => r)
    .slice(0, 3);

  const topDifficulties = Object.entries(diffCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([d]) => d)
    .slice(0, 2);

  return { views, topRegions, topDifficulties, hasData: true };
}

/** Returns true only when the user has viewed at least one trek. */
export function hasBehaviorData(): boolean {
  if (typeof window === "undefined") return false;
  return readViews().length > 0;
}

function readViews(): TrekViewEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as TrekViewEntry[];
  } catch {
    return [];
  }
}
