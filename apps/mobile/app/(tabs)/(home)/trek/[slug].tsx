import {
  View,
  Text,
  ScrollView,
  Share,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { useTrekDetail } from "@/hooks/useTrekDetail";
import { TrekHero } from "@/components/trek/TrekHero";
import { TrekMetaStrip } from "@/components/trek/TrekMetaStrip";
import { TrekTabBar, type TrekTab } from "@/components/trek/TrekTabBar";
import { TrekStickyBar } from "@/components/trek/TrekStickyBar";
import { TrekRelatedRow } from "@/components/trek/TrekRelatedRow";
import { OfflineBadge } from "@/components/trek/OfflineBadge";
import { CMSContentRenderer } from "@/components/cms/CMSContentRenderer";
import { useTheme } from "@/hooks/useTheme";
import { recordTrekView } from "@/lib/behaviorProfile";
import { contentApi } from "@/lib/mobileApi";
import type { TrekListItem } from "@/lib/mobileApi";
import type { Block } from "@/components/cms/types";

export default function TrekDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data, isLoading, error } = useTrekDetail(slug ?? "");
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<TrekTab>("guide");
  const [relatedTreks, setRelatedTreks] = useState<TrekListItem[]>([]);

  const trek = data?.page;
  const fromCache = data?.fromCache ?? false;

  // Record behavior
  useEffect(() => {
    if (!trek) return;
    recordTrekView({
      slug: trek.slug,
      region: trek.trek_state ?? "",
      difficulty: trek.trek_difficulty ?? "",
      season: trek.trek_season ?? "",
    });
  }, [trek?.slug]);

  // Fetch related treks
  useEffect(() => {
    contentApi
      .getTrendingTreks()
      .then((treks) => setRelatedTreks(treks.filter((t) => t.slug !== slug).slice(0, 6)))
      .catch(() => {});
  }, [slug]);

  // Sub-page hooks for other tabs
  const { data: packingData } = useTrekDetail(slug ? `${slug}-packing` : "");
  const { data: permitsData } = useTrekDetail(slug ? `${slug}-permits` : "");
  const { data: costsData } = useTrekDetail(slug ? `${slug}-costs` : "");

  function getTabContent(): Block[] | null {
    switch (activeTab) {
      case "guide": return trek?.body_json as Block[] | null ?? null;
      case "packing": return packingData?.page.body_json as Block[] | null ?? null;
      case "permits": return permitsData?.page.body_json as Block[] | null ?? null;
      case "costs": return costsData?.page.body_json as Block[] | null ?? null;
    }
  }

  async function handleShare() {
    if (!trek) return;
    try {
      await Share.share({
        message: `Check out the ${trek.title} trek guide on TrekYatra`,
        url: `https://trekyatra.co.in/trek/${trek.slug}`,
        title: `${trek.title} Trek Guide`,
      });
    } catch {}
  }

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color="#E8702A" size="large" />
      </View>
    );
  }

  if (error || !trek) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary, textAlign: "center", paddingHorizontal: 24 }}>
          {error?.message ?? "Trek not found"}
        </Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={{ color: "#E8702A", fontWeight: "600" }}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isDifficultTrek =
    trek.trek_difficulty === "Challenging" || trek.trek_difficulty === "Difficult";

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      {/* Share button injected into transparent header */}
      <TouchableOpacity
        style={styles.shareButton}
        onPress={handleShare}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Text style={styles.shareIcon}>⬆</Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.flex}
        stickyHeaderIndices={[2]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <TrekHero
          imageUrl={trek.hero_image_url}
          title={trek.title}
          state={trek.trek_state}
        />

        {/* Meta strip */}
        <View style={{ backgroundColor: colors.background }}>
          {fromCache && <OfflineBadge visible={true} />}
          <TrekMetaStrip
            duration={trek.trek_duration}
            altitude={trek.trek_altitude}
            difficulty={trek.trek_difficulty}
            season={trek.trek_season}
          />
          {isDifficultTrek && (
            <TouchableOpacity
              style={[styles.safetyBanner, { borderColor: isDark ? "rgba(220,38,38,0.25)" : "rgba(220,38,38,0.15)", backgroundColor: isDark ? "rgba(220,38,38,0.08)" : "rgba(220,38,38,0.05)" }]}
              onPress={() => router.push("/safety-disclaimer" as never)}
            >
              <Text style={styles.safetyText}>
                ⚠️ Always trek with a certified guide. See safety guidelines →
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sticky tab bar */}
        <TrekTabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab body */}
        <View style={{ minHeight: 400, paddingBottom: 32 }}>
          {getTabContent() ? (
            <CMSContentRenderer bodyJson={getTabContent()} />
          ) : (
            <View style={styles.emptyTab}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                No {activeTab} guide available yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
                Our editors are working on it.
              </Text>
            </View>
          )}
          {activeTab === "guide" && (
            <TrekRelatedRow treks={relatedTreks} heading="You might also like" />
          )}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <TrekStickyBar slug={trek.slug} trekName={trek.title} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  backBtn: { marginTop: 16 },
  shareButton: {
    position: "absolute",
    top: 56,
    right: 16,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  shareIcon: { color: "#fff", fontSize: 16 },
  safetyBanner: {
    marginHorizontal: 16,
    marginBottom: 4,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  safetyText: { color: "#ef4444", fontSize: 12, fontWeight: "500" },
  emptyTab: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { fontSize: 16, fontWeight: "600", textAlign: "center" },
  emptySubtitle: { fontSize: 13, textAlign: "center" },
});
