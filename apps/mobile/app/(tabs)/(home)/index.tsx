import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  StatusBar,
} from "react-native";
import { useState, useCallback } from "react";
import { router } from "expo-router";
import { SafeArea } from "@/components/ui/SafeArea";
import { HomeHeroV2 } from "@/components/home/HomeHeroV2";
import type { QuickFilterChip } from "@/components/home/QuickFilterChips";
import { trackAiSearchOpened, trackVoiceSearchUsed, trackFilterChipTapped } from "@/lib/analytics";
import { useAuth } from "@/hooks/useAuth";
import { useBehaviorProfile } from "@/hooks/useBehaviorProfile";
import { usePreferences } from "@/hooks/usePreferences";
import { useHomeData } from "@/hooks/useHomeData";
import { useTheme } from "@/hooks/useTheme";
import { PopularTrailsSection } from "@/components/home/PopularTrailsSection";
import { CategoryHubRow } from "@/components/home/CategoryHubRow";
import { RegionsRow } from "@/components/home/RegionsRow";
import { DifficultyTabsSection } from "@/components/home/DifficultyTabsSection";
import { EditorialFeatureCard } from "@/components/home/EditorialFeatureCard";
import { SeasonalPicksRow } from "@/components/home/SeasonalPicksRow";
import { RecentlyViewedRow } from "@/components/home/RecentlyViewedRow";
import { PersonalisedFeedSection } from "@/components/home/PersonalisedFeedSection";
import { ComparisonCTACard } from "@/components/home/ComparisonCTACard";
import { ResourcesRow } from "@/components/home/ResourcesRow";
import { OperatorsCTACard } from "@/components/home/OperatorsCTACard";
import { HomeSkeleton } from "@/components/home/HomeSkeleton";
import { NearbyTreksStrip } from "@/components/home/NearbyTreksStrip";

const FILTER_CHIPS: QuickFilterChip[] = [
  { key: "difficulty", label: "Difficulty", icon: "options-outline" },
  { key: "length", label: "Length", icon: "resize-outline" },
  { key: "elevation", label: "Elevation gain", icon: "trending-up-outline" },
];

type HomeState = "A" | "B" | "C" | "D";

function resolveState(
  isLoggedIn: boolean,
  hasBehavior: boolean,
  profileLoaded: boolean
): HomeState | null {
  if (!profileLoaded) return null; // still loading
  if (isLoggedIn) return hasBehavior ? "B" : "A";
  return hasBehavior ? "D" : "C";
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { isDark } = useTheme();
  const { profile, loaded: profileLoaded, hasBehavior, recentViews, topRegions, topDifficulties } =
    useBehaviorProfile();
  const { prefs } = usePreferences();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isLoggedIn = !!user;
  const homeState = resolveState(isLoggedIn, hasBehavior, profileLoaded);

  // Personalization blend: explicit onboarding prefs ANCHOR the order; behavior reweights.
  const blendedRegions = Array.from(new Set([...(prefs?.regions ?? []), ...topRegions]));
  const blendedDifficulties = Array.from(new Set([...(prefs?.difficulties ?? []), ...topDifficulties]));

  const { trending, seasonal, recommendations, isLoading, refetch } = useHomeData({
    topRegions: blendedRegions,
    topDifficulties: blendedDifficulties,
    isLoggedIn,
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const firstName = user?.fullName?.split(" ")[0] ?? "there";
  const topRegion = prefs?.regions?.[0] ?? topRegions[0] ?? null; // onboarding region anchors the greeting

  const hero = (
    <HomeHeroV2
      firstName={firstName}
      locationLabel={topRegion}
      onSearchPress={() => { trackAiSearchOpened("home"); router.push("/(tabs)/browse/search" as never); }}
      onVoicePress={() => { trackVoiceSearchUsed("home"); router.push("/(tabs)/browse/search?voice=1" as never); }}
      onNotificationsPress={() => router.push("/notifications" as never)}
      onMapPress={() => router.push("/(tabs)/browse" as never)}
      filterChips={FILTER_CHIPS}
      onFilterPress={(key) => { trackFilterChipTapped(key); router.push("/(tabs)/browse" as never); }}
    />
  );

  // Show skeleton on first load
  if (!homeState || (isLoading && trending.length === 0)) {
    return (
      <SafeArea>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        {hero}
        <HomeSkeleton />
      </SafeArea>
    );
  }

  return (
    <SafeArea>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#E8702A"
            colors={["#E8702A"]}
          />
        }
      >
        {hero}

        {/* Popular with trekkers — prominent TrailCards (all states) */}
        <PopularTrailsSection
          treks={trending}
          loading={isLoading && trending.length === 0}
          onSeeAll={() => router.push("/(tabs)/browse" as never)}
        />

        {/* Nearby Treks (GPS) — shown when location is granted or prompt shown when denied */}
        <NearbyTreksStrip />

        {/* Category hub (packing/permits/costs/safety/plan) — all states */}
        <CategoryHubRow />

        {/* Regions row — all states */}
        <RegionsRow />

        {/* Treks by difficulty — all states */}
        <DifficultyTabsSection />

        {/* Editorial feature → beginner guide — all states */}
        <EditorialFeatureCard />

        {/* Seasonal picks — all states */}
        <SeasonalPicksRow
          treks={seasonal}
          loading={isLoading && seasonal.length === 0}
        />

        {/* Recently viewed — State D only */}
        {homeState === "D" && <RecentlyViewedRow views={recentViews} />}

        {/* Personalised feed — States A + B + D */}
        {homeState !== "C" && (
          <PersonalisedFeedSection
            treks={recommendations}
            state={homeState as "A" | "B" | "D"}
            firstName={isLoggedIn ? firstName : undefined}
            loading={isLoading && recommendations.length === 0}
          />
        )}

        {/* Comparison CTA — all states */}
        <ComparisonCTACard />

        {/* Resources row — all states */}
        <ResourcesRow />

        {/* Operators CTA — all states */}
        <OperatorsCTACard />

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  bottomSpacer: {
    height: 32,
  },
});
