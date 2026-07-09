import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { TrekCard } from "@/components/trek/TrekCard";
import type { TrekListItem } from "@/lib/mobileApi";
import { useTheme } from "@/hooks/useTheme";

type HomeState = "A" | "B" | "C" | "D";

function headingForState(state: HomeState): string {
  switch (state) {
    case "B": return "Recommended for you";
    case "D": return "Continue exploring";
    default:  return "Trending this month";
  }
}

const FALLBACK_BLUR = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";
const FALLBACK_IMG  = require("@/assets/onboarding-3.jpg");

interface Props {
  treks: TrekListItem[];
  state: HomeState;
  loading?: boolean;
}

function FeaturedCard({ trek }: { trek: TrekListItem }) {
  const imgSrc = trek.hero_image_url ? { uri: trek.hero_image_url } : FALLBACK_IMG;
  return (
    <TouchableOpacity
      style={styles.featured}
      activeOpacity={0.88}
      onPress={() => router.push(`/(tabs)/(home)/trek/${trek.slug}` as never)}
      accessibilityLabel={`Featured: ${trek.title}`}
      accessibilityRole="button"
    >
      <Image
        source={imgSrc}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        placeholder={FALLBACK_BLUR}
        transition={300}
      />
      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.48)", "rgba(0,0,0,0.88)"]}
        locations={[0.3, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Featured badge */}
      <View style={styles.featuredBadge}>
        <Ionicons name="flame" size={10} color="#E8702A" />
        <Text style={styles.featuredBadgeText}>Featured</Text>
      </View>
      {/* Bottom text */}
      <View style={styles.featuredText}>
        {trek.trek_difficulty && (
          <Text style={styles.featuredMeta}>{trek.trek_difficulty} · {trek.trek_state}</Text>
        )}
        <Text style={styles.featuredTitle} numberOfLines={2}>{trek.title}</Text>
        <View style={styles.featuredCta}>
          <Text style={styles.featuredCtaText}>View trek</Text>
          <Ionicons name="arrow-forward" size={12} color="#E8702A" />
        </View>
      </View>
    </TouchableOpacity>
  );
}

export function HomeTrendingSection({ treks, state, loading = false }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.headRow}>
        <View>
          <Text style={[styles.heading, { color: colors.textPrimary }]}>
            {headingForState(state)}
          </Text>
          {treks.length > 0 && (
            <Text style={[styles.subheading, { color: colors.textMuted }]}>
              {treks.length} treks · Updated today
            </Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/browse" as never)}
          style={styles.viewAllBtn}
          accessibilityLabel="View all treks"
          accessibilityRole="link"
        >
          <Text style={styles.viewAllText}>See all</Text>
          <Ionicons name="chevron-forward" size={13} color="#E8702A" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <SkeletonRow />
      ) : treks.length === 0 ? null : (
        <>
          {/* Featured first card */}
          <View style={{ paddingHorizontal: 16, marginBottom: 14 }}>
            <FeaturedCard trek={treks[0]} />
          </View>
          {/* Remaining cards horizontal */}
          {treks.length > 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.row}
            >
              {treks.slice(1).map((trek) => (
                <TrekCard key={trek.slug} trek={trek} width={190} height={255} />
              ))}
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}

function SkeletonRow() {
  return (
    <View>
      <View style={{ marginHorizontal: 16, height: 190, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.06)", marginBottom: 14 }} />
      <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 14 }}>
        {[0, 1, 2].map((i) => (
          <View key={i} style={{ width: 190, height: 255, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.05)" }} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 28 },
  headRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  heading: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
    lineHeight: 24,
  },
  subheading: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: "500",
  },
  viewAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingBottom: 2,
  },
  viewAllText: {
    fontSize: 13,
    color: "#E8702A",
    fontWeight: "600",
  },
  row: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  // Featured card
  featured: {
    width: "100%",
    height: 200,
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  featuredBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(232,112,42,0.18)",
    borderWidth: 1,
    borderColor: "rgba(232,112,42,0.35)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#E8702A",
    letterSpacing: 0.3,
  },
  featuredText: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    gap: 4,
  },
  featuredMeta: {
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
    fontFamily: "PlayfairDisplay_700Bold",
    lineHeight: 23,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  featuredCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
  },
  featuredCtaText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#E8702A",
  },
});
