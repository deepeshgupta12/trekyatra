import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { GlassSurface } from "@/components/ui/GlassSurface";

const CATEGORIES = [
  { label: "Packing", icon: "bag-handle-outline", route: "/packing" },
  { label: "Permits", icon: "document-text-outline", route: "/permits" },
  { label: "Costs", icon: "wallet-outline", route: "/costs" },
  { label: "Safety", icon: "shield-checkmark-outline", route: "/safety" },
  { label: "Plan a trek", icon: "compass-outline", route: "/(tabs)/plan" },
] as const;

export function CategoryHubRow() {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: colors.textPrimary }]}>Everything you need to trek</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.route}
            style={styles.cardTouchable}
            activeOpacity={0.8}
            onPress={() => router.push(cat.route as never)}
          >
            <GlassSurface rounded="md" style={styles.card}>
              <View style={styles.iconWrap}>
                <Ionicons name={cat.icon} size={22} color="#E8702A" />
              </View>
              <Text style={[styles.cardLabel, { color: colors.textPrimary }]}>{cat.label}</Text>
            </GlassSurface>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 24, gap: 10 },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
    paddingHorizontal: 16,
  },
  row: { paddingHorizontal: 16, gap: 10 },
  cardTouchable: { width: 96 },
  card: {
    paddingVertical: 14,
    alignItems: "center",
    gap: 8,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(232,112,42,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardLabel: { fontSize: 12, fontWeight: "600", textAlign: "center" },
});
