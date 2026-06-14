import { useQuery } from "@tanstack/react-query";
import { contentApi } from "@/lib/mobileApi";

export function useTrendingSearches() {
  return useQuery({
    queryKey: ["trending-searches"],
    queryFn: () => contentApi.getTrendingSearches(8),
    staleTime: 30 * 60 * 1000,
  });
}
