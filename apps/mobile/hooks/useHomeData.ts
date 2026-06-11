import { useQueries } from "@tanstack/react-query";
import { contentApi } from "@/lib/mobileApi";

interface HomeDataOptions {
  topRegions: string[];
  topDifficulties: string[];
  isLoggedIn: boolean;
}

export function useHomeData({ topRegions, topDifficulties, isLoggedIn }: HomeDataOptions) {
  const results = useQueries({
    queries: [
      {
        queryKey: ["trending"],
        queryFn: () => contentApi.getTrendingTreks(),
        staleTime: 10 * 60 * 1000,
      },
      {
        queryKey: ["seasonal", new Date().getMonth()],
        queryFn: () => contentApi.getSeasonalTreks(),
        staleTime: 60 * 60 * 1000,
      },
      {
        queryKey: ["recommendations", isLoggedIn ? "personalised" : "anonymous", topRegions, topDifficulties],
        queryFn: () =>
          isLoggedIn
            ? contentApi.getPersonalisedRecommendations()
            : contentApi.getAnonymousRecommendations(),
        staleTime: 5 * 60 * 1000,
        enabled: true,
      },
    ],
  });

  const [trendingQ, seasonalQ, recsQ] = results;

  return {
    trending: trendingQ.data ?? [],
    seasonal: seasonalQ.data ?? [],
    recommendations: recsQ.data ?? [],
    isLoading: trendingQ.isLoading || seasonalQ.isLoading,
    refetch: () => {
      trendingQ.refetch();
      seasonalQ.refetch();
      recsQ.refetch();
    },
  };
}
