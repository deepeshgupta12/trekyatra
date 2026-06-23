import AsyncStorage from "@react-native-async-storage/async-storage";
import { accountApi } from "@/lib/mobileApi";

const BEHAVIOR_KEY = "ty_behavior_v1";
const MAX_VIEWS = 50;

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
}

export async function getBehaviorProfile(): Promise<BehaviorProfile | null> {
  try {
    const raw = await AsyncStorage.getItem(BEHAVIOR_KEY);
    return raw ? (JSON.parse(raw) as BehaviorProfile) : null;
  } catch {
    return null;
  }
}

export function hasBehaviorData(profile: BehaviorProfile | null): boolean {
  return !!profile && profile.views.length > 0;
}

export async function recordTrekView(
  entry: Omit<TrekViewEntry, "ts">,
  isAuthenticated = false
): Promise<void> {
  try {
    const profile = (await getBehaviorProfile()) ?? {
      views: [],
      topRegions: [],
      topDifficulties: [],
    };

    // Deduplicate: remove previous view of same slug, then prepend fresh entry
    const filtered = profile.views.filter((v) => v.slug !== entry.slug);
    const views: TrekViewEntry[] = [{ ...entry, ts: Date.now() }, ...filtered].slice(
      0,
      MAX_VIEWS
    );

    const topRegions = computeTop(views.map((v) => v.region).filter(Boolean));
    const topDifficulties = computeTop(views.map((v) => v.difficulty).filter(Boolean));

    const updated: BehaviorProfile = { views, topRegions, topDifficulties };
    await AsyncStorage.setItem(BEHAVIOR_KEY, JSON.stringify(updated));

    // Push to backend for cross-platform sync when authenticated
    if (isAuthenticated) {
      accountApi.putBehaviorProfile(updated).catch(() => {});
    }
  } catch {
    // Behavior tracking is non-critical — silent fail
  }
}

/**
 * Pull behavior profile from backend and merge with local AsyncStorage data.
 * Called once on login. Remote views are merged (deduplicated by slug, local wins on tie).
 */
export async function pullAndMergeBehaviorProfile(): Promise<void> {
  try {
    const [local, remote] = await Promise.all([
      getBehaviorProfile(),
      accountApi.getBehaviorProfile(),
    ]);

    const localViews = local?.views ?? [];
    const remoteViews = (remote?.views ?? []) as TrekViewEntry[];

    // Merge: local wins on duplicate slugs, remote fills in the rest
    const localSlugs = new Set(localViews.map((v) => v.slug));
    const merged = [
      ...localViews,
      ...remoteViews.filter((v) => !localSlugs.has(v.slug)),
    ]
      .sort((a, b) => b.ts - a.ts)
      .slice(0, MAX_VIEWS);

    const topRegions = computeTop(merged.map((v) => v.region).filter(Boolean));
    const topDifficulties = computeTop(merged.map((v) => v.difficulty).filter(Boolean));

    const merged_profile: BehaviorProfile = { views: merged, topRegions, topDifficulties };
    await AsyncStorage.setItem(BEHAVIOR_KEY, JSON.stringify(merged_profile));

    // Push merged result back to backend
    accountApi.putBehaviorProfile(merged_profile).catch(() => {});
  } catch {
    // Non-critical — silent fail
  }
}

/**
 * Push current local behavior profile to backend (called on login).
 */
export async function pushBehaviorProfile(): Promise<void> {
  try {
    const profile = await getBehaviorProfile();
    if (profile && profile.views.length > 0) {
      await accountApi.putBehaviorProfile(profile);
    }
  } catch {
    // Non-critical
  }
}

function computeTop(values: string[], limit = 3): string[] {
  const counts: Record<string, number> = {};
  for (const v of values) counts[v] = (counts[v] ?? 0) + 1;
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([k]) => k);
}
