import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeArea } from "@/components/ui/SafeArea";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useTheme } from "@/hooks/useTheme";

export default function SavedScreen() {
  useRequireAuth();
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <SafeArea>
      <View style={styles.container}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Saved</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your bookmarked treks and saved comparisons.
        </Text>

        <TouchableOpacity
          style={styles.card}
          onPress={() => router.push("/saved/comparisons" as never)}
        >
          <Text style={styles.cardIcon}>⚖️</Text>
          <View style={styles.cardBody}>
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Saved Comparisons</Text>
            <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
              Trek comparisons you've saved to revisit
            </Text>
          </View>
          <Text style={[styles.cardChevron, { color: colors.textMuted }]}>›</Text>
        </TouchableOpacity>
      </View>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 28, fontWeight: "700", fontFamily: "PlayfairDisplay_700Bold", marginBottom: 6 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  card: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 16, padding: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)" },
  cardIcon: { fontSize: 28 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  cardDesc: { fontSize: 12, lineHeight: 17 },
  cardChevron: { fontSize: 22, fontWeight: "300" },
});
