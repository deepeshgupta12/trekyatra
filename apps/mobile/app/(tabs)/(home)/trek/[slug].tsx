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
import { useEffect, useRef, useState } from "react";
import { useTrekDetail } from "@/hooks/useTrekDetail";
import { TrekHero } from "@/components/trek/TrekHero";
import { TrekMetaStrip } from "@/components/trek/TrekMetaStrip";
import { TrekTabBar, type TrekTab } from "@/components/trek/TrekTabBar";
import { TrekStickyBar } from "@/components/trek/TrekStickyBar";
import { TrekRelatedRow } from "@/components/trek/TrekRelatedRow";
import { TrekNewsSection } from "@/components/trek/TrekNewsSection";
import { RelatedPagesSection } from "@/components/trek/RelatedPagesSection";
import { TrustSignals } from "@/components/trek/TrustSignals";
import { TrekContentsSheet, type ContentsHeading } from "@/components/trek/TrekContentsSheet";
import { TrekAskAI } from "@/components/trek/TrekAskAI";
import { CheckinSheet } from "@/components/account/CheckinSheet";
import { useCheckin } from "@/hooks/useCheckin";
import { OfflineBadge } from "@/components/trek/OfflineBadge";
import { CMSContentRenderer } from "@/components/cms/CMSContentRenderer";
import { HtmlContentRenderer } from "@/components/cms/HtmlContentRenderer";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { recordTrekView } from "@/lib/behaviorProfile";
import { contentApi } from "@/lib/mobileApi";
import type { TrekListItem } from "@/lib/mobileApi";
import type { Block } from "@/components/cms/types";

