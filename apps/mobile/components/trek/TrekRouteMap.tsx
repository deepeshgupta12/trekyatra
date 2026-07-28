import { useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { resizedImageUrl } from "@/lib/imageUrl";

interface TrekRouteMapProps {
  routeImageUrl: string | null | undefined;
  /** Hero image URL — skip the map if it's the same asset (route falls back to hero elsewhere). */
  heroImageUrl?: string | null;
}

/**
 * "Trail Route Map" section — parity with the web trek detail's route map. Renders
 * route_image_url at its natural aspect ratio (measured on load) so tall/wide maps
 * aren't cropped. Returns null when there's no distinct map image.
 */
export function TrekRouteMap({ routeImageUrl, heroImageUrl }: TrekRouteMapProps) {
  const { colors, isDark } = useTheme();
  const [aspect, setAspect] = useState(1.6); // 16:10 placeholder until the real size loads
  const [failed, setFailed] = useState(false);

  if (!routeImageUrl || routeImageUrl === heroImageUrl) return null;

  const uri = failed ? routeImageUrl : resizedImageUrl(routeImageUrl, 800);

  return (
    <View style={styles.container}>
      <View style={styles.headingRow}>
        <Ionicons name="map-outline" size={16} color={colors.accent} />
        <Text style={[styles.heading, { color: colors.textPrimary }]}>Trail Route Map</Text>
      </View>
      <View
        style={[
          styles.mapWrap,
          { aspectRatio: aspect, backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(29,58,46,0.04)", borderColor: colors.border },
        ]}
      >
        <Image
          source={{ uri: uri ?? routeImageUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          transition={220}
          cachePolicy="memory-disk"
          onLoad={(e) => {
            const { width, height } = e.source;
            if (width && height) setAspect(width / height);
          }}
          onError={() => { if (!failed) setFailed(true); }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 10,
  },
  headingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heading: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
  },
  mapWrap: {
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
});
