import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
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
    case "D": return "Treks matching your interests";
    default:  return "Most loved by our community";
  }
}

const FALLBACK_BLUR = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";
const FALLBACK_IMG  = require("@/assets/onboarding-4.jpg");

interface Props {
  treks: TrekListItem[];
  state: HomeState;
  firstName?: string;
  loading?: boolean;
}

function FeedImageCard({
  trek,
  height,
  fontSize,
}: {
  trek: TrekListItem;
  height: number;
  fontSize: number;
}) {
  const imgSrc = trek.hero_image_url ? { uri: trek.hero_image_url } : FALLBACK_IMG;
  return (
    <TouchableOpacity
      style={[styles.imgCard, { height }]}
      activeOpacity={0.87}
      onPress={() => router.push(`/trek/${trek.slug}` as never)}
      accessibilityLabel={trek.title}
      accessibilityRole="button"
    >
      <Image
        source={imgSrc}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        placeholder={FALLBACK_BLUR}
        transition={250}
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.42)", "rgba(0,0,0,0.84)"]}
        locations={[0.3, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />
      {trek.trek_difficulty && (
        <View style={styles.diffBadge}>
          <Text style={styles.diffText}>{trek.trek_difficulty}</Text>
        </View>
      )}
      <View style={styles.imgCardText}>
        <Text style={[styles.imgCardTitle, { fontSize }]} numberOfLines={2}>
          {trek.title}
        </Text>
        {trek.trek_state && (
          <View style={styles.stateRow}>
            <Ionicons name="location-outline" size={10} color="rgba(255,255,255,0.65)" />
            <Text style={styles.stateLabel}>{trek.trek_state}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export function PersonalisedFeedSection({ treks, state, firstName, loading = false }: Props) {
  const { colors } = useTheme();
  const list = treks.slice(0, 7);

  // Hide the whole section (heading included) when there's nothing to show — otherwise a bare
  // "For {name}" heading would sit at the top of Home with no cards (D06 filtering / D07 move).
  if (!loading && list.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: colors.textPrimary }]}>
        {heading(state, firstName)}
      </Text>
      <Text style={[styles.sub, { color: colors.textMuted }]}>
        {subheading(state)}
      </Text>

      {loading ? (
        <SkeletonMagazine />
      ) : list.length === 0 ? null : (
        <View style={styles.magazine}>
          {/* Hero — full width */}
          {list[0] && (
            <FeedImageCard trek={list[0]} height={190} fontSize={17} />
          )}

          {/* 2-column grid for remaining */}
          {list.length > 1 && (
            <View style={styles.grid}>
              {list.slice(1).map((trek) => (
                <View key={trek.slug} style={styles.gridCell}>
                  <FeedImageCard trek={trek} height={150} fontSize={13} />
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

function SkeletonMagazine() {
  return (
    <View style={styles.magazine}>
      <View style={{ height: 190, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.05)" }} />
      <View style={styles.grid}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={[styles.gridCell, { height: 150, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.04)" }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 32,
    paddingHorizontal: 16,
    gap: 6,
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
    lineHeight: 24,
  },
  sub: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 14,
  },
  magazine: {
    gap: 10,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  gridCell: {
    width: "47.5%",
  },
  // Image overlay card
  imgCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  diffBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.38)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  diffText: {
    fontSize: 9,
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    letterSpacing: 0.3,
  },
  imgCardText: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    gap: 4,
  },
  imgCardTitle: {
    fontWeight: "700",
    color: "#ffffff",
    lineHeight: 18,
    fontFamily: "PlayfairDisplay_700Bold",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  stateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  stateLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "500",
  },
});
