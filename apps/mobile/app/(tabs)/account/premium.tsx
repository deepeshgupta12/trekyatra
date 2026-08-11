import { View, Text, TouchableOpacity, ScrollView, StyleSheet, Linking, ActivityIndicator, Platform } from "react-native";
import { SafeArea } from "@/components/ui/SafeArea";
import { useTheme } from "@/hooks/useTheme";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { usePremium } from "@/hooks/usePremium";
import { PremiumFeatureList } from "@/components/premium/PremiumFeatureList";
import { SubscribeButton } from "@/components/premium/SubscribeButton";
import { IAP_PRODUCT_IDS, type IAPProductId } from "@/services/iapService";

const WEB_PREMIUM_URL = "https://trekyatra.co.in/premium";

export default function PremiumScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const {
    isPremium,
    isLoadingStatus,
    status,
    errorMessage,
    products,
    subscribe,
    restore,
    reset,
  } = usePremium();

  const [selectedInterval, setSelectedInterval] = useState<"monthly" | "annual">("annual");

  // iOS v1 has no paid tier / IAP — the Premium screen must never be shown on iOS (Guideline 2.1.0).
  // The menu entry is already hidden; this bounces any deep-link / direct navigation back to Account.
  useEffect(() => {
    if (Platform.OS === "ios") router.replace("/(tabs)/account");
  }, [router]);
  if (Platform.OS === "ios") return null;

  const monthlyProduct = products.find((p) => p.interval === "monthly");
  const annualProduct = products.find((p) => p.interval === "annual");
  const selectedProduct = selectedInterval === "annual" ? annualProduct : monthlyProduct;
  const selectedProductId: IAPProductId =
    selectedInterval === "annual" ? IAP_PRODUCT_IDS.annual : IAP_PRODUCT_IDS.monthly;

  return (
    <SafeArea>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Premium</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 60 }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoadingStatus ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
        ) : isPremium ? (
          <ActivePremiumCard colors={colors} />
        ) : (
          <>
            {/* Hero */}
            <View style={[styles.hero, { borderColor: colors.accent + "33", backgroundColor: colors.accent + "0D" }]}>
              <View style={[styles.heroBadge, { backgroundColor: colors.accent + "22" }]}>
                <Ionicons name="star" size={30} color={colors.accent} />
              </View>
              <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>TrekYatra Premium</Text>
              <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
                Everything you need to plan, prepare, and trek with confidence.
              </Text>
            </View>

            {/* Plan selector */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Choose your plan</Text>
            <View style={styles.planRow}>
              <PlanCard
                interval="annual"
                localizedPrice={annualProduct?.localizedPrice}
                selected={selectedInterval === "annual"}
                badge="Save 30%"
                onSelect={() => setSelectedInterval("annual")}
                colors={colors}
              />
              <PlanCard
                interval="monthly"
                localizedPrice={monthlyProduct?.localizedPrice}
                selected={selectedInterval === "monthly"}
                onSelect={() => setSelectedInterval("monthly")}
                colors={colors}
              />
            </View>

            {/* Subscribe button */}
            <View style={styles.ctaArea}>
              <SubscribeButton
                productId={selectedProductId}
                localizedPrice={selectedProduct?.localizedPrice}
                interval={selectedInterval}
                status={status}
                onPress={subscribe}
                selected
              />
              {errorMessage && (
                <View style={styles.errorRow}>
                  <Ionicons name="alert-circle" size={15} color="#e05c5c" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                  <TouchableOpacity onPress={reset}>
                    <Text style={[styles.retryText, { color: colors.accent }]}>Retry</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Feature comparison */}
            <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>What you get</Text>
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <PremiumFeatureList />
            </View>

            {/* Footer actions */}
            <TouchableOpacity
              onPress={restore}
              disabled={status === "restoring"}
              style={styles.restoreRow}
            >
              <Text style={[styles.restoreText, { color: colors.textSecondary }]}>
                {status === "restoring" ? "Restoring…" : "Restore purchases"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => Linking.openURL(WEB_PREMIUM_URL)}
              style={styles.webRow}
            >
              <Ionicons name="open-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.webText, { color: colors.textMuted }]}>Subscribe via website</Text>
            </TouchableOpacity>

            <Text style={[styles.legalText, { color: colors.textMuted }]}>
              Subscriptions auto-renew unless cancelled at least 24 hours before the end of the current period.
              Manage in App Store / Google Play settings.
            </Text>
          </>
        )}
      </ScrollView>
    </SafeArea>
  );
}

