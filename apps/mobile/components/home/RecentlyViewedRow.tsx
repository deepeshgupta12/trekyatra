import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import type { TrekViewEntry } from "@/lib/behaviorProfile";
import { GlassSurface } from "@/components/ui/GlassSurface";

interface Props {
  views: TrekViewEntry[];
}

export function RecentlyViewedRow({ views }: Props) {
  const { colors } = useTheme();

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
            style={styles.cardTouchable}
            activeOpacity={0.8}
            onPress={() => router.push(`/trek/${v.slug}` as never)}
          >
            <GlassSurface rounded="md" style={styles.card}>
              <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={2}>
                {v.slug.replace(/-/g, " ")}
              </Text>
              {v.region && (
                <Text style={[styles.region, { color: colors.textMuted }]} numberOfLines={1}>
                  {v.region}
                </Text>
              )}
            </GlassSurface>
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
  cardTouchable: { width: 140 },
  card: {
    padding: 12,
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
