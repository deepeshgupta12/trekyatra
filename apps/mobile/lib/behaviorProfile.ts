import AsyncStorage from "@react-native-async-storage/async-storage";

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

export async function recordTrekView(entry: Omit<TrekViewEntry, "ts">): Promise<void> {
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

    await AsyncStorage.setItem(
      BEHAVIOR_KEY,
      JSON.stringify({ views, topRegions, topDifficulties })
    );
  } catch {
    // Behavior tracking is non-critical — silent fail
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
