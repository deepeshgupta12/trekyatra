import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Image } from "expo-image";
import type { TrekListItem } from "@/lib/mobileApi";
import { useTheme } from "@/hooks/useTheme";

type HomeState = "A" | "B" | "D";

function heading(state: HomeState, firstName?: string): string {
  switch (state) {
    case "B": return firstName ? `For ${firstName}` : "For You";
    case "D": return "Continue exploring";
    default:  return "Popular treks";
  }
}

function subheading(state: HomeState): string {
  switch (state) {
    case "B": return "Based on your browsing history";
    case "D": return "Treks based on your browsing history";
    default:  return "Most loved by our community";
  }
}

const FALLBACK_BLUR = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

interface Props {
  treks: TrekListItem[];
  state: HomeState;
  firstName?: string;
  loading?: boolean;
}

export function PersonalisedFeedSection({ treks, state, firstName, loading = false }: Props) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: colors.textPrimary }]}>
        {heading(state, firstName)}
      </Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>
        {subheading(state)}
      </Text>
      {loading ? (
        <SkeletonGrid />
      ) : (
        <View style={styles.grid}>
          {treks.slice(0, 6).map((trek) => (
            <FeedCard key={trek.slug} trek={trek} colors={colors} isDark={isDark} />
          ))}
        </View>
      )}
    </View>
  );
}

function FeedCard({
  trek,
  colors,
  isDark,
}: {
  trek: TrekListItem;
  colors: ReturnType<typeof useTheme>["colors"];
  isDark: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.feedCard, { backgroundColor: isDark ? "#14161f" : colors.surface, borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }]}
      activeOpacity={0.85}
      onPress={() => router.push(`/(tabs)/(home)/trek/${trek.slug}` as never)}
    >
      <Image
        source={trek.hero_image_url ? { uri: trek.hero_image_url } : undefined}
        style={styles.feedImage}
        contentFit="cover"
        placeholder={FALLBACK_BLUR}
        transition={250}
      />
      <View style={styles.feedInfo}>
        <Text style={[styles.feedName, { color: colors.textPrimary }]} numberOfLines={2}>
          {trek.title}
        </Text>
        {trek.trek_state && (
          <Text style={[styles.feedState, { color: colors.textMuted }]} numberOfLines={1}>
            {trek.trek_state}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

function SkeletonGrid() {
  return (
    <View style={styles.grid}>
      {[0,1,2,3,4,5].map((i) => (
        <View key={i} style={[styles.feedCard, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: "transparent" }]}>
          <View style={[styles.feedImage, { backgroundColor: "rgba(255,255,255,0.07)" }]} />
          <View style={styles.feedInfo}>
            <View style={{ height: 12, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.07)", marginBottom: 6 }} />
            <View style={{ height: 10, width: "60%", borderRadius: 5, backgroundColor: "rgba(255,255,255,0.05)" }} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 28,
    paddingHorizontal: 16,
    gap: 6,
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
  },
  sub: {
    fontSize: 12,
    marginBottom: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  feedCard: {
    width: "47%",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
  },
  feedImage: {
    width: "100%",
    height: 110,
  },
  feedInfo: {
    padding: 10,
    gap: 3,
  },
  feedName: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 17,
  },
  feedState: {
    fontSize: 11,
  },
});
