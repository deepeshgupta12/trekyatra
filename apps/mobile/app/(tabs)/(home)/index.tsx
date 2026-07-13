import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  StatusBar,
} from "react-native";
import { useState, useCallback } from "react";
import { SafeArea } from "@/components/ui/SafeArea";
import { HomeHero } from "@/components/home/HomeHero";
import { useAuth } from "@/hooks/useAuth";
import { useBehaviorProfile } from "@/hooks/useBehaviorProfile";
import { useHomeData } from "@/hooks/useHomeData";
import { useTheme } from "@/hooks/useTheme";
import { HomeWelcomeBannerA, HomeWelcomeBannerB } from "@/components/home/HomeWelcomeBanner";
import { HomeTrendingSection } from "@/components/home/HomeTrendingSection";
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
  const [isRefreshing, setIsRefreshing] = useState(false);

  const isLoggedIn = !!user;
  const homeState = resolveState(isLoggedIn, hasBehavior, profileLoaded);

  const { trending, seasonal, recommendations, isLoading, refetch } = useHomeData({
    topRegions,
    topDifficulties,
    isLoggedIn,
  });

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);

  const firstName = user?.fullName?.split(" ")[0] ?? "there";
  const viewCount = profile?.views.length ?? 0;
  const topRegion = topRegions[0] ?? null;

  // Show skeleton on first load
  if (!homeState || (isLoading && trending.length === 0)) {
    return (
      <SafeArea>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
        <HomeHero />
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
        <HomeHero />

        {/* Welcome Banner — States A + B */}
        {homeState === "A" && <HomeWelcomeBannerA firstName={firstName} />}
        {homeState === "B" && (
          <HomeWelcomeBannerB
            firstName={firstName}
            viewCount={viewCount}
            topRegion={topRegion}
            recentViews={recentViews}
          />
        )}

        {/* Trending row — all states */}
        <HomeTrendingSection
          treks={trending}
          state={homeState as "A" | "B" | "C" | "D"}
          loading={isLoading && trending.length === 0}
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
