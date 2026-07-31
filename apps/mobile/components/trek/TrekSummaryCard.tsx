import { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { resizedImageUrl } from "@/lib/imageUrl";

interface MetaRow {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  color?: string;
}

interface TrekSummaryCardProps {
  routeTitle: string;
  routeSubtitle?: string | null;
  duration?: string | null;
  /** Max altitude in feet (Master CMS trek_max_altitude_ft). */
  maxAltitudeFt?: number | null;
  difficulty?: string | null;
  season?: string | null;
  routeImageUrl?: string | null;
  heroImageUrl?: string | null;
  /** Tapping the Trail Route thumbnail (opens the map image in the gallery — N09). */
  onOpenMap: () => void;
  /** Tapping the Photo-tour tile (opens the photo gallery — N08). */
  onOpenPhotos: () => void;
}

function difficultyColor(d: string | null | undefined): string {
  const k = (d ?? "").toLowerCase();
  if (k.includes("easy")) return "#22c55e";
  if (k.includes("challeng") || k.includes("difficult") || k.includes("hard")) return "#ef4444";
  return "#f59e0b";
}

/**
 * Redesign (STEP-M30 N06) — trek-detail first-fold summary card modelled on the approved
 * reference (Ama Dablam): a paper card overlapping the hero with the route thumbnail on the left
 * beside a compact metadata list on the right, then a full-width Photo-tour tile. The route
 * thumbnail and the photo tile both open the gallery. Mapped to OUR real trek fields.
 */
export function TrekSummaryCard({
  routeTitle,
  routeSubtitle,
  duration,
  maxAltitudeFt,
  difficulty,
  season,
  routeImageUrl,
  heroImageUrl,
  onOpenMap,
  onOpenPhotos,
}: TrekSummaryCardProps) {
  const { colors, isDark } = useTheme();
  const [mapFailed, setMapFailed] = useState(false);

  const hasMap = !!routeImageUrl && routeImageUrl !== heroImageUrl;
  const mapUri = hasMap ? (mapFailed ? routeImageUrl : resizedImageUrl(routeImageUrl, 800)) : null;

  const meta: MetaRow[] = [
    duration ? { icon: "time-outline", label: "Duration", value: duration } : null,
    maxAltitudeFt != null
      ? { icon: "trending-up-outline", label: "Max altitude", value: `${maxAltitudeFt.toLocaleString("en-IN")} ft` }
      : null,
    difficulty ? { icon: "fitness-outline", label: "Difficulty", value: difficulty, color: difficultyColor(difficulty) } : null,
    season ? { icon: "partly-sunny-outline", label: "Best season", value: season } : null,
  ].filter(Boolean) as MetaRow[];

  const softBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(29,58,46,0.03)";

  return (
    <View style={[styles.card, { backgroundColor: colors.background }]}>
      <View style={styles.topRow}>
        {/* Left: Trail Route thumbnail → gallery (N09) */}
        {hasMap ? (
          <TouchableOpacity
            style={[styles.routeCol, { backgroundColor: softBg, borderColor: colors.border }]}
            activeOpacity={0.9}
            onPress={onOpenMap}
            accessibilityRole="button"
            accessibilityLabel="Open trail route map"
            testID="summary-route"
          >
            <View style={styles.routeHead}>
              <View style={[styles.routeIcon, { backgroundColor: colors.accent + "1A" }]}>
                <Ionicons name="git-branch-outline" size={15} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.routeLabel, { color: colors.textMuted }]}>TRAIL ROUTE</Text>
                <Text style={[styles.routeTitle, { color: colors.textPrimary }]} numberOfLines={1}>{routeTitle}</Text>
              </View>
              <Ionicons name="expand-outline" size={14} color={colors.textMuted} />
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

        {/* Right: compact metadata list */}
        {meta.length > 0 ? (
          <View style={[styles.metaCol, !hasMap && styles.metaColFull]}>
            {meta.map((m, i) => (
              <View
                key={m.label}
                style={[styles.metaRow, i < meta.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
              >
                <Ionicons name={m.icon} size={16} color={m.color ?? colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.metaValue, { color: m.color ?? colors.textPrimary }]} numberOfLines={1}>{m.value}</Text>
                  <Text style={[styles.metaLabel, { color: colors.textMuted }]}>{m.label}</Text>
                </View>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      {/* Photo tour → gallery (N08) */}
      <TouchableOpacity
        style={styles.photoCard}
        activeOpacity={0.9}
        onPress={onOpenPhotos}
        accessibilityRole="button"
        accessibilityLabel="Open trek photo gallery"
        testID="summary-photos"
      >
        {heroImageUrl ? (
          <Image source={{ uri: resizedImageUrl(heroImageUrl, 800) ?? heroImageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: softBg }]} />
        )}
        <View style={styles.photoOverlay} />
        <View style={styles.photoPlay}>
          <Ionicons name="images" size={18} color="#fff" />
        </View>
        <View style={styles.photoBadge}>
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
    gap: 12,
  },
  topRow: { flexDirection: "row", gap: 12 },
  routeCol: { flex: 1.25, borderRadius: 18, borderWidth: 1, padding: 10, gap: 10 },
  routeHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  routeIcon: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  routeLabel: { fontSize: 8.5, fontWeight: "700", letterSpacing: 0.8 },
  routeTitle: { fontSize: 12.5, fontFamily: "PlayfairDisplay_700Bold", marginTop: 1 },
  mapWrap: { width: "100%", height: 96, borderRadius: 12, overflow: "hidden" },
  metaCol: { flex: 1, justifyContent: "center" },
  metaColFull: { flex: 1 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 9 },
  metaValue: { fontSize: 14, fontFamily: "PlayfairDisplay_700Bold" },
  metaLabel: { fontSize: 10, marginTop: 1, fontWeight: "500" },
  photoCard: { height: 104, borderRadius: 16, overflow: "hidden" },
  photoOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(12,16,14,0.32)" },
  photoPlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginTop: -18,
    marginLeft: -18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(232,112,42,0.92)",
    alignItems: "center",
    justifyContent: "center",
  },
  photoBadge: { position: "absolute", left: 12, bottom: 10 },
  photoText: { color: "#fff", fontSize: 13, fontWeight: "700", fontFamily: "Inter_600SemiBold" },
});
