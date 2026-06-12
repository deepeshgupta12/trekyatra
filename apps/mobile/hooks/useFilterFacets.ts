import { useQuery } from "@tanstack/react-query";
import { contentApi } from "@/lib/mobileApi";

export function useFilterFacets() {
  const { data, isLoading } = useQuery({
    queryKey: ["filter-facets"],
    queryFn: () => contentApi.getFilterFacets(),
    staleTime: 60 * 60 * 1000,
  });

  return {
    facets: data ?? { states: [], difficulties: [], seasons: [], suitabilities: [], durations: [] },
    isLoading,
  };
}
