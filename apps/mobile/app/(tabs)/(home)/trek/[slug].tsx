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
import { ConditionSummaryBanner } from "@/components/reports/ConditionSummaryBanner";
import { TripReportCard } from "@/components/reports/TripReportCard";
import { AddReportSheet } from "@/components/reports/AddReportSheet";
import { useReports } from "@/hooks/useReports";
import { useTrekBuddies } from "@/hooks/useBuddies";
import type { BuddyRequestOut } from "@/hooks/useBuddies";
import { BuddySignalSheet } from "@/components/buddy/BuddySignalSheet";
import { BuddyListCard } from "@/components/buddy/BuddyListCard";
import { TrekkerProfileModal } from "@/components/buddy/TrekkerProfileModal";
import { BuddyChatScreen } from "@/components/buddy/BuddyChatScreen";
import { ConditionsWidget } from "@/components/trek/ConditionsWidget";
import { LiveConditionsScreen } from "@/components/conditions/LiveConditionsScreen";
import { GatedContentOverlay } from "@/components/premium/GatedContentOverlay";
import { usePremium } from "@/hooks/usePremium";

export default function TrekDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data, isLoading, error } = useTrekDetail(slug ?? "");
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const { isPremium } = usePremium();
  const [activeTab, setActiveTab] = useState<TrekTab>("guide");
  const [relatedTreks, setRelatedTreks] = useState<TrekListItem[]>([]);
  const [contentsVisible, setContentsVisible] = useState(false);
  const [checkinVisible, setCheckinVisible] = useState(false);
  const [alreadyDone, setAlreadyDone] = useState(false);
  const [addReportVisible, setAddReportVisible] = useState(false);
  const [buddySignalVisible, setBuddySignalVisible] = useState(false);
  const [buddyListVisible, setBuddyListVisible] = useState(false);
  const [profileSignalId, setProfileSignalId] = useState<string | null>(null);
  const [chatReq, setChatReq] = useState<BuddyRequestOut | null>(null);
  const [conditionsDetailVisible, setConditionsDetailVisible] = useState(false);
  const reports = useReports(slug ?? "");
  const buddies = useTrekBuddies(slug ?? "");
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
    reports: null,
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
  const isPremiumGated = trek.is_premium === true && !isPremium;

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView
        ref={scrollViewRef}
        style={styles.flex}
        stickyHeaderIndices={[2]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero — back button + share embedded inside */}
        <TrekHero
          imageUrl={trek.hero_image_url ?? trek.route_image_url ?? null}
          title={trek.title}
          state={trek.trek_state}
          onShare={handleShare}
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
          {/* Check-in banner / CTA — always visible; auth gate inside onPress */}
          {alreadyDone ? (
            <View style={[styles.checkinBanner, { backgroundColor: isDark ? "rgba(29,162,84,0.12)" : "rgba(29,162,84,0.08)", borderColor: isDark ? "rgba(29,162,84,0.25)" : "rgba(29,162,84,0.2)" }]}>
              <Text style={[styles.checkinBannerText, { color: isDark ? "#4ade80" : "#166534" }]}>
                ✓ You've done this trek
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.checkinCta, { backgroundColor: isDark ? "rgba(232,112,42,0.12)" : "rgba(232,112,42,0.08)", borderColor: isDark ? "rgba(232,112,42,0.25)" : "rgba(232,112,42,0.2)" }]}
              onPress={() => {
                if (!user) {
                  router.push("/(auth)/sign-in" as never);
                } else {
                  setCheckinVisible(true);
                }
              }}
              accessibilityRole="button"
              accessibilityLabel="Log this trek"
            >
              <Text style={[styles.checkinCtaText, { color: colors.accent }]}>
                🏔️ I did this trek — log it
              </Text>
            </TouchableOpacity>
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
          {activeTab === "reports" ? (
            /* reports tab — always accessible, not gated */
            <View style={styles.reportsTab}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Trail Conditions</Text>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                Crowdsourced reports from hikers
              </Text>
              {reports.loading ? (
                <ActivityIndicator color="#E8702A" style={{ marginTop: 20 }} />
              ) : reports.data ? (
                <>
                  <ConditionSummaryBanner summary={reports.data.condition_summary} />
                  {reports.data.items.map((r) => (
                    <TripReportCard key={r.id} report={r} />
                  ))}
                  {reports.data.has_more && (
                    <TouchableOpacity
                      onPress={reports.loadMore}
                      disabled={reports.loadingMore}
                      style={styles.loadMoreBtn}
                    >
                      {reports.loadingMore ? (
                        <ActivityIndicator color="#E8702A" size="small" />
                      ) : (
                        <Text style={{ color: "#E8702A", fontSize: 13, fontWeight: "600" }}>
                          Load more
                        </Text>
                      )}
                    </TouchableOpacity>
                  )}
                </>
              ) : null}

              {/* Add report CTA */}
              <View style={[styles.addReportRow, { borderTopColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }]}>
                {user ? (
                  <TouchableOpacity
                    style={styles.addReportBtn}
                    onPress={() => setAddReportVisible(true)}
                    accessibilityRole="button"
                    accessibilityLabel="Add trail report"
                  >
                    <Text style={styles.addReportText}>+ Add a report</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => router.push("/(auth)/sign-in" as never)}
                    accessibilityRole="button"
                  >
                    <Text style={[styles.signInPrompt, { color: colors.textMuted }]}>
                      <Text style={{ color: "#E8702A" }}>Sign in</Text> to add a trail report
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : isPremiumGated ? (
            <View style={{ margin: 16, marginTop: 24 }}>
              <GatedContentOverlay
                featureName="the full trek guide"
                onUpgrade={() => router.push("/(tabs)/account/premium" as never)}
              />
            </View>
          ) : getTabContent() ? (
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

              {/* Live Conditions Widget */}
              <ConditionsWidget
                slug={trek.slug}
                onViewDetails={() => setConditionsDetailVisible(true)}
              />

              {/* Trek Buddy Matching */}
              <View style={[styles.buddySection, { borderTopColor: colors.border }]}>
                <Text style={[styles.buddySectionTitle, { color: colors.textPrimary }]}>
                  Find a Trek Buddy
                </Text>
                <Text style={[styles.buddySectionSub, { color: colors.textMuted }]}>
                  {(buddies.count?.count ?? 0) > 0
                    ? `${buddies.count!.count} trekker${buddies.count!.count !== 1 ? "s" : ""} planning this route`
                    : "Be the first to signal you're planning this trek"}
                </Text>
                {user ? (
                  <TouchableOpacity
                    onPress={() => setBuddySignalVisible(true)}
                    style={[styles.buddyBtn, { borderColor: colors.accent }]}
                    accessibilityLabel="Post my trek signal"
                  >
                    <Text style={[styles.buddyBtnText, { color: colors.accent }]}>
                      I'm planning this trek
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    onPress={() => router.push("/(auth)/sign-in" as never)}
                    style={[styles.buddyBtn, { borderColor: colors.accent }]}
                    accessibilityLabel="Sign in to find a trek buddy"
                  >
                    <Text style={[styles.buddyBtnText, { color: colors.accent }]}>
                      Sign in to find a trek buddy →
                    </Text>
                  </TouchableOpacity>
                )}
                {(buddies.count?.count ?? 0) > 0 && (
                  <TouchableOpacity
                    onPress={() => { setBuddyListVisible(true); buddies.loadSignals(); }}
                    accessibilityLabel="Browse trekkers"
                  >
                    <Text style={[styles.buddyLink, { color: colors.accent }]}>
                      Browse {buddies.count!.count} trekker{buddies.count!.count !== 1 ? "s" : ""} →
                    </Text>
                  </TouchableOpacity>
                )}
                {buddyListVisible && buddies.signals && (
                  <View style={{ marginTop: 12, gap: 8 }}>
                    {buddies.signals.map((s) => (
                      <BuddyListCard
                        key={s.id}
                        signal={s}
                        onViewProfile={(id) => setProfileSignalId(id)}
                        onRequestSent={() => {}}
                      />
                    ))}
                  </View>
                )}
              </View>

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

      {/* Trek check-in sheet — only opens when user is signed in */}
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

      {/* Add report sheet */}
      <AddReportSheet
        visible={addReportVisible}
        trekSlug={trek.slug}
        onClose={() => setAddReportVisible(false)}
        onSubmit={async (input) => {
          await reports.submitReport(input);
          setAddReportVisible(false);
          reports.reload();
        }}
        onUploadPhoto={reports.uploadPhoto}
      />

      {/* Buddy signal sheet */}
      <BuddySignalSheet
        visible={buddySignalVisible}
        trekSlug={trek.slug}
        onClose={() => setBuddySignalVisible(false)}
        onSubmit={async (data) => {
          const signal = await buddies.createSignal(data);
          setBuddySignalVisible(false);
          return signal;
        }}
      />

      {/* Trekker public profile modal */}
      <TrekkerProfileModal
        signalId={profileSignalId}
        visible={!!profileSignalId}
        onClose={() => setProfileSignalId(null)}
        onConnect={(signalId) => {
          setProfileSignalId(null);
          // signal card inline connect flow handles the actual request
        }}
      />

      {/* In-app chat for accepted buddy pair */}
      <BuddyChatScreen
        visible={!!chatReq}
        requestId={chatReq?.id ?? null}
        otherPartyName={chatReq?.other_party_name ?? ""}
        onClose={() => setChatReq(null)}
      />

      {/* Live Conditions full detail */}
      {conditionsDetailVisible && (
        <View style={[StyleSheet.absoluteFill, { zIndex: 100 }]}>
          <LiveConditionsScreen
            slug={trek.slug}
            trekName={trek.title}
            onClose={() => setConditionsDetailVisible(false)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  backBtn: { marginTop: 16 },
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
  reportsTab: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  addReportRow: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  addReportBtn: {
    backgroundColor: "#E8702A",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  addReportText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  signInPrompt: { fontSize: 13 },
  loadMoreBtn: {
    alignItems: "center",
    paddingVertical: 12,
  },
  buddySection: {
    marginHorizontal: 16,
    marginTop: 24,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  buddySectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
  },
  buddySectionSub: {
    fontSize: 13,
  },
  buddyBtn: {
    marginTop: 4,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  buddyBtnText: {
    fontSize: 13,
    fontWeight: "600",
  },
  buddyLink: {
    fontSize: 13,
    fontWeight: "500",
  },
});
