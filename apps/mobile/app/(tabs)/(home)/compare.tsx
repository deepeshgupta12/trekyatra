import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { SafeArea } from "@/components/ui/SafeArea";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { contentApi, trekIntelligenceApi, type TrekListItem, type CompareTreksResponse } from "@/lib/mobileApi";

const MAX_SELECTION = 3;

function formatRowValue(value: string | number | boolean | null): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export default function CompareScreen() {
  const { colors, isDark } = useTheme();
  const { slug: preselectSlug } = useLocalSearchParams<{ slug?: string }>();
  const [treks, setTreks] = useState<TrekListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);
  const [compareData, setCompareData] = useState<CompareTreksResponse | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  useEffect(() => {
    contentApi
      .getTrendingTreks()
      .then((data) => {
        setTreks(data);
        if (preselectSlug && data.some((t) => t.slug === preselectSlug)) {
          setSelected([preselectSlug]);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [preselectSlug]);

  useEffect(() => {
    if (selected.length < 2) {
      setCompareData(null);
      return;
    }
    let cancelled = false;
    setCompareLoading(true);
    trekIntelligenceApi
      .compare(selected)
      .then((res) => { if (!cancelled) setCompareData(res); })
      .catch(() => { if (!cancelled) setCompareData(null); })
      .finally(() => { if (!cancelled) setCompareLoading(false); });
    return () => { cancelled = true; };
  }, [selected]);

  function toggleSelect(slug: string) {
    if (selected.includes(slug)) {
      setSelected(selected.filter((s) => s !== slug));
    } else if (selected.length < MAX_SELECTION) {
      setSelected([...selected, slug]);
    }
  }

  return (
    <SafeArea edges={["bottom"]}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Compare treks</Text>
        <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
          Pick 2-3 treks to compare side by side, with an AI trade-off summary.
        </Text>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color="#E8702A" />
          </View>
        )}

        <View style={styles.chipRow}>
          {treks.map((t) => {
            const active = selected.includes(t.slug);
            const disabled = !active && selected.length >= MAX_SELECTION;
            return (
              <TouchableOpacity
                key={t.slug}
                disabled={disabled}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active
                      ? "#E8702A"
                      : isDark
                        ? "rgba(255,255,255,0.06)"
                        : "rgba(29,58,46,0.06)",
                    borderColor: active ? "#E8702A" : isDark ? "rgba(255,255,255,0.12)" : "rgba(29,58,46,0.15)",
                    opacity: disabled ? 0.4 : 1,
                  },
                ]}
                onPress={() => toggleSelect(t.slug)}
              >
                <Text style={[styles.chipText, { color: active ? "#fff" : colors.textSecondary }]}>{t.title}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {compareLoading && (
          <View style={styles.center}>
            <ActivityIndicator color="#E8702A" />
          </View>
        )}

        {compareData && compareData.treks.length >= 2 && (
          <View
            style={[
              styles.table,
              { borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(29,58,46,0.1)" },
            ]}
          >
            <View style={styles.tableRow}>
              <View style={styles.labelCol} />
              {compareData.treks.map((t) => (
                <Text key={t.slug} style={[styles.colHeader, { color: colors.textPrimary }]}>
                  {t.name}
                </Text>
              ))}
            </View>
            {compareData.rows.map((row) => (
              <View
                key={row.field}
                style={[
                  styles.tableRow,
                  { borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(29,58,46,0.08)" },
                ]}
              >
                <Text style={[styles.labelCol, { color: colors.textMuted }]}>{row.label}</Text>
                {row.values.map((value, i) => (
                  <Text key={i} style={[styles.cell, { color: colors.textSecondary }]}>
                    {formatRowValue(value)}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {compareData?.ai_summary && (
          <GlassSurface rounded="lg" style={styles.summaryCard}>
            <View style={styles.summaryContent}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>TrekSage says</Text>
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>{compareData.ai_summary}</Text>
            </View>
          </GlassSurface>
        )}

        {selected.length < 2 && !loading && (
          <Text style={[styles.helperText, { color: colors.textMuted }]}>
            Select {2 - selected.length} more trek{2 - selected.length === 1 ? "" : "s"} to compare.
          </Text>
        )}
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 4, paddingBottom: 32 },
  heroTitle: { fontSize: 26, fontWeight: "700", fontFamily: "PlayfairDisplay_700Bold" },
  heroSubtitle: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  center: { paddingVertical: 24, alignItems: "center" },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: "500" },
  table: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  tableRow: { flexDirection: "row", borderTopWidth: 1, padding: 12, gap: 8 },
  labelCol: { width: 90, fontSize: 12, fontWeight: "600" },
  colHeader: { flex: 1, fontSize: 13, fontWeight: "700" },
  cell: { flex: 1, fontSize: 13 },
  helperText: { fontSize: 13, textAlign: "center", marginTop: 12 },
  summaryCard: { marginTop: 16 },
  summaryContent: { padding: 14, gap: 6 },
  summaryLabel: { fontSize: 11, fontWeight: "700", letterSpacing: 0.5, textTransform: "uppercase" },
  summaryText: { fontSize: 13, lineHeight: 19 },
});
