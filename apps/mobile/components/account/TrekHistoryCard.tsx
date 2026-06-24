import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import type { CheckinOut } from "@/hooks/useCheckin";

interface Props {
  entry: CheckinOut;
}

const STATE_COLORS: Record<string, string> = {
  "Himachal Pradesh": "#4CAF50",
  "Uttarakhand": "#2196F3",
  "Ladakh": "#9C27B0",
  "Sikkim": "#FF9800",
  "Arunachal Pradesh": "#F44336",
};

function stateColor(state?: string): string {
  if (!state) return "#888";
  return STATE_COLORS[state] ?? "#888";
}

export function TrekHistoryCard({ entry }: Props) {
  const { colors } = useTheme();

  const date = new Date(entry.completion_date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.header}>
        <View style={styles.titleBlock}>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
            {entry.trek_title ?? entry.trek_slug}
          </Text>
          <Text style={[styles.date, { color: colors.textSecondary }]}>{date}</Text>
        </View>
        {entry.rating != null && (
          <View style={[styles.ratingBadge, { backgroundColor: colors.accent + "22" }]}>
            <Text style={[styles.ratingText, { color: colors.accent }]}>
              {"★".repeat(entry.rating)}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.meta}>
        {entry.duration_days != null && (
          <View style={[styles.chip, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={[styles.chipText, { color: colors.textSecondary }]}>
              {entry.duration_days}d
            </Text>
          </View>
        )}
        {entry.trek_state && (
          <View style={[styles.chip, { backgroundColor: stateColor(entry.trek_state) + "22" }]}>
            <Text style={[styles.chipText, { color: stateColor(entry.trek_state) }]}>
              {entry.trek_state}
            </Text>
          </View>
        )}
        {entry.max_altitude_ft != null && (
          <View style={[styles.chip, { backgroundColor: colors.surfaceAlt }]}>
            <Text style={[styles.chipText, { color: colors.textSecondary }]}>
              {(entry.max_altitude_ft / 1000).toFixed(1)}k ft
            </Text>
          </View>
        )}
      </View>

      {entry.notes ? (
        <Text style={[styles.notes, { color: colors.textMuted }]} numberOfLines={2}>
          {entry.notes}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  titleBlock: { flex: 1, marginRight: 8 },
  title: { fontSize: 15, fontWeight: "600", marginBottom: 2 },
  date: { fontSize: 12 },
  ratingBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  ratingText: { fontSize: 12 },
  meta: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  chipText: { fontSize: 11, fontWeight: "500" },
  notes: { fontSize: 12, marginTop: 8, lineHeight: 17 },
});