export default function TrekDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data, isLoading, error } = useTrekDetail(slug ?? "");
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TrekTab>("guide");
  const [relatedTreks, setRelatedTreks] = useState<TrekListItem[]>([]);
  const [contentsVisible, setContentsVisible] = useState(false);
  const [checkinVisible, setCheckinVisible] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const { isDone } = useCheckin();
  const scrollViewRef = useRef<ScrollView>(null);
  const headingOffsets = useRef<Record<string, number>>({});
  const tabBodyOffset = useRef(0);

  const trek = data?.page;
  const fromCache = data?.fromCache ?? false;

  // Check if user has already done this trek
  useEffect(() => {
    if (!user || !slug) return;
    isDone(slug).then(setAlreadyDone).catch(() => {});
  }, [slug, user]);

  // Record behavior
  useEffect(() => {
    if (!trek) return;
    recordTrekView(
      {
        slug: trek.slug,
        region: trek.trek_state ?? "",
        difficulty: trek.trek_difficulty ?? "",
        season: trek.trek_season ?? "",
      },
      !!user
    );
  }, [trek?.slug]);

  // Fetch related treks
  useEffect(() => {
    contentApi
      .getTrendingTreks()
      .then((treks) => setRelatedTreks(treks.filter((t) => t.slug !== slug).slice(0, 6)))
      .catch(() => {});
  }, [slug]);

  function getTabContent(): Block[] | null {
    if (activeTab === "guide") return (trek?.body_json as Block[] | null) ?? null;
    return null;
  }

  const TAB_SECTION_KEYS: Record<TrekTab, string | null> = {
    guide: null,
    packing: "packing",
    permits: "permits",
    costs: "cost_estimate",
  };

  function getTabHtml(): string | null {
    const sectionKey = TAB_SECTION_KEYS[activeTab];
    if (sectionKey) {
      return trek?.content_json?.sections?.[sectionKey] ?? null;
    }
    // Guide tab: full article HTML
    return trek?.content_html || null;
  }

  function getContentsHeadings(): ContentsHeading[] {
    const content = getTabContent();
    if (!content) return [];
    return content
      .filter((block): block is Block & { type: "heading"; id: string } => block.type === "heading" && !!block.id)
      .map((block) => ({ id: block.id, level: block.level, content: block.content }));
  }

  function handleHeadingLayout(id: string, y: number) {
    headingOffsets.current[id] = y;
  }

  function handleSelectHeading(id: string) {
    setContentsVisible(false);
    const headingY = headingOffsets.current[id];
    if (headingY !== undefined) {
      scrollViewRef.current?.scrollTo({ y: tabBodyOffset.current + headingY - 60, animated: true });
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
        ref={scrollViewRef}
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
          <TrustSignals publishedAt={trek.published_at} updatedAt={trek.updated_at} />
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
          {/* Check-in banner / CTA */}
          {user && (
            alreadyDone ? (
              <View style={[styles.checkinBanner, { backgroundColor: isDark ? "rgba(29,162,84,0.12)" : "rgba(29,162,84,0.08)", borderColor: isDark ? "rgba(29,162,84,0.25)" : "rgba(29,162,84,0.2)" }]}>
                <Text style={[styles.checkinBannerText, { color: isDark ? "#4ade80" : "#166534" }]}>
                  ✓ You've done this trek
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.checkinCta, { backgroundColor: isDark ? "rgba(232,112,42,0.12)" : "rgba(232,112,42,0.08)", borderColor: isDark ? "rgba(232,112,42,0.25)" : "rgba(232,112,42,0.2)" }]}
                onPress={() => setCheckinVisible(true)}
                accessibilityRole="button"
                accessibilityLabel="Log this trek"
              >
                <Text style={[styles.checkinCtaText, { color: colors.accent }]}>
                  🏔️ I did this trek — log it
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>

        {/* Sticky tab bar */}
        <TrekTabBar activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab body */}
        <View
          style={{ minHeight: 400, paddingBottom: 32 }}
          onLayout={(e) => { tabBodyOffset.current = e.nativeEvent.layout.y; }}
        >
          {activeTab === "guide" && getContentsHeadings().length >= 2 && (
            <TouchableOpacity
              style={[
                styles.contentsPill,
                {
                  backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(29,58,46,0.06)",
                  borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(29,58,46,0.12)",
                },
              ]}
              onPress={() => setContentsVisible(true)}
            >
              <Text style={[styles.contentsPillText, { color: colors.textSecondary }]}>☰ Contents</Text>
            </TouchableOpacity>
          )}
          {getTabContent() ? (
            <CMSContentRenderer
              bodyJson={getTabContent()}
              onHeadingLayout={activeTab === "guide" ? handleHeadingLayout : undefined}
            />
          ) : getTabHtml() ? (
            <HtmlContentRenderer html={getTabHtml() as string} />
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
            <>
              <TrekAskAI slug={trek.slug} trekName={trek.title} />
              <TrekRelatedRow treks={relatedTreks} heading="You might also like" />
              <TrekNewsSection slug={trek.slug} />
              <RelatedPagesSection slug={trek.slug} />
            </>
          )}
        </View>
      </ScrollView>

      {/* Sticky CTA */}
      <TrekStickyBar slug={trek.slug} trekName={trek.title} />

      {/* Table of contents bottom sheet */}
      <TrekContentsSheet
        visible={contentsVisible}
        headings={getContentsHeadings()}
        onSelect={handleSelectHeading}
        onClose={() => setContentsVisible(false)}
      />

      {/* Trek check-in sheet */}
      {user && (
        <CheckinSheet
          visible={checkinVisible}
          trekSlug={trek.slug}
          trekTitle={trek.title}
          trekState={trek.trek_state ?? undefined}
          onClose={() => setCheckinVisible(false)}
          onSuccess={() => {
            setCheckinVisible(false);
            setAlreadyDone(true);
          }}
        />
      )}
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
  checkinBanner: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  checkinBannerText: { fontSize: 13, fontWeight: "600" },
  checkinCta: {
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  checkinCtaText: { fontSize: 13, fontWeight: "600" },
  emptyTab: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 24,
    gap: 10,
  },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { fontSize: 16, fontWeight: "600", textAlign: "center" },
  emptySubtitle: { fontSize: 13, textAlign: "center" },
  contentsPill: {
    alignSelf: "flex-start",
    marginHorizontal: 16,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  contentsPillText: {
    fontSize: 13,
    fontWeight: "600",
  },
});
