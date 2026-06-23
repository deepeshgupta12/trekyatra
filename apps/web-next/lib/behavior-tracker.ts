/**
 * Cookie-based behavior tracker for personalised recommendations.
 * Tracks which trek pages a user visits, building a preference profile.
 * When the user is authenticated, the profile is also synced to the backend
 * so it is available on mobile (cross-platform personalization sync).
 */

const STORAGE_KEY = "ty_behavior_v1";
const MAX_ENTRIES = 50;

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

/**
 * Push current localStorage profile to the backend.
 * Fire-and-forget. Called after web login and on each trek view when authenticated.
 */
export async function syncBehaviorProfileToBackend(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const profile = getBehaviorProfile();
    if (!profile) return;
    const payload = {
      views: profile.views,
      topRegions: profile.topRegions,
      topDifficulties: profile.topDifficulties,
    };
    await fetch("/api/v1/account/behavior-profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload),
    });
  } catch {
    // Non-critical — silent fail
  }
}

/**
 * Pull behavior profile from backend and merge with localStorage.
 * Called once on web login for cross-platform sync.
 */
export async function pullAndMergeBehaviorProfileFromBackend(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const resp = await fetch("/api/v1/account/behavior-profile", {
      credentials: "include",
    });
    if (!resp.ok) return;
    const remote = (await resp.json()) as { views: TrekViewEntry[]; topRegions: string[]; topDifficulties: string[] };
    const localViews = readViews();
    const localSlugs = new Set(localViews.map((v) => v.slug));
    const merged = [
      ...localViews,
      ...remote.views.filter((v) => !localSlugs.has(v.slug)),
    ]
      .sort((a, b) => b.ts - a.ts)
      .slice(0, MAX_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    // Push merged back to backend
    await syncBehaviorProfileToBackend();
  } catch {
    // Non-critical — silent fail
  }
}

function readViews(): TrekViewEntry[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as TrekViewEntry[];
  } catch {
    return [];
  }
}
