import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import type { TrekListItem } from "@/lib/mobileApi";
import { useTheme } from "@/hooks/useTheme";

interface TrekCardProps {
  trek: TrekListItem;
  width?: number;
  showMeta?: boolean;
}

const FALLBACK_BLUR = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

export function TrekCard({ trek, width = 180, showMeta = true }: TrekCardProps) {
  const { colors, isDark } = useTheme();

  const difficultyColor =
    trek.trek_difficulty === "Easy"
      ? "#1D3A2E"
      : trek.trek_difficulty === "Moderate"
        ? "#d97706"
        : "#dc2626";

  return (
    <TouchableOpacity
      style={[styles.card, { width, backgroundColor: isDark ? "#14161f" : colors.surface }]}
      activeOpacity={0.88}
      onPress={() => router.push(`/(tabs)/(home)/trek/${trek.slug}` as never)}
    >
      <Image
        source={trek.hero_image_url ? { uri: trek.hero_image_url } : undefined}
        style={styles.image}
        contentFit="cover"
        placeholder={FALLBACK_BLUR}
        transition={250}
      />
      {showMeta && trek.trek_difficulty && (
        <View style={[styles.diffBadge, { backgroundColor: difficultyColor + "22", borderColor: difficultyColor + "44" }]}>
          <Text style={[styles.diffText, { color: difficultyColor }]}>{trek.trek_difficulty}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={2}>
          {trek.title}
        </Text>
        {trek.trek_state && (
          <Text style={[styles.state, { color: colors.textSecondary }]} numberOfLines={1}>
            {trek.trek_state}
          </Text>
        )}
        {trek.trek_duration && (
          <Text style={[styles.meta, { color: colors.textMuted }]}>{trek.trek_duration}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    overflow: "hidden",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  image: {
    width: "100%",
    height: 140,
  },
  diffBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  diffText: {
    fontSize: 10,
    fontWeight: "600",
  },
  info: {
    padding: 10,
    gap: 2,
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17,
  },
  state: {
    fontSize: 11,
    marginTop: 2,
  },
  meta: {
    fontSize: 11,
    marginTop: 1,
  },
});
