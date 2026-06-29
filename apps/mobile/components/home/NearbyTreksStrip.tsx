import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { TrekCard } from "@/components/trek/TrekCard";
import { useNearbyTreks } from "@/hooks/useNearbyTreks";
import { useTheme } from "@/hooks/useTheme";
import type { TrekListItem } from "@/lib/mobileApi";

function toTrekListItem(nearby: ReturnType<typeof useNearbyTreks>["treks"][number]): TrekListItem {
  return {
    slug: nearby.slug,
    title: nearby.name ?? nearby.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    trek_state: nearby.state,
    trek_difficulty: nearby.difficulty,
    trek_duration: nearby.trek_duration,
    hero_image_url: nearby.hero_image_url,
    trek_season: nearby.trek_season,
  };
}

export function NearbyTreksStrip() {
  const { treks, locationGranted, isLoading, openSettings } = useNearbyTreks();
  const { colors } = useTheme();

  if (locationGranted === false) {
    return (
      <View style={styles.container}>
        <Text style={[styles.heading, { color: colors.textPrimary }]}>Treks Near You</Text>
        <TouchableOpacity
          style={[styles.permissionBanner, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={openSettings}
          accessibilityRole="button"
          accessibilityLabel="Enable location to see treks near you"
        >
          <Ionicons name="location-outline" size={18} color={colors.accent} />
          <Text style={[styles.permissionText, { color: colors.textSecondary }]}>
            Enable location to see treks near you →
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={[styles.heading, { color: colors.textPrimary }]}>Treks Near You</Text>
        <SkeletonRow />
      </View>
    );
  }

  if (!treks.length) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <Text style={[styles.heading, { color: colors.textPrimary }]}>Treks Near You</Text>
        <View style={styles.locationBadge}>
          <Ionicons name="location" size={12} color={colors.accent} />
          <Text style={[styles.locationText, { color: colors.accent }]}>Live</Text>
        </View>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {treks.map((trek) => (
          <View key={trek.slug} style={styles.cardWrapper}>
            <TrekCard trek={toTrekListItem(trek)} width={180} />
            <View style={[styles.distanceBadge, { backgroundColor: colors.accent }]}>
              <Text style={styles.distanceText}>{trek.distance_km} km</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function SkeletonRow() {
  return (
    <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 12 }}>
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          style={{ width: 180, height: 220, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)" }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    gap: 12,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 8,
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
  },
  locationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  locationText: {
    fontSize: 11,
    fontWeight: "600",
  },
  row: {
    paddingHorizontal: 16,
    paddingBottom: 4,
    gap: 12,
  },
  cardWrapper: {
    position: "relative",
  },
  distanceBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  distanceText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  permissionBanner: {
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  permissionText: {
    fontSize: 13,
    flex: 1,
  },
});
