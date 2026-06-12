import { useLayoutEffect } from "react";
import { Text, StyleSheet } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { SafeArea } from "@/components/ui/SafeArea";
import { TrekGrid } from "@/components/browse/TrekGrid";
import { useTheme } from "@/hooks/useTheme";
import { contentApi } from "@/lib/mobileApi";

const SEASON_MONTHS: Record<string, { label: string; month: number }> = {
  winter: { label: "Winter", month: 1 },
  spring: { label: "Spring", month: 4 },
  summer: { label: "Summer", month: 6 },
  monsoon: { label: "Monsoon", month: 8 },
  autumn: { label: "Autumn", month: 10 },
};

export default function SeasonHubScreen() {
  const { colors } = useTheme();
  const { season } = useLocalSearchParams<{ season: string }>();
  const navigation = useNavigation();
  const seasonInfo = SEASON_MONTHS[season ?? ""] ?? { label: "This Season", month: new Date().getMonth() + 1 };

  useLayoutEffect(() => {
    navigation.setOptions({ title: seasonInfo.label });
  }, [navigation, seasonInfo.label]);

  const { data, isLoading } = useQuery({
    queryKey: ["seasonal-treks", seasonInfo.month],
    queryFn: () => contentApi.getSeasonalTreks(seasonInfo.month),
    staleTime: 30 * 60 * 1000,
  });

  const header = (
    <Text style={[styles.heading, { color: colors.textPrimary }]}>
      Best treks for {seasonInfo.label}
    </Text>
  );

  return (
    <SafeArea>
      <TrekGrid
        treks={data ?? []}
        isLoading={isLoading}
        isFetchingMore={false}
        onEndReached={() => {}}
        emptyMessage={`No treks recommended for ${seasonInfo.label} yet`}
        ListHeaderComponent={header}
      />
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
});
