import { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { SafeArea } from "@/components/ui/SafeArea";
import { contentApi, type Product } from "@/lib/mobileApi";

export default function ProductsScreen() {
  const { colors, isDark } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contentApi
      .getProducts()
      .then((data) => setProducts(data.filter((p) => p.active)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeArea edges={["bottom"]}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Trekking resources</Text>
        <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
          Downloadable checklists, planning kits, and guides made by our editorial team.
        </Text>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color="#E8702A" />
          </View>
        )}

        {!loading && products.length === 0 && (
          <Text style={[styles.helperText, { color: colors.textMuted }]}>
            No resources are available right now — check back soon.
          </Text>
        )}

        {products.map((p) => (
          <View
            key={p.slug}
            style={[
              styles.card,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(29,58,46,0.04)",
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(29,58,46,0.1)",
              },
            ]}
          >
            {p.preview_image_url && <Image source={{ uri: p.preview_image_url }} style={styles.cardImage} />}
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{p.title}</Text>
              {p.description && (
                <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={3}>
                  {p.description}
                </Text>
              )}
              <Text style={styles.price}>
                {p.price_inr > 0 ? `₹${p.price_inr.toLocaleString("en-IN")}` : "Free"}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  heroTitle: { fontSize: 26, fontWeight: "700", fontFamily: "PlayfairDisplay_700Bold" },
  heroSubtitle: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  center: { paddingVertical: 24, alignItems: "center" },
  helperText: { fontSize: 13, textAlign: "center", marginTop: 12 },
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  cardImage: { width: "100%", height: 140 },
  cardBody: { padding: 14, gap: 4 },
  cardTitle: { fontSize: 15, fontWeight: "600" },
  cardDesc: { fontSize: 13, lineHeight: 18 },
  price: { fontSize: 14, fontWeight: "700", color: "#E8702A", marginTop: 4 },
});
