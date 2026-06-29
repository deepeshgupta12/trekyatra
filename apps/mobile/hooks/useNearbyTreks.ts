import { useState } from "react";
import { Linking } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/mobileApi";
import { getUserLocation } from "@/lib/location";
import type { NearbyTrekOut, NearbyTreksOut } from "@/lib/mobileApi";

export { NearbyTrekOut };

export function useNearbyTreks() {
  const [locationGranted, setLocationGranted] = useState<boolean | null>(null);

  const { data, isLoading, refetch } = useQuery<NearbyTreksOut | null>({
    queryKey: ["nearby-treks"],
    queryFn: async () => {
      const loc = await getUserLocation();
      if (!loc) {
        setLocationGranted(false);
        return null;
      }
      setLocationGranted(true);
      return apiGet<NearbyTreksOut>(
        `/api/v1/mobile/nearby?lat=${loc.lat}&lon=${loc.lon}&limit=8`
      );
    },
    staleTime: 30 * 60 * 1000,
    retry: false,
  });

  return {
    treks: data?.treks ?? [],
    locationGranted,
    isLoading,
    refresh: refetch,
    openSettings: () => Linking.openSettings(),
  };
}
