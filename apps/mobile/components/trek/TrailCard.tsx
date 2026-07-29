import { useState } from "react";
import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import type { TrekListItem } from "@/lib/mobileApi";
import { resizedImageUrl } from "@/lib/imageUrl";

interface TrailCardProps {
  trek: TrekListItem;
  width?: number;
  height?: number;
  /** Show the route-map thumbnail (from route_image_url). Default true when a map exists. */
  showMap?: boolean;
  /** Saved (bookmarked) state + toggle. When onToggleSave is omitted the heart is hidden. */
  saved?: boolean;
  onToggleSave?: (trek: TrekListItem) => void;
  /** Drop the built-in right margin so the card can sit in a multi-column grid. */
  noMargin?: boolean;
  testID?: string;
}

const FALLBACK_BLUR = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";
const FALLBACK_IMG = require("@/assets/onboarding-2.jpg");

function difficultyColor(d: string | null | undefined): string {
  const key = d?.toLowerCase() ?? "";
  if (key === "easy") return "#22c55e";
  if (key === "challenging" || key === "difficult" || key === "hard") return "#ef4444";
  return "#f59e0b"; // moderate / mixed — always visible amber
}

/**
 * Redesign (v1.1) trail card — full-bleed hero with a difficulty badge (top-left),
 * a save heart (top-right), the route-map thumbnail (bottom-right, from route_image_url),
 * and title + route + meta pinned bottom-left. Presentational: the parent owns save state.
 * The 400w image variant loads first, falling back to the original on error.
 */
export function TrailCard({
  trek,
  width = 300,
  height = 200,
  showMap = true,
  saved = false,
  onToggleSave,
  noMargin = false,
  testID,
}: TrailCardProps) {
  const [useOriginal, setUseOriginal] = useState(false);
  const heroUri = trek.hero_image_url
    ? useOriginal
      ? trek.hero_image_url
      : resizedImageUrl(trek.hero_image_url, 400)
    : null;
  const mapUri = trek.route_image_url && trek.route_image_url !== trek.hero_image_url
    ? resizedImageUrl(trek.route_image_url, 400)
    : null;
  const diffColor = difficultyColor(trek.trek_difficulty);

  return (
    <TouchableOpacity
      style={[styles.card, { width, height }, noMargin && { marginRight: 0 }]}
      activeOpacity={0.9}
      onPress={() => router.push(`/(tabs)/(home)/trek/${trek.slug}` as never)}
      accessibilityRole="button"
      accessibilityLabel={`${trek.title}${trek.trek_state ? `, ${trek.trek_state}` : ""}`}
      testID={testID ?? `trail-card-${trek.slug}`}
    >
      <Image
        source={heroUri ? { uri: heroUri } : FALLBACK_IMG}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        placeholder={FALLBACK_BLUR}
        transition={280}
        cachePolicy="memory-disk"
        onError={() => { if (!useOriginal) setUseOriginal(true); }}
      />
      <LinearGradient
        colors={["rgba(12,16,14,0.05)", "rgba(12,16,14,0.15)", "rgba(12,16,14,0.88)"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* difficulty badge — top left */}
      {trek.trek_difficulty ? (
        <View style={[styles.diffBadge, { backgroundColor: diffColor }]}>
          <Text style={styles.diffText}>{trek.trek_difficulty}</Text>
        </View>
      ) : null}

      {/* save heart — top right */}
      {onToggleSave ? (
        <TouchableOpacity
          style={styles.heart}
          onPress={() => onToggleSave(trek)}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={saved ? `Remove ${trek.title} from saved` : `Save ${trek.title}`}
          testID={`trail-card-save-${trek.slug}`}
        >
          <Ionicons
            name={saved ? "heart" : "heart-outline"}
            size={16}
            color={saved ? "#E8702A" : "#ffffff"}
          />
        </TouchableOpacity>
      ) : null}

      {/* route-map thumbnail — bottom right */}
      {showMap && mapUri ? (
        <View style={styles.mapThumb}>
          <Image source={{ uri: mapUri }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" />
        </View>
      ) : null}

      {/* text block — bottom left */}
      <View style={[styles.info, { right: showMap && mapUri ? 82 : 14 }]}>
        <Text style={styles.title} numberOfLines={2}>{trek.title}</Text>
        <View style={styles.metaRow}>
          {trek.trek_state ? (
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={10} color="rgba(255,255,255,0.85)" />
              <Text style={styles.metaText}>{trek.trek_state}</Text>
            </View>
          ) : null}
          {trek.trek_duration ? (
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={10} color="rgba(255,255,255,0.7)" />
              <Text style={styles.metaText}>{trek.trek_duration}</Text>
            </View>
          ) : null}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: "hidden",
    marginRight: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.28,
    shadowRadius: 16,
    elevation: 8,
  },
  diffBadge: {
    position: "absolute",
    top: 11,
    left: 11,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  diffText: { color: "#fff", fontSize: 10, fontWeight: "700", letterSpacing: 0.2 },
  heart: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.32)",
  },
  mapThumb: {
    position: "absolute",
    right: 12,
    bottom: 12,
    width: 60,
    height: 46,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.85)",
  },
  info: { position: "absolute", left: 14, bottom: 12 },
  title: {
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 16,
    lineHeight: 20,
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 5 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  metaText: { fontSize: 10.5, color: "rgba(255,255,255,0.88)", fontWeight: "500" },
});
