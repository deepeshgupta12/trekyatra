import { useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, StatusBar } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeArea } from "@/components/ui/SafeArea";
import { SearchBar, SearchBarWrapper } from "@/components/browse/SearchBar";
import { FilterChips } from "@/components/browse/FilterChips";
import { TrekGrid } from "@/components/browse/TrekGrid";
import { useTheme } from "@/hooks/useTheme";
import { useExplore } from "@/hooks/useExplore";
import { useExploreStore } from "@/stores/exploreStore";

const REGIONS = [
  "Himachal Pradesh",
  "Uttarakhand",
  "Jammu & Kashmir",
  "Sikkim",
  "Ladakh",
  "Maharashtra",
  "Rajasthan",
  "Karnataka",
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
  const params = useLocalSearchParams<{ region?: string }>();
  const { trekState, trekDifficulty, trekSeason, durationBucket, setTrekState } = useExploreStore();

  useEffect(() => {
    if (params.region) setTrekState(params.region);
  }, [params.region, setTrekState]);

  const { pages, isLoading, isFetchingMore, loadMore } = useExplore({
    trekState,
    trekDifficulty,
    trekSeason,
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
