import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { SafeArea } from "@/components/ui/SafeArea";
import { SavedTrekCard } from "@/components/account/SavedTrekCard";
import { useSavedTreks } from "@/hooks/useAccount";
import { useTheme } from "@/hooks/useTheme";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

export default function SavedTreksScreen() {
  const { bookmarks, isLoading, refetch, remove } = useSavedTreks();
  const { colors } = useTheme();
  const router = useRouter();

  async function handleDelete(slug: string) {
    Alert.alert(
      "Remove saved trek",
      "Remove this trek from your saved list?",
      [
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
      ]
    );
  }

  return (
    <SafeArea>
      {/* Back header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 16,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: "PlayfairDisplay_700Bold",
            fontSize: 22,
            color: colors.textPrimary,
          }}
        >
          Saved Treks
        </Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : bookmarks.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
          }}
        >
          <Ionicons name="bookmark-outline" size={48} color={colors.textMuted} style={{ marginBottom: 16 }} />
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 16,
              color: colors.textPrimary,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            No saved treks yet
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: colors.textSecondary,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            Save treks to find them quickly. Tap the bookmark icon on any trek.
          </Text>
        </View>
      ) : (
        <FlatList
          data={bookmarks}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SavedTrekCard bookmark={item} onDelete={handleDelete} />
          )}
          refreshing={isLoading}
          onRefresh={refetch}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeArea>
  );
}