function ActivePremiumCard({ colors }: { colors: ReturnType<typeof import("@/hooks/useTheme").useTheme>["colors"] }) {
  return (
    <View style={[styles.activePremiumCard, { borderColor: colors.accent + "40", backgroundColor: colors.accent + "10" }]}>
      <Ionicons name="star" size={36} color={colors.accent} style={{ marginBottom: 12 }} />
      <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>You're Premium!</Text>
      <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
        You have full access to all TrekYatra Premium features. Thank you for your support.
      </Text>
      <View style={[styles.activeFeatureRow, { borderTopColor: colors.border }]}>
        {["Offline guides", "Priority AI", "Permit alerts", "Ad-free"].map((f) => (
          <View key={f} style={styles.activeFeatureItem}>
            <Ionicons name="checkmark-circle" size={16} color={colors.accent} />
            <Text style={[styles.activeFeatureText, { color: colors.textSecondary }]}>{f}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

interface PlanCardProps {
  interval: "monthly" | "annual";
  localizedPrice?: string;
  selected: boolean;
  badge?: string;
  onSelect: () => void;
  colors: ReturnType<typeof import("@/hooks/useTheme").useTheme>["colors"];
}

function PlanCard({ interval, localizedPrice, selected, badge, onSelect, colors }: PlanCardProps) {
  const fallbackPrice = interval === "annual" ? "₹1,999" : "₹299";
  return (
    <TouchableOpacity
      onPress={onSelect}
      activeOpacity={0.85}
      style={[
        styles.planCard,
        { backgroundColor: colors.surface, borderColor: selected ? colors.accent : colors.border },
      ]}
    >
      {badge && (
        <View style={[styles.planBadge, { backgroundColor: colors.accent }]}>
          <Text style={styles.planBadgeText}>{badge}</Text>
        </View>
      )}
      <Text style={[styles.planInterval, { color: colors.textSecondary }]}>
        {interval === "annual" ? "Annual" : "Monthly"}
      </Text>
      <Text style={[styles.planPrice, { color: colors.textPrimary }]}>
        {localizedPrice ?? fallbackPrice}
      </Text>
      <Text style={[styles.planPerUnit, { color: colors.textMuted }]}>
        per {interval === "annual" ? "year" : "month"}
      </Text>
      {selected && (
        <View style={[styles.selectedDot, { backgroundColor: colors.accent }]} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 22,
  },
  scroll: {
    paddingHorizontal: 20,
  },
  hero: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    marginBottom: 28,
  },
  heroBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  heroTitle: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 22,
    textAlign: "center",
    marginBottom: 8,
  },
  heroSubtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 21,
  },
  sectionLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginBottom: 12,
  },
  planRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  planCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
  },
  planBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderBottomLeftRadius: 10,
    borderTopRightRadius: 14,
  },
  planBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  planInterval: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    textTransform: "uppercase",
    letterSpacing: 0.4,
    marginBottom: 6,
    marginTop: 8,
  },
  planPrice: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 22,
  },
  planPerUnit: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    marginTop: 2,
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  ctaArea: {
    marginBottom: 28,
    gap: 10,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  errorText: {
    flex: 1,
    color: "#e05c5c",
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  retryText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 24,
  },
  restoreRow: {
    alignItems: "center",
    paddingVertical: 12,
  },
  restoreText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  webRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    marginBottom: 16,
  },
  webText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
  legalText: {
    fontFamily: "Inter_400Regular",
    fontSize: 11,
    textAlign: "center",
    lineHeight: 16,
    paddingHorizontal: 8,
  },
  activePremiumCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    marginTop: 16,
  },
  activeFeatureRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    width: "100%",
  },
  activeFeatureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  activeFeatureText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
  },
});
