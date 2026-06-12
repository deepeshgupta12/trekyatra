import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from "react-native";
import { router } from "expo-router";
import { contentApi, type Product } from "@/lib/mobileApi";
import { useTheme } from "@/hooks/useTheme";

export function ResourcesRow() {
  const { colors, isDark } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    contentApi
      .getProducts()
      .then((data) => setProducts(data.filter((p) => p.active).slice(0, 6)))
      .catch(() => {});
  }, []);

  if (products.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.heading, { color: colors.textPrimary }]}>Resources for your trip</Text>
        <TouchableOpacity onPress={() => router.push("/products" as never)}>
          <Text style={styles.viewAll}>View all →</Text>
        </TouchableOpacity>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {products.map((p) => (
          <TouchableOpacity
            key={p.slug}
            style={[
              styles.card,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(29,58,46,0.04)",
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(29,58,46,0.1)",
              },
            ]}
            activeOpacity={0.85}
            onPress={() => router.push("/products" as never)}
          >
            {p.preview_image_url && <Image source={{ uri: p.preview_image_url }} style={styles.cardImage} />}
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>
                {p.title}
              </Text>
              <Text style={styles.price}>{p.price_inr > 0 ? `₹${p.price_inr.toLocaleString("en-IN")}` : "Free"}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 24, gap: 12 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  heading: { fontSize: 18, fontWeight: "700", fontFamily: "PlayfairDisplay_700Bold" },
  viewAll: { fontSize: 12, fontWeight: "600", color: "#E8702A" },
  row: { paddingHorizontal: 16, gap: 12 },
  card: { width: 150, borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  cardImage: { width: "100%", height: 90 },
  cardBody: { padding: 10, gap: 4 },
  cardTitle: { fontSize: 13, fontWeight: "600" },
  price: { fontSize: 12, fontWeight: "700", color: "#E8702A" },
});
