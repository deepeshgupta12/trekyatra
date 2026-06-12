import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";

const EXAMPLE_PAIRS = [
  ["Hampta Pass", "Kedarkantha"],
  ["Valley of Flowers", "Roopkund"],
  ["Kheerganga", "Triund"],
  ["Chadar Trek", "Goecha La"],
];

export function ComparisonCTACard() {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.card,
          {
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(29,58,46,0.04)",
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(29,58,46,0.1)",
          },
        ]}
        onPress={() => router.push("/compare" as never)}
      >
        <View style={styles.iconWrap}>
          <Ionicons name="git-compare-outline" size={22} color="#E8702A" />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Can't decide between two treks?</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Compare difficulty, duration, cost, and season side by side.
        </Text>
        <View style={styles.pairRow}>
          {EXAMPLE_PAIRS.map(([a, b]) => (
            <View
              key={a}
              style={[
                styles.pairChip,
                { borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(29,58,46,0.12)" },
              ]}
            >
              <Text style={[styles.pairText, { color: colors.textSecondary }]}>
                {a} vs {b}
              </Text>
            </View>
          ))}
        </View>
        <Text style={styles.cta}>Compare treks →</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 24, paddingHorizontal: 16 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 8 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(232,112,42,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: { fontSize: 17, fontWeight: "700", fontFamily: "PlayfairDisplay_700Bold" },
  subtitle: { fontSize: 13, lineHeight: 18 },
  pairRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  pairChip: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 5 },
  pairText: { fontSize: 11, fontWeight: "500" },
  cta: { color: "#E8702A", fontSize: 13, fontWeight: "700", marginTop: 8 },
});
