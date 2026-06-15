import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import type { TrekViewEntry } from "@/lib/behaviorProfile";
import { GlassSurface } from "@/components/ui/GlassSurface";

interface StateAProps {
  firstName: string;
}

interface StateBProps {
  firstName: string;
  viewCount: number;
  topRegion: string | null;
  recentViews: TrekViewEntry[];
}

export function HomeWelcomeBannerA({ firstName }: StateAProps) {
  const { colors } = useTheme();
  return (
    <GlassSurface rounded="lg" style={styles.banner}>
      <Text style={[styles.greeting, { color: colors.textPrimary }]}>
        👋 Welcome, {firstName}
      </Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>
        Discover your first trek
      </Text>
      <TouchableOpacity
        style={styles.cta}
        onPress={() => router.push("/(tabs)/browse" as never)}
        activeOpacity={0.8}
      >
        <Text style={styles.ctaText}>Browse popular treks →</Text>
      </TouchableOpacity>
    </GlassSurface>
  );
}

export function HomeWelcomeBannerB({ firstName, viewCount, topRegion, recentViews }: StateBProps) {
  const { colors } = useTheme();
  return (
    <GlassSurface rounded="lg" style={styles.banner}>
      <Text style={[styles.greeting, { color: colors.textPrimary }]}>
        👋 Welcome back, {firstName}
      </Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>
        You've browsed {viewCount} treks{topRegion ? `, mostly in ${topRegion}` : ""}.
      </Text>
      {recentViews.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
        >
          {recentViews.map((v) => (
            <TouchableOpacity
              key={v.slug}
              style={styles.chip}
              onPress={() => router.push(`/(tabs)/(home)/trek/${v.slug}` as never)}
              activeOpacity={0.8}
            >
              <Text style={styles.chipText} numberOfLines={1}>
                {v.slug.replace(/-/g, " ")}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: 16,
    marginTop: 16,
    padding: 16,
    gap: 6,
  },
  greeting: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
  },
  sub: {
    fontSize: 13,
    lineHeight: 18,
  },
  cta: {
    marginTop: 6,
    alignSelf: "flex-start",
  },
  ctaText: {
    color: "#E8702A",
    fontSize: 13,
    fontWeight: "600",
  },
  chipsRow: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 6,
  },
  chip: {
    backgroundColor: "rgba(232,112,42,0.12)",
    borderWidth: 1,
    borderColor: "rgba(232,112,42,0.25)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    maxWidth: 150,
  },
  chipText: {
    color: "#E8702A",
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
});
