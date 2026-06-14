import { useQuery } from "@tanstack/react-query";
import { contentApi } from "@/lib/mobileApi";

export function useRegionTreks(region: string) {
  return useQuery({
    queryKey: ["region-treks", region],
    queryFn: () => contentApi.exploreTreks({ trekState: region }, 5, 0),
    staleTime: 10 * 60 * 1000,
  });
}
