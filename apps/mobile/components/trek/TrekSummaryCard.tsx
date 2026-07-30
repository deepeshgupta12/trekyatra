import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { resizedImageUrl } from "@/lib/imageUrl";

interface StatItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color?: string;
}

interface TrekSummaryCardProps {
  routeTitle: string;
  routeSubtitle?: string | null;
  duration?: string | null;
  altitude?: string | null;
  difficulty?: string | null;
  routeImageUrl?: string | null;
  heroImageUrl?: string | null;
  onOpenMap: () => void;
  onOpenPhotos: () => void;
}

function difficultyColor(d: string | null | undefined): string {
  const k = (d ?? "").toLowerCase();
  if (k.includes("easy")) return "#22c55e";
  if (k.includes("challeng") || k.includes("difficult") || k.includes("hard")) return "#ef4444";
  return "#f59e0b";
}

/**
 * Redesign (v1.1) trek-detail summary card — a paper card overlapping the hero with the
 * route sub-card (map thumbnail → full map), a Duration/Altitude/Difficulty stats grid, and a
 * Photo-tour card (→ trip-report gallery). Mapped to real trek fields (no rating/length/gain/
 * video). Renders above the existing section tab bar; the pinned bar/offline/premium are untouched.
 */
export function TrekSummaryCard({
  routeTitle,
  routeSubtitle,
  duration,
  altitude,
  difficulty,
  routeImageUrl,
  heroImageUrl,
  onOpenMap,
  onOpenPhotos,
}: TrekSummaryCardProps) {
  const { colors, isDark } = useTheme();
  const [mapFailed, setMapFailed] = useState(false);

  const hasMap = !!routeImageUrl && routeImageUrl !== heroImageUrl;
  const mapUri = hasMap ? (mapFailed ? routeImageUrl : resizedImageUrl(routeImageUrl, 800)) : null;

  const stats: StatItem[] = [
    duration ? { icon: "time-outline", label: "Duration", value: duration } : null,
    altitude ? { icon: "trending-up-outline", label: "Max altitude", value: altitude } : null,
    difficulty ? { icon: "fitness-outline", label: "Difficulty", value: difficulty, color: difficultyColor(difficulty) } : null,
  ].filter(Boolean) as StatItem[];

  const softBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(29,58,46,0.03)";

  return (
    <View style={[styles.card, { backgroundColor: colors.background }]}>
      {/* Stats grid — trek metadata sits ABOVE the Trail Route card (D15: was below). */}
      {stats.length > 0 ? (
        <View style={[styles.statsGrid, { borderColor: colors.border }]}>
          {stats.map((s, i) => (
            <View
              key={s.label}
              style={[styles.statCell, i < stats.length - 1 && { borderRightWidth: 1, borderRightColor: colors.border }]}
            >
              <Ionicons name={s.icon} size={16} color={s.color ?? colors.accent} />
              <Text style={[styles.statValue, { color: s.color ?? colors.textPrimary }]} numberOfLines={1}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      {/* Route sub-card */}
      {hasMap ? (
        <TouchableOpacity
          style={[styles.routeCard, { backgroundColor: softBg, borderColor: colors.border }]}
          activeOpacity={0.9}
          onPress={onOpenMap}
          accessibilityRole="button"
          accessibilityLabel="Open trail route map"
          testID="summary-route"
        >
          <View style={styles.routeHead}>
            <View style={[styles.routeIcon, { backgroundColor: colors.accent + "1A" }]}>
              <Ionicons name="git-branch-outline" size={16} color={colors.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.routeTitle, { color: colors.textPrimary }]} numberOfLines={1}>Trail Route</Text>
              {routeSubtitle ? (
                <Text style={[styles.routeSub, { color: colors.textMuted }]} numberOfLines={1}>{routeSubtitle}</Text>
              ) : null}
            </View>
            <Ionicons name="arrow-up-outline" size={16} color={colors.textMuted} style={{ transform: [{ rotate: "45deg" }] }} />
          </View>
          <View style={styles.mapWrap}>
            <Image
              source={{ uri: mapUri ?? routeImageUrl ?? undefined }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              transition={200}
              cachePolicy="memory-disk"
              onError={() => { if (!mapFailed) setMapFailed(true); }}
            />
          </View>
        </TouchableOpacity>
      ) : null}

      {/* Photo tour */}
      <TouchableOpacity
        style={styles.photoCard}
        activeOpacity={0.9}
        onPress={onOpenPhotos}
        accessibilityRole="button"
        accessibilityLabel="Open trek photo tour"
        testID="summary-photos"
      >
        {heroImageUrl ? (
          <Image source={{ uri: resizedImageUrl(heroImageUrl, 400) ?? heroImageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: softBg }]} />
        )}
        <View style={styles.photoOverlay} />
        <View style={styles.photoBadge}>
          <Ionicons name="images-outline" size={14} color="#fff" />
          <Text style={styles.photoText}>Photo tour</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: -22,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 6,
    gap: 14,
  },
  routeCard: { borderRadius: 18, borderWidth: 1, padding: 12, gap: 12 },
  routeHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  routeIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  routeTitle: { fontSize: 14, fontFamily: "PlayfairDisplay_700Bold" },
  routeSub: { fontSize: 11, marginTop: 1 },
  mapWrap: { width: "100%", height: 120, borderRadius: 12, overflow: "hidden" },
  statsGrid: { flexDirection: "row", borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  statCell: { flex: 1, alignItems: "center", paddingVertical: 12, gap: 3 },
  statValue: { fontSize: 15, fontFamily: "PlayfairDisplay_700Bold" },
  statLabel: { fontSize: 9.5, letterSpacing: 0.3, textTransform: "uppercase", fontWeight: "600" },
  photoCard: { height: 90, borderRadius: 16, overflow: "hidden" },
  photoOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(12,16,14,0.35)" },
  photoBadge: {
    position: "absolute",
    left: 12,
    bottom: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  photoText: { color: "#fff", fontSize: 13, fontWeight: "700", fontFamily: "Inter_600SemiBold" },
});
