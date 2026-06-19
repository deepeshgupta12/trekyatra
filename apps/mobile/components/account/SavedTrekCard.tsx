import { View, Text, Image, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import type { BookmarkResponse } from "@/lib/mobileApi";

interface SavedTrekCardProps {
  bookmark: BookmarkResponse;
  onDelete: (slug: string) => void;
}

export function SavedTrekCard({ bookmark, onDelete }: SavedTrekCardProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const slug = bookmark.trek_slug ?? bookmark.slug ?? "";

  return (
    <TouchableOpacity
      onPress={() => slug && router.push(`/(tabs)/browse/${slug}` as never)}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={bookmark.title ?? slug}
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: colors.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 12,
        marginHorizontal: 20,
        marginBottom: 10,
      }}
    >
      {/* Thumbnail */}
      <View
        style={{
          width: 60,
          height: 60,
          borderRadius: 10,
          overflow: "hidden",
          backgroundColor: colors.background,
        }}
      >
        {bookmark.hero_image_url ? (
          <Image
            source={{ uri: bookmark.hero_image_url }}
            style={{ width: 60, height: 60 }}
            resizeMode="cover"
          />
        ) : (
          <View
            style={{
              width: 60,
              height: 60,
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: colors.accent + "15",
            }}
          >
            <Ionicons name="trail-sign-outline" size={22} color={colors.accent} />
          </View>
        )}
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: "Inter_600SemiBold",
            fontSize: 14,
            color: colors.textPrimary,
            marginBottom: 3,
          }}
          numberOfLines={2}
        >
          {bookmark.title ?? slug}
        </Text>
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 12,
            color: colors.textSecondary,
          }}
        >
          {new Date(bookmark.created_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => slug && onDelete(slug)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={`Remove ${bookmark.title ?? slug}`}
        activeOpacity={0.7}
      >
        <Ionicons name="bookmark" size={20} color={colors.accent} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}
