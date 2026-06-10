import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import type { TrekViewEntry } from "@/lib/behaviorProfile";

interface Props {
  views: TrekViewEntry[];
}

export function RecentlyViewedRow({ views }: Props) {
  const { colors, isDark } = useTheme();

  if (views.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: colors.textPrimary }]}>Recently Viewed</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {views.map((v) => (
          <TouchableOpacity
            key={v.slug}
            style={[
              styles.card,
              { backgroundColor: isDark ? "#14161f" : colors.surface, borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" },
            ]}
            activeOpacity={0.8}
            onPress={() => router.push(`/(tabs)/(home)/trek/${v.slug}` as never)}
          >
            <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={2}>
              {v.slug.replace(/-/g, " ")}
            </Text>
            {v.region && (
              <Text style={[styles.region, { color: colors.textMuted }]} numberOfLines={1}>
                {v.region}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    gap: 12,
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
    paddingHorizontal: 16,
  },
  row: {
    paddingHorizontal: 16,
    gap: 10,
  },
  card: {
    width: 140,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  name: {
    fontSize: 13,
    fontWeight: "600",
    textTransform: "capitalize",
    lineHeight: 17,
  },
  region: {
    fontSize: 11,
  },
});
