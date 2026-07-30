import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeArea } from "@/components/ui/SafeArea";
import { SavedTrekCard } from "@/components/account/SavedTrekCard";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useTheme } from "@/hooks/useTheme";
import { useSavedTreks } from "@/hooks/useAccount";

export default function SavedScreen() {
  useRequireAuth();
  const { colors } = useTheme();
  const router = useRouter();
  // D23: this hub previously showed ONLY a "Saved Comparisons" link and never listed the user's
  // bookmarked treks — so saved treks appeared "not reflected". Now it lists real bookmarks.
  const { bookmarks, isLoading, refetch, remove } = useSavedTreks();

  async function handleDelete(slug: string) {
    Alert.alert("Remove saved trek", "Remove this trek from your saved list?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await remove(slug);
          } catch {
            Alert.alert("Error", "Could not remove saved trek. Try again.");
          }
        },
      },
    ]);
  }

  const header = (
    <View style={styles.headerWrap}>
      <Text style={[styles.title, { color: colors.textPrimary }]}>Saved</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Your bookmarked treks and saved comparisons.
      </Text>

      <TouchableOpacity
        style={[styles.card, { borderColor: colors.border }]}
        activeOpacity={0.8}
        onPress={() => router.push("/saved/comparisons" as never)}
      >
        <Text style={styles.cardIcon}>⚖️</Text>
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Saved Comparisons</Text>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>
            Trek comparisons you&apos;ve saved to revisit
          </Text>
        </View>
        <Text style={[styles.cardChevron, { color: colors.textMuted }]}>›</Text>
      </TouchableOpacity>

      <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Saved Treks</Text>
    </View>
  );

  return (
    <SafeArea>
      {isLoading ? (
        <>
          {header}
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        </>
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <SavedTrekCard bookmark={item} onDelete={handleDelete} />}
          ListHeaderComponent={header}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="bookmark-outline" size={40} color={colors.textMuted} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No saved treks yet</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Tap the bookmark icon on any trek to save it here.
              </Text>
            </View>
          }
          refreshing={isLoading}
          onRefresh={refetch}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  headerWrap: { paddingHorizontal: 20, paddingTop: 12 },
  title: { fontSize: 28, fontWeight: "700", fontFamily: "PlayfairDisplay_700Bold", marginBottom: 6 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 20 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  cardIcon: { fontSize: 28 },
  cardBody: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  cardDesc: { fontSize: 12, lineHeight: 17 },
  cardChevron: { fontSize: 22, fontWeight: "300" },
  sectionLabel: { fontSize: 16, fontWeight: "700", fontFamily: "PlayfairDisplay_700Bold", marginTop: 24, marginBottom: 4 },
  center: { paddingVertical: 48, alignItems: "center" },
  emptyWrap: { alignItems: "center", paddingHorizontal: 32, paddingTop: 24 },
  emptyTitle: { fontFamily: "Inter_600SemiBold", fontSize: 16, textAlign: "center", marginBottom: 8 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", lineHeight: 20 },
});
