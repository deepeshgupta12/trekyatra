import { useEffect } from "react";
import { View, Text, TouchableOpacity, StyleSheet, StatusBar, Dimensions } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeArea } from "@/components/ui/SafeArea";
import { SearchBar, SearchBarWrapper } from "@/components/browse/SearchBar";
import { FilterChips } from "@/components/browse/FilterChips";
import { TrekGrid } from "@/components/browse/TrekGrid";
import { TrekCard } from "@/components/trek/TrekCard";
import { NearbyTreksStrip } from "@/components/home/NearbyTreksStrip";
import { useTheme } from "@/hooks/useTheme";
import { useExplore } from "@/hooks/useExplore";
import { useExploreStore } from "@/stores/exploreStore";
import type { ExploreFilters } from "@/lib/mobileApi";

const SIMILAR_CARD_W = Math.floor((Dimensions.get("window").width - 16 * 2 - 12) / 2);

export default function BrowseScreen() {
  const { colors, isDark } = useTheme();
  const params = useLocalSearchParams<{ region?: string; difficulty?: string; season?: string; openFilters?: string }>();
  const {
    trekState, trekDifficulty, trekSeason, trekSuitability, durationBucket,
    setTrekState, setTrekDifficulty, setTrekSeason, requestSheetOpen, clearAll,
  } = useExploreStore();

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

  // N05 — no-results + similar treks. When the applied filters return nothing, suggest treks by
  // relaxing the filters: keep only the primary facet, or (if a single filter yielded nothing)
  // broaden to all treks.
  const activeCount = [trekState, trekDifficulty, trekSeason, trekSuitability, durationBucket].filter(Boolean).length;
  const hasActiveFilters = activeCount > 0;
  const showSimilar = !isLoading && pages.length === 0 && hasActiveFilters;

  const relaxedFilters: ExploreFilters =
    activeCount <= 1 ? {}
    : trekState ? { trekState }
    : trekDifficulty ? { trekDifficulty }
    : trekSeason ? { trekSeason }
    : trekSuitability ? { trekSuitability }
    : {};

  const similar = useExplore(relaxedFilters, { enabled: showSimilar });
  const similarTreks = (similar.pages ?? []).slice(0, 6);

  const header = (
    <View>
      <Text style={[styles.pageTitle, { color: colors.textPrimary }]}>Explore Treks</Text>

      <SearchBarWrapper>
        <SearchBar />
      </SearchBarWrapper>

      {/* N04: Categories / Explore-by-Region / Best-by-Season removed from the body — those
          dimensions (region / season / difficulty / suitability / duration) live inside the
          Filters sheet, which is now the single filtering surface. */}
      <View style={styles.filtersWrapper}>
        <FilterChips />
      </View>

      {/* Nearby Treks — GPS strip */}
      <NearbyTreksStrip />

      <Text style={[styles.hubHeading, styles.gridHeading, { color: colors.textPrimary }]}>All Treks</Text>
    </View>
  );

  const emptyWithSimilar = (
    <View style={styles.emptyWrap}>
      <View style={[styles.emptyIcon, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(29,58,46,0.05)" }]}>
        <Ionicons name="search-outline" size={26} color={colors.textMuted} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No treks match your filters</Text>
      <Text style={[styles.emptySub, { color: colors.textMuted }]}>
        Try removing a filter — or explore these similar treks.
      </Text>
      <TouchableOpacity style={[styles.clearBtn, { borderColor: colors.accent }]} onPress={clearAll} activeOpacity={0.8}>
        <Text style={[styles.clearBtnText, { color: colors.accent }]}>Clear all filters</Text>
      </TouchableOpacity>

      {similarTreks.length > 0 && (
        <View style={styles.similarWrap}>
          <Text style={[styles.similarHeading, { color: colors.textPrimary }]}>Similar treks</Text>
          <View style={styles.similarGrid}>
            {similarTreks.map((t) => (
              <View key={t.slug} style={styles.similarCell}>
                <TrekCard trek={t} width={SIMILAR_CARD_W} noMargin />
              </View>
            ))}
          </View>
        </View>
      )}
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
        renderEmpty={showSimilar ? emptyWithSimilar : undefined}
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
  hubHeading: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
    paddingHorizontal: 16,
  },
  gridHeading: {
    marginTop: 28,
    marginBottom: 12,
  },
  emptyWrap: {
    paddingHorizontal: 16,
    paddingTop: 20,
    alignItems: "center",
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 17,
    fontFamily: "PlayfairDisplay_700Bold",
    textAlign: "center",
  },
  emptySub: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 19,
    paddingHorizontal: 24,
  },
  clearBtn: {
    marginTop: 16,
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: "700",
  },
  similarWrap: {
    marginTop: 32,
    width: "100%",
  },
  similarHeading: {
    fontSize: 18,
    fontFamily: "PlayfairDisplay_700Bold",
    marginBottom: 14,
  },
  similarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  similarCell: {
    width: SIMILAR_CARD_W,
  },
});
