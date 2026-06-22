import { View, Text, FlatList, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeArea } from "@/components/ui/SafeArea";
import { ProductCard } from "@/components/products/ProductCard";
import { useProducts, usePurchasedProducts } from "@/hooks/useProducts";
import { useTheme } from "@/hooks/useTheme";
import { Ionicons } from "@expo/vector-icons";

export default function ProductsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { data: products, isLoading, isError } = useProducts();
  const { data: purchasedIds } = usePurchasedProducts();

  function goDetail(slug: string) {
    router.push(`/(tabs)/browse/products/${slug}` as never);
  }

  return (
    <SafeArea edges={["bottom"]} style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Hero header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.borderSubtle }]}>
        <View style={styles.headerIcon}>
          <Ionicons name="bag-outline" size={22} color="#E8702A" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Trek Planning Resources</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted }]}>
            Guides, templates and checklists for your next trek
          </Text>
        </View>
      </View>

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color="#E8702A" />
        </View>
      )}

      {isError && (
        <View style={styles.center}>
          <Ionicons name="alert-circle-outline" size={36} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Failed to load products. Please try again.
          </Text>
        </View>
      )}

      {products && products.length === 0 && (
        <View style={styles.center}>
          <Ionicons name="bag-outline" size={40} color={colors.textMuted} />
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>No products available yet.</Text>
        </View>
      )}

      {products && products.length > 0 && (
        <FlatList
          data={products}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <ProductCard
              product={item}
              isPurchased={purchasedIds?.has(item.id) ?? false}
              onPress={() => goDetail(item.slug)}
            />
          )}
        />
      )}
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(232,112,42,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "700", fontFamily: "PlayfairDisplay_700Bold" },
  headerSub: { fontSize: 12, marginTop: 2 },
  list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 32, gap: 10 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
