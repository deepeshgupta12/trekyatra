import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import type { TrekRecommendation } from "@/lib/mobileApi";

interface Props {
  rec: TrekRecommendation;
  rank: number;
  onPress: () => void;
}

function MatchBadge({ score }: { score: number }) {
  const color = score >= 85 ? "#22c55e" : score >= 65 ? "#E8702A" : "#94a3b8";
  return (
    <View style={[styles.matchBadge, { backgroundColor: `${color}18`, borderColor: `${color}40` }]}>
      <Text style={[styles.matchText, { color }]}>{score}% match</Text>
    </View>
  );
}

export function PlanResultCard({ rec, rank, onPress }: Props) {
  const { colors, isDark } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: isDark ? "#14161f" : "#fff", borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(29,58,46,0.1)" }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {rec.hero_image_url ? (
        <Image source={{ uri: rec.hero_image_url }} style={styles.img} resizeMode="cover" />
      ) : (
        <View style={[styles.imgPlaceholder, { backgroundColor: isDark ? "rgba(232,112,42,0.08)" : "rgba(29,58,46,0.06)" }]}>
          <Text style={styles.imgEmoji}>⛰️</Text>
        </View>
      )}

      <View style={styles.body}>
        {/* Rank + match */}
        <View style={styles.topRow}>
          <View style={styles.rankBadge}>
            <Text style={styles.rankText}>#{rank}</Text>
          </View>
          <MatchBadge score={rec.match_score} />
        </View>

        {/* Name */}
        <Text style={[styles.name, { color: colors.textPrimary }]} numberOfLines={2}>{rec.name}</Text>

        {/* Meta row */}
        <Text style={[styles.meta, { color: colors.textMuted }]}>
          {[rec.state, rec.difficulty, rec.duration, rec.season].filter(Boolean).join(" · ")}
        </Text>

        {/* Badges */}
        {((rec.budget_min || rec.budget_max) || rec.crowd_level || rec.permit_required || rec.themes?.length) ? (
          <View style={styles.badgeRow}>
            {(rec.budget_min || rec.budget_max) && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {rec.budget_min && rec.budget_max
                    ? `₹${Math.round(rec.budget_min / 1000)}k–₹${Math.round(rec.budget_max / 1000)}k`
                    : `From ₹${Math.round(((rec.budget_min ?? rec.budget_max)!) / 1000)}k`}
                </Text>
              </View>
            )}
            {rec.crowd_level && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{rec.crowd_level} crowd</Text>
              </View>
            )}
            {rec.permit_required && (
              <View style={[styles.badge, styles.badgeAmber]}>
                <Text style={[styles.badgeText, { color: "#F59E0B" }]}>Permit req.</Text>
              </View>
            )}
            {rec.themes?.slice(0, 2).map((t) => (
              <View key={t} style={[styles.badge, styles.badgeAccent]}>
                <Text style={[styles.badgeText, { color: "#E8702A" }]}>{t}</Text>
              </View>
            ))}
          </View>
        ) : null}

        {/* Why */}
        <Text style={[styles.why, { color: colors.textSecondary }]} numberOfLines={3}>{rec.why_this_matches}</Text>

        <TouchableOpacity style={styles.viewBtn} onPress={onPress}>
          <Text style={styles.viewBtnText}>View trek →</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 14 },
  img: { width: "100%", height: 160 },
  imgPlaceholder: { width: "100%", height: 120, alignItems: "center", justifyContent: "center" },
  imgEmoji: { fontSize: 36 },
  body: { padding: 14, gap: 6 },
  topRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  rankBadge: { backgroundColor: "rgba(232,112,42,0.15)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: "rgba(232,112,42,0.3)" },
  rankText: { color: "#E8702A", fontSize: 11, fontWeight: "700" },
  matchBadge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  matchText: { fontSize: 11, fontWeight: "700" },
  name: { fontSize: 16, fontWeight: "700", lineHeight: 22 },
  meta: { fontSize: 12 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  badge: { backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  badgeText: { fontSize: 10, fontWeight: "600", color: "rgba(255,255,255,0.65)" },
  badgeAmber: { backgroundColor: "rgba(245,158,11,0.10)", borderColor: "rgba(245,158,11,0.3)" },
  badgeAccent: { backgroundColor: "rgba(232,112,42,0.10)", borderColor: "rgba(232,112,42,0.25)" },
  why: { fontSize: 13, lineHeight: 18 },
  viewBtn: { marginTop: 4, alignSelf: "flex-start", backgroundColor: "rgba(232,112,42,0.12)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: "rgba(232,112,42,0.25)" },
  viewBtnText: { color: "#E8702A", fontSize: 13, fontWeight: "700" },
});
