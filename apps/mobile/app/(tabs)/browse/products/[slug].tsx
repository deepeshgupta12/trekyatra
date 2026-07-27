import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Alert, Platform } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { SafeArea } from "@/components/ui/SafeArea";
import { useProduct, usePurchasedProducts } from "@/hooks/useProducts";
import { usePurchase } from "@/hooks/usePurchase";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/hooks/useTheme";

const SAFFRON = "#E8702A";

const STATUS_LABELS: Record<string, string> = {
  creating_order: "Preparing order…",
  payment: "Opening payment…",
  verifying: "Verifying payment…",
  downloading: "Downloading…",
  done: "Done!",
  error: "Failed",
};

export default function ProductDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { isAuthenticated, user } = useAuth();

  const { data: product, isLoading, isError } = useProduct(slug);
  const { data: purchasedMap } = usePurchasedProducts();
  const { status, error, purchase, downloadExisting, reset } = usePurchase();

  const isPurchased = product ? (purchasedMap?.has(product.id) ?? false) : false;
  const downloadUrl = product ? (purchasedMap?.get(product.id) ?? null) : null;
  const isProcessing = status !== "idle" && status !== "done" && status !== "error";

  function handleBuy() {
    if (!product) return;

    if (!isAuthenticated) {
      Alert.alert(
        "Sign in required",
        "Please sign in to purchase this product.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Sign In", onPress: () => router.push("/(auth)/sign-in" as never) },
        ],
      );
      return;
    }

    if (isPurchased && downloadUrl) {
      downloadExisting(downloadUrl, product.title);
      return;
    }

    purchase(product, user?.email ?? "", user?.fullName ?? "");
  }

  if (isLoading) {
    return (
      <SafeArea style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={SAFFRON} />
      </SafeArea>
    );
  }

  if (isError || !product) {
    return (
      <SafeArea style={[styles.center, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle-outline" size={36} color={colors.textMuted} />
        <Text style={[styles.errorText, { color: colors.textMuted }]}>Product not found.</Text>
      </SafeArea>
    );
  }

  return (
    <SafeArea edges={["bottom"]} style={{ backgroundColor: colors.background, flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} hitSlop={10}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>

        {/* Preview image */}
        {product.preview_image_url ? (
          <Image
            source={{ uri: product.preview_image_url }}
            style={styles.heroImage}
            contentFit="cover"
          />
        ) : (
          <View style={[styles.heroPlaceholder, { backgroundColor: isDark ? "rgba(232,112,42,0.10)" : "rgba(232,112,42,0.08)" }]}>
            <Ionicons name="document-text-outline" size={56} color={SAFFRON} />
          </View>
        )}

        {/* Content */}
        <View style={styles.content}>
          {/* Type badge */}
          <View style={[styles.typeBadge, { backgroundColor: isDark ? "rgba(232,112,42,0.12)" : "rgba(232,112,42,0.09)" }]}>
            <Text style={styles.typeText}>
              {(product.file_path?.split(".").pop()?.toUpperCase() ?? "PDF")} Resource
            </Text>
          </View>

          <Text style={[styles.title, { color: colors.textPrimary }]}>{product.title}</Text>

          {product.description ? (
            <Text style={[styles.description, { color: colors.textSecondary }]}>{product.description}</Text>
          ) : null}

          {/* Sales */}
          {product.sales_count > 0 && (
            <View style={styles.salesRow}>
              <Ionicons name="people-outline" size={14} color={colors.textMuted} />
              <Text style={[styles.salesText, { color: colors.textMuted }]}>
                {product.sales_count} trekkers have this
              </Text>
            </View>
          )}

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.borderSubtle }]} />

          {/* Price + CTA */}
          <View style={styles.priceRow}>
            {!isPurchased && (
              <Text style={[styles.price, { color: colors.textPrimary }]}>
                ₹{Math.round(product.price_inr)}
              </Text>
            )}
            {isPurchased ? (
              <View style={styles.purchasedRow}>
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
                <Text style={styles.purchasedLabel}>Already purchased</Text>
              </View>
            ) : null}
          </View>

          {/* Processing status */}
          {isProcessing && (
            <View style={styles.processingRow}>
              <ActivityIndicator color={SAFFRON} size="small" />
              <Text style={[styles.processingText, { color: colors.textMuted }]}>
                {STATUS_LABELS[status] ?? "Processing…"}
              </Text>
            </View>
          )}

          {status === "error" && error ? (
            <View style={[styles.errorBanner, { backgroundColor: "rgba(239,68,68,0.08)" }]}>
              <Text style={styles.errorBannerText}>{error}</Text>
              <TouchableOpacity onPress={reset}>
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {status === "done" ? (
            <View style={[styles.successBanner, { backgroundColor: "rgba(34,197,94,0.08)" }]}>
              <Ionicons name="checkmark-circle" size={18} color="#22c55e" />
              <Text style={styles.successText}>Download complete! Check your Files app.</Text>
            </View>
          ) : null}

          {/* Primary CTA — hidden on iOS v1: digital products aren't purchasable without
              StoreKit IAP (Guideline 3.1.1). No anti-steering copy either. */}
          {Platform.OS !== "ios" && !isProcessing && status !== "done" && (
            <TouchableOpacity
              style={[styles.buyBtn, isPurchased && styles.downloadBtn]}
              onPress={handleBuy}
              activeOpacity={0.85}
              disabled={isProcessing}
            >
              <Ionicons
                name={isPurchased ? "download-outline" : "bag-outline"}
                size={18}
                color="#fff"
              />
              <Text style={styles.buyText}>
                {isPurchased ? "Download Again" : `Buy & Download — ₹${Math.round(product.price_inr)}`}
              </Text>
            </TouchableOpacity>
          )}

          {/* Trust note */}
          <View style={styles.trustRow}>
            <Ionicons name="shield-checkmark-outline" size={14} color={colors.textMuted} />
            <Text style={[styles.trustText, { color: colors.textMuted }]}>
              Secure payment via Razorpay. Instant delivery after payment.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  scroll: { paddingBottom: 48 },
  backBtn: {
    position: "absolute",
    top: 16,
    left: 16,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroImage: { width: "100%", height: 220 },
  heroPlaceholder: {
    width: "100%",
    height: 200,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { paddingHorizontal: 20, paddingTop: 20, gap: 14 },
  typeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: { color: SAFFRON, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  title: { fontSize: 22, fontWeight: "700", fontFamily: "PlayfairDisplay_700Bold", lineHeight: 30 },
  description: { fontSize: 14, lineHeight: 21 },
  salesRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  salesText: { fontSize: 12 },
  divider: { height: 1 },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  price: { fontSize: 28, fontWeight: "800" },
  purchasedRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  purchasedLabel: { color: "#22c55e", fontWeight: "700", fontSize: 14 },
  processingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  processingText: { fontSize: 14 },
  buyBtn: {
    backgroundColor: SAFFRON,
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  downloadBtn: { backgroundColor: "#22c55e" },
  buyText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  trustRow: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  trustText: { fontSize: 12, lineHeight: 17, flex: 1 },
  errorBanner: { borderRadius: 12, padding: 14, gap: 6 },
  errorBannerText: { color: "#ef4444", fontSize: 13 },
  retryText: { color: SAFFRON, fontSize: 13, fontWeight: "700" },
  successBanner: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 12, padding: 14 },
  successText: { color: "#22c55e", fontSize: 13, fontWeight: "600", flex: 1 },
  errorText: { fontSize: 14 },
});
