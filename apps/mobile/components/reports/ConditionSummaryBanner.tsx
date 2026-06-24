import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import type { ConditionSummary } from "@/hooks/useReports";

interface Props {
  summary: ConditionSummary;
}

const DOT_COLORS = {
  open: "#22c55e",
  caution: "#f59e0b",
  closed: "#ef4444",
  unknown: "#6b7280",
};

export function ConditionSummaryBanner({ summary }: Props) {
  const { colors, isDark } = useTheme();

  if (summary.total_reports === 0) {
    return (
      <View
        style={[
          styles.empty,
          {
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
          },
        ]}
      >
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          No trail condition reports yet
        </Text>
      </View>
    );
  }

  const rows: { label: string; pct: number; color: string }[] = [
    { label: "Open", pct: summary.open_pct, color: DOT_COLORS.open },
    { label: "Caution", pct: summary.caution_pct, color: DOT_COLORS.caution },
    { label: "Closed", pct: summary.closed_pct, color: DOT_COLORS.closed },
  ].filter((r) => r.pct > 0);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={[styles.count, { color: colors.textPrimary }]}>
          {summary.total_reports} report{summary.total_reports !== 1 ? "s" : ""}
        </Text>
        {summary.last_report_date && (
          <Text style={[styles.lastDate, { color: colors.textMuted }]}>
            Last:{" "}
            {new Date(summary.last_report_date).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
            })}
          </Text>
        )}
      </View>
      <View style={styles.bars}>
        {rows.map((row) => (
          <View key={row.label} style={styles.barRow}>
            <View style={styles.dotLabel}>
              <View style={[styles.dot, { backgroundColor: row.color }]} />
              <Text style={[styles.barLabel, { color: colors.textSecondary }]}>
                {row.label}
              </Text>
            </View>
            <View style={styles.trackWrap}>
              <View
                style={[
                  styles.track,
                  {
                    backgroundColor: isDark
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(0,0,0,0.08)",
                  },
                ]}
              >
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${row.pct}%` as `${number}%`,
                      backgroundColor: row.color,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.pct, { color: colors.textMuted }]}>
                {row.pct}%
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
  },
  empty: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 16,
    alignItems: "center",
  },
  emptyText: { fontSize: 13 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  count: { fontSize: 13, fontWeight: "600" },
  lastDate: { fontSize: 12 },
  bars: { gap: 8 },
  barRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dotLabel: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    width: 60,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  barLabel: { fontSize: 12 },
  trackWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  track: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 3 },
  pct: { fontSize: 11, width: 32, textAlign: "right" },
});
