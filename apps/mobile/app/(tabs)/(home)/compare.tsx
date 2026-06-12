import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { SafeArea } from "@/components/ui/SafeArea";
import { contentApi, type TrekListItem } from "@/lib/mobileApi";

const ROWS: { key: keyof TrekListItem; label: string }[] = [
  { key: "trek_state", label: "Region" },
  { key: "trek_difficulty", label: "Difficulty" },
  { key: "trek_duration", label: "Duration" },
  { key: "trek_season", label: "Best season" },
];

export default function CompareScreen() {
  const { colors, isDark } = useTheme();
  const { slug: preselectSlug } = useLocalSearchParams<{ slug?: string }>();
  const [treks, setTreks] = useState<TrekListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string[]>([]);

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

  function toggleSelect(slug: string) {
    if (selected.includes(slug)) {
      setSelected(selected.filter((s) => s !== slug));
    } else if (selected.length < 2) {
      setSelected([...selected, slug]);
    }
  }

  const selectedTreks = selected.map((slug) => treks.find((t) => t.slug === slug)).filter(Boolean) as TrekListItem[];

  return (
    <SafeArea edges={["bottom"]}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Compare treks</Text>
        <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
          Pick two treks to compare side by side.
        </Text>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color="#E8702A" />
          </View>
        )}

        <View style={styles.chipRow}>
          {treks.map((t) => {
            const active = selected.includes(t.slug);
            const disabled = !active && selected.length >= 2;
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

        {selectedTreks.length === 2 && (
          <View
            style={[
              styles.table,
              {
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(29,58,46,0.1)",
              },
            ]}
          >
            <View style={styles.tableRow}>
              <View style={styles.labelCol} />
              {selectedTreks.map((t) => (
                <Text key={t.slug} style={[styles.colHeader, { color: colors.textPrimary }]}>
                  {t.title}
                </Text>
              ))}
            </View>
            {ROWS.map((row) => (
              <View
                key={row.key}
                style={[
                  styles.tableRow,
                  { borderTopColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(29,58,46,0.08)" },
                ]}
              >
                <Text style={[styles.labelCol, { color: colors.textMuted }]}>{row.label}</Text>
                {selectedTreks.map((t) => (
                  <Text key={t.slug} style={[styles.cell, { color: colors.textSecondary }]}>
                    {(t[row.key] as string | null) ?? "—"}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        )}

        {selectedTreks.length < 2 && !loading && (
          <Text style={[styles.helperText, { color: colors.textMuted }]}>
            Select {2 - selectedTreks.length} more trek{2 - selectedTreks.length === 1 ? "" : "s"} to compare.
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
});
