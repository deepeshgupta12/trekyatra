import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { TrekListItem } from "@/lib/mobileApi";

interface TrekCardProps {
  trek: TrekListItem;
  width?: number;
  height?: number;
  showMeta?: boolean;
}

const FALLBACK_BLUR = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";
const FALLBACK_IMG = require("@/assets/onboarding-2.jpg");

function difficultyColor(d: string | null | undefined): string {
  const key = d?.toLowerCase() ?? "";
  if (key === "easy") return "#22c55e";
  if (key.includes("moderate") && key.includes("difficult")) return "#f59e0b";
  if (key === "moderate") return "#f59e0b";
  if (key === "challenging" || key === "difficult" || key === "hard") return "#ef4444";
  return "#f59e0b"; // default to amber — always visible
}

export function TrekCard({ trek, width = 196, height = 260, showMeta = true }: TrekCardProps) {
  const imgSrc = trek.hero_image_url
    ? { uri: trek.hero_image_url }
    : FALLBACK_IMG;

  const diffColor = difficultyColor(trek.trek_difficulty);

  return (
    <TouchableOpacity
      style={[styles.card, { width, height }]}
      activeOpacity={0.88}
      onPress={() => router.push(`/(tabs)/(home)/trek/${trek.slug}` as never)}
      accessibilityLabel={`${trek.title} — ${trek.trek_state ?? ""}`}
      accessibilityRole="button"
    >
      {/* Full-bleed image */}
      <Image
        source={imgSrc}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        placeholder={FALLBACK_BLUR}
        transition={280}
      />

      {/* Cinematic gradient — light top, dark bottom */}
      <LinearGradient
        colors={["transparent", "transparent", "rgba(0,0,0,0.52)", "rgba(0,0,0,0.91)"]}
        locations={[0, 0.4, 0.68, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Difficulty badge — top right */}
      {showMeta && trek.trek_difficulty && (
        <View style={styles.diffBadge}>
          <View style={[styles.diffDot, { backgroundColor: diffColor }]} />
          <Text style={[styles.diffText, { color: diffColor }]}>
            {trek.trek_difficulty}
          </Text>
        </View>
      )}

      {/* Text block pinned to bottom */}
      <View style={styles.textBlock}>
        <Text style={styles.title} numberOfLines={2}>{trek.title}</Text>
        <View style={styles.metaRow}>
          {trek.trek_state && (
            <View style={styles.statePill}>
              <Ionicons name="location-outline" size={9} color="rgba(255,255,255,0.7)" />
              <Text style={styles.stateText}>{trek.trek_state}</Text>
            </View>
          )}
          {trek.trek_duration && (
            <View style={styles.durationPill}>
              <Ionicons name="time-outline" size={9} color="rgba(255,255,255,0.55)" />
              <Text style={styles.durationText}>{trek.trek_duration}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: "hidden",
    marginRight: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  diffBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.62)",
  },
  diffDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  diffText: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  textBlock: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    gap: 6,
  },
  title: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
    lineHeight: 19,
    fontFamily: "PlayfairDisplay_700Bold",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
  },
  statePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.14)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
  },
  stateText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.85)",
    fontWeight: "500",
  },
  durationPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(255,255,255,0.09)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 20,
  },
  durationText: {
    fontSize: 10,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "500",
  },
});
