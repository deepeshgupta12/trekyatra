import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { SafeArea } from "@/components/ui/SafeArea";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useTheme } from "@/hooks/useTheme";
import { useComparisons } from "@/hooks/useComparisons";
import { useAuth } from "@/hooks/useAuth";

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  } catch { return ""; }
}

export default function SavedComparisonsScreen() {
  useRequireAuth();
  const { colors } = useTheme();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const { comparisons, loading, error, remove, reload } = useComparisons(isAuthenticated);

  async function confirmDelete(id: string, name: string) {
    Alert.alert(
      "Remove comparison",
      `Remove "${name}" from your saved comparisons?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Remove", style: "destructive", onPress: () => remove(id) },
      ],
    );
  }

  const border = "rgba(255,255,255,0.08)";

  return (
    <SafeArea edges={["bottom"]}>
      {loading && (
        <View style={styles.center}>
          <ActivityIndicator color="#E8702A" />
        </View>
      )}

      {!loading && error && (
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={reload}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && comparisons.length === 0 && (
        <View style={styles.center}>
          <Text style={{ fontSize: 40, marginBottom: 12 }}>⚖️</Text>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No saved comparisons</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            Compare treks and save them to revisit later.
          </Text>
          <TouchableOpacity
            style={styles.compareBtn}
            onPress={() => router.push("/(home)/compare" as never)}
          >
            <Text style={styles.compareBtnText}>Compare treks</Text>
          </TouchableOpacity>
        </View>
      )}

      {!loading && !error && comparisons.length > 0 && (
        <FlatList
          data={comparisons}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={[styles.card, { borderColor: border }]}>
              <View style={styles.cardContent}>
                <Text style={[styles.cardName, { color: colors.textPrimary }]} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={[styles.cardMeta, { color: colors.textMuted }]}>
                  {item.slugs.length} treks · {formatDate(item.created_at)}
                </Text>
                <View style={styles.slugRow}>
                  {item.slugs.map((s) => (
                    <View key={s} style={styles.slugChip}>
                      <Text style={styles.slugChipText} numberOfLines={1}>{s.replace(/-/g, " ")}</Text>
                    </View>
                  ))}
                </View>
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.openBtn}
                  onPress={() => router.push({ pathname: "/(home)/compare", params: { slug: item.slugs[0] } } as never)}
                >
                  <Text style={styles.openBtnText}>Open</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => confirmDelete(item.id, item.name)}
                >
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  emptyText: { fontSize: 13, textAlign: "center", lineHeight: 20, marginBottom: 20 },
  retryBtn: { paddingHorizontal: 20, paddingVertical: 10, backgroundColor: "rgba(232,112,42,0.15)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(232,112,42,0.3)" },
  retryText: { color: "#E8702A", fontWeight: "700", fontSize: 14 },
  compareBtn: { backgroundColor: "#E8702A", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  compareBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 16, borderWidth: 1, backgroundColor: "rgba(255,255,255,0.04)", padding: 14, flexDirection: "row", gap: 12, alignItems: "flex-start" },
  cardContent: { flex: 1 },
  cardName: { fontSize: 14, fontWeight: "700", marginBottom: 4, lineHeight: 20 },
  cardMeta: { fontSize: 11, marginBottom: 8 },
  slugRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  slugChip: { backgroundColor: "rgba(232,112,42,0.12)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: "rgba(232,112,42,0.2)" },
  slugChipText: { fontSize: 10, color: "#E8702A", fontWeight: "600", textTransform: "capitalize", maxWidth: 120 },
  cardActions: { gap: 8, alignItems: "center" },
  openBtn: { backgroundColor: "#E8702A", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  openBtnText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  deleteBtn: { width: 32, height: 32, borderRadius: 10, backgroundColor: "rgba(239,68,68,0.12)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(239,68,68,0.2)" },
  deleteBtnText: { color: "#ef4444", fontSize: 13, fontWeight: "700" },
});
