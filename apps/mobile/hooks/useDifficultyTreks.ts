import { useQuery } from "@tanstack/react-query";
import { contentApi, type TrekListItem } from "@/lib/mobileApi";

export type DifficultyTab = "Easy" | "Moderate" | "Challenging";

// Raw `trek_difficulty` values to query for each tab. CMS data uses combined
// labels like "Moderate-Difficult", which should surface under both the
// "Moderate" and "Challenging" tabs (mirrors web's fuzzy substring matching
// in apps/web-next/components/home/DifficultyTabsSection.tsx).
const DIFFICULTY_QUERY_VALUES: Record<DifficultyTab, string[]> = {
  Easy: ["Easy"],
  Moderate: ["Moderate", "Moderate-Difficult"],
  Challenging: ["Challenging", "Difficult", "Moderate-Difficult"],
};

export function useDifficultyTreks(activeTab: DifficultyTab) {
  return useQuery({
    queryKey: ["difficulty-treks", activeTab],
    queryFn: async () => {
      const batches = await Promise.all(
        DIFFICULTY_QUERY_VALUES[activeTab].map((value) =>
          contentApi.exploreTreks({ trekDifficulty: value }, 10, 0)
        )
      );

      const seen = new Set<string>();
      const merged: TrekListItem[] = [];
      for (const trek of batches.flat()) {
        if (!seen.has(trek.slug)) {
          seen.add(trek.slug);
          merged.push(trek);
        }
      }
      return merged.slice(0, 10);
    },
    staleTime: 10 * 60 * 1000,
  });
}
