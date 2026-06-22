import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { GlassSurface } from "@/components/ui/GlassSurface";
import type { Product } from "@/lib/mobileApi";

const SAFFRON = "#E8702A";
const TYPE_ICONS: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  pdf: "document-text-outline",
  notion: "grid-outline",
  excel: "grid-outline",
  template: "copy-outline",
};

interface Props {
  product: Product;
  isPurchased?: boolean;
  onPress: () => void;
}

export function ProductCard({ product, isPurchased = false, onPress }: Props) {
  const { colors, isDark } = useTheme();

  const ext = product.file_path?.split(".").pop()?.toLowerCase() ?? "pdf";
  const iconName = TYPE_ICONS[ext] ?? "document-text-outline";

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} testID={`product-card-${product.slug}`}>
      <GlassSurface rounded="lg" style={styles.card}>
        {/* Icon */}
        <View style={[styles.iconWrap, { backgroundColor: isDark ? "rgba(232,112,42,0.12)" : "rgba(232,112,42,0.10)" }]}>
          <Ionicons name={iconName} size={22} color={SAFFRON} />
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
            {product.title}
          </Text>
          {product.description ? (
            <Text style={[styles.desc, { color: colors.textMuted }]} numberOfLines={2}>
              {product.description}
            </Text>
          ) : null}
        </View>

        {/* Price / status */}
        <View style={styles.right}>
          {isPurchased ? (
            <View style={styles.purchasedBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#22c55e" />
              <Text style={styles.purchasedText}>Owned</Text>
            </View>
          ) : (
            <Text style={[styles.price, { color: SAFFRON }]}>₹{Math.round(product.price_inr)}</Text>
          )}
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </View>
      </GlassSurface>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  info: { flex: 1, gap: 3 },
  title: { fontSize: 14, fontWeight: "700", lineHeight: 19 },
  desc: { fontSize: 12, lineHeight: 17 },
  right: { alignItems: "flex-end", gap: 4, flexShrink: 0 },
  price: { fontSize: 15, fontWeight: "800" },
  purchasedBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  purchasedText: { color: "#22c55e", fontSize: 12, fontWeight: "700" },
});
