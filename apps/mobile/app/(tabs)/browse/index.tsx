import { useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeArea } from "@/components/ui/SafeArea";
import { SearchBar, SearchBarWrapper } from "@/components/browse/SearchBar";
import { FilterChips } from "@/components/browse/FilterChips";
import { TrekGrid } from "@/components/browse/TrekGrid";
import { NearbyTreksStrip } from "@/components/home/NearbyTreksStrip";
import { CategoryRow, type TrekCategory } from "@/components/browse/CategoryRow";
import { useTheme } from "@/hooks/useTheme";
import { useExplore } from "@/hooks/useExplore";
import { useExploreStore } from "@/stores/exploreStore";
import { trackCategoryTapped } from "@/lib/analytics";

import { REGIONS } from "@/constants/regions";

// Illustrated Explore categories → real navigable filters (region/season/difficulty).
const CATEGORIES: TrekCategory[] = [
  { key: "himalayan", label: "Himalayan", icon: "triangle-outline", tint: "#33506b" },
  { key: "sahyadri", label: "Sahyadri", icon: "trail-sign-outline", tint: "#4a7a52" },
  { key: "desert", label: "Desert", icon: "sunny-outline", tint: "#b07d4b" },
  { key: "snow", label: "Snow Treks", icon: "snow-outline", tint: "#5298C9" },
  { key: "beginner", label: "Beginner", icon: "leaf-outline", tint: "#22c55e" },
  { key: "summit", label: "High Altitude", icon: "flag-outline", tint: "#E8702A" },
];

const SEASONS = [
  { slug: "winter", label: "Winter" },
  { slug: "spring", label: "Spring" },
  { slug: "summer", label: "Summer" },
  { slug: "monsoon", label: "Monsoon" },
  { slug: "autumn", label: "Autumn" },
];

export default function BrowseScreen() {
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams<{ region?: string; difficulty?: string; season?: string; openFilters?: string }>();
  const { trekState, trekDifficulty, trekSeason, trekSuitability, durationBucket, setTrekState, setTrekDifficulty, setTrekSeason, requestSheetOpen } = useExploreStore();

  function handleCategory(key: string) {
    trackCategoryTapped(key);
    switch (key) {
      case "himalayan": router.push(`/(tabs)/browse/regions/${encodeURIComponent("Himachal Pradesh")}` as never); break;
      case "sahyadri": router.push(`/(tabs)/browse/regions/${encodeURIComponent("Maharashtra")}` as never); break;
      case "desert": router.push(`/(tabs)/browse/regions/${encodeURIComponent("Rajasthan")}` as never); break;
      case "snow": router.push("/(tabs)/browse/seasons/winter" as never); break;
      case "beginner": setTrekDifficulty("Easy"); break;      // grid below re-filters in place
      case "summit": setTrekDifficulty("Challenging"); break;
    }
  }

  // Apply filters passed via navigation (Home "View all" / quick chips) + open the sheet on request.
  useEffect(() => {
    if (params.region) setTrekState(params.region);
    if (params.difficulty) setTrekDifficulty(params.difficulty);
    if (params.season) setTrekSeason(params.season);
    if (params.openFilters === "1") requestSheetOpen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.region, params.difficulty, params.season, params.openFilters]);

  const { pages, isLoading, isFetchingMore, loadMore } = useExplore({
    trekState,
    trekDifficulty,
    trekSeason,
    trekSuitability,
    trekDurationMin: durationBucket?.min ?? null,
    trekDurationMax: durationBucket?.max ?? null,
  });

  const header = (
    <View>
      <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Explore Treks</Text>

      <SearchBarWrapper>
        <SearchBar />
      </SearchBarWrapper>

      <View style={styles.filtersWrapper}>
        <FilterChips />
      </View>

      <View style={styles.hubSection}>
        <Text style={[styles.hubHeading, { color: colors.textPrimary }]}>Categories</Text>
        <CategoryRow categories={CATEGORIES} onPress={handleCategory} />
      </View>

      <View style={styles.hubSection}>
        <Text style={[styles.hubHeading, { color: colors.textPrimary }]}>Explore by Region</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hubRow}>
          {REGIONS.map((region) => (
            <TouchableOpacity
              key={region}
              style={[
                styles.hubChip,
                {
                  backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(29,58,46,0.07)",
                  borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(29,58,46,0.15)",
                },
              ]}
              activeOpacity={0.7}
              onPress={() => router.push(`/(tabs)/browse/regions/${encodeURIComponent(region)}` as never)}
            >
              <Text style={[styles.hubChipText, { color: colors.textSecondary }]}>{region}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.hubSection}>
        <Text style={[styles.hubHeading, { color: colors.textPrimary }]}>Best by Season</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hubRow}>
          {SEASONS.map((season) => (
            <TouchableOpacity
              key={season.slug}
              style={[
                styles.hubChip,
                {
                  backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(29,58,46,0.07)",
                  borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(29,58,46,0.15)",
                },
              ]}
              activeOpacity={0.7}
              onPress={() => router.push(`/(tabs)/browse/seasons/${season.slug}` as never)}
            >
              <Text style={[styles.hubChipText, { color: colors.textSecondary }]}>{season.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Nearby Treks — GPS strip */}
      <NearbyTreksStrip />

      <Text style={[styles.hubHeading, styles.gridHeading, { color: colors.textPrimary }]}>All Treks</Text>
    </View>
  );

  return (
    <SafeArea>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <TrekGrid
        treks={pages}
        isLoading={isLoading}
        isFetchingMore={isFetchingMore}
        onEndReached={loadMore}
        ListHeaderComponent={header}
      />
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  pageTitle: {
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
    paddingHorizontal: 16,
    paddingTop: 12,
    marginBottom: 16,
  },
  filtersWrapper: {
    marginTop: 12,
    marginBottom: 4,
  },
  hubSection: {
    marginTop: 28,
    gap: 12,
  },
  hubHeading: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
    paddingHorizontal: 16,
  },
  hubRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 4,
  },
  hubChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
  },
  hubChipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  gridHeading: {
    marginTop: 28,
    marginBottom: 12,
  },
});
