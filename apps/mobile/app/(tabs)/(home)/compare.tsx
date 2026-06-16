import { useEffect, useRef, useState } from "react";
import {
  View, Text, ScrollView, TouchableOpacity, ActivityIndicator,
  StyleSheet, Image, TextInput,
} from "react-native";
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

type SearchResult = { slug: string; title: string; hero_image_url: string | null; difficulty: string | null; state: string | null; duration: string | null };

export default function CompareScreen() {
  const { colors, isDark } = useTheme();
  const { slug: preselectSlug } = useLocalSearchParams<{ slug?: string }>();

  // Trek pool (trending) + search
  const [treks, setTreks] = useState<TrekListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Selection + comparison
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedNames, setSelectedNames] = useState<Record<string, string>>({});
  const [selectedImages, setSelectedImages] = useState<Record<string, string | null>>({});
  const [compareData, setCompareData] = useState<CompareTreksResponse | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    contentApi
      .getTrendingTreks()
      .then((data) => {
        setTreks(data);
        if (preselectSlug && data.some((t) => t.slug === preselectSlug)) {
          const t = data.find((t) => t.slug === preselectSlug)!;
          setSelected([preselectSlug]);
          setSelectedNames({ [preselectSlug]: t.title });
          setSelectedImages({ [preselectSlug]: t.hero_image_url ?? null });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [preselectSlug]);

  // Debounced search
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await contentApi.searchTreks(searchQuery, 10);
        setSearchResults(res);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 400);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [searchQuery]);

  // Trigger comparison
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

  function selectTrek(slug: string, name: string, image: string | null) {
    if (selected.includes(slug)) {
      setSelected(selected.filter((s) => s !== slug));
      setSelectedNames((prev) => { const n = { ...prev }; delete n[slug]; return n; });
      setSelectedImages((prev) => { const n = { ...prev }; delete n[slug]; return n; });
    } else if (selected.length < MAX_SELECTION) {
      setSelected([...selected, slug]);
      setSelectedNames((prev) => ({ ...prev, [slug]: name }));
      setSelectedImages((prev) => ({ ...prev, [slug]: image }));
    }
  }

  const trekPool: SearchResult[] = searchQuery.trim()
    ? searchResults
    : treks.map((t) => ({ slug: t.slug, title: t.title, hero_image_url: t.hero_image_url ?? null, difficulty: null, state: null, duration: null }));

  const bg = isDark ? "#14161f" : "#fff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(29,58,46,0.1)";

  return (
    <SafeArea edges={["bottom"]}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Compare treks</Text>
        <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
          Pick 2–3 treks to compare side by side with an AI trade-off summary.
        </Text>

        {/* Selected pills row */}
        {selected.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectedRow} contentContainerStyle={styles.selectedRowContent}>
            {selected.map((slug) => (
              <TouchableOpacity key={slug} style={styles.selectedPill} onPress={() => selectTrek(slug, selectedNames[slug] ?? slug, selectedImages[slug] ?? null)}>
                {selectedImages[slug] ? (
                  <Image source={{ uri: selectedImages[slug]! }} style={styles.pillImage} />
                ) : (
                  <View style={[styles.pillImage, { backgroundColor: "rgba(232,112,42,0.15)" }]} />
                )}
                <Text style={styles.pillName} numberOfLines={1}>{selectedNames[slug] ?? slug}</Text>
                <Text style={styles.pillRemove}>✕</Text>
              </TouchableOpacity>
            ))}
            {selected.length < MAX_SELECTION && (
              <View style={styles.selectedPillEmpty}>
                <Text style={styles.pillEmptyText}>+ Add trek</Text>
              </View>
            )}
          </ScrollView>
        )}

        {/* Search input */}
        <View style={[styles.searchBar, { backgroundColor: bg, borderColor: border }]}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search for a trek to compare…"
            placeholderTextColor={colors.textMuted}
            style={[styles.searchInput, { color: colors.textPrimary }]}
          />
          {searching && <ActivityIndicator size="small" color="#E8702A" style={{ marginRight: 8 }} />}
        </View>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color="#E8702A" />
          </View>
        )}

        {/* Trek grid */}
        {!loading && (
          <View style={styles.trekGrid}>
            {trekPool.map((t) => {
              const active = selected.includes(t.slug);
              const disabled = !active && selected.length >= MAX_SELECTION;
              return (
                <TouchableOpacity
                  key={t.slug}
                  disabled={disabled}
                  style={[
                    styles.trekTile,
                    { backgroundColor: bg, borderColor: active ? "#E8702A" : border, opacity: disabled ? 0.4 : 1 },
                  ]}
                  onPress={() => selectTrek(t.slug, t.title, t.hero_image_url)}
                >
                  {t.hero_image_url ? (
                    <Image source={{ uri: t.hero_image_url }} style={styles.tileImage} resizeMode="cover" />
                  ) : (
                    <View style={[styles.tileImage, { backgroundColor: "rgba(232,112,42,0.08)", alignItems: "center", justifyContent: "center" }]}>
                      <Text style={{ fontSize: 20 }}>⛰️</Text>
                    </View>
                  )}
                  {active && (
                    <View style={styles.tileCheck}>
                      <Text style={styles.tileCheckText}>✓</Text>
                    </View>
                  )}
                  <View style={styles.tileBody}>
                    <Text style={[styles.tileName, { color: active ? "#E8702A" : colors.textPrimary }]} numberOfLines={2}>{t.title}</Text>
                    {(t.state || t.difficulty) && (
                      <Text style={[styles.tileMeta, { color: colors.textMuted }]} numberOfLines={1}>
                        {[t.state, t.difficulty].filter(Boolean).join(" · ")}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Helper text */}
        {selected.length < 2 && !loading && (
          <Text style={[styles.helperText, { color: colors.textMuted }]}>
            Select {2 - selected.length} more trek{2 - selected.length === 1 ? "" : "s"} to compare.
          </Text>
        )}

        {/* Loading comparison */}
        {compareLoading && (
          <View style={[styles.center, { marginTop: 24 }]}>
            <ActivityIndicator color="#E8702A" />
            <Text style={[styles.helperText, { color: colors.textMuted, marginTop: 8 }]}>Comparing treks…</Text>
          </View>
        )}

        {/* Comparison table */}
        {compareData && compareData.treks.length >= 2 && (
          <View style={[styles.table, { borderColor: border, backgroundColor: bg, marginTop: 24 }]}>
            {/* Trek image header */}
            <View style={[styles.tableRow, { borderTopWidth: 0 }]}>
              <View style={[styles.labelCol]} />
              {compareData.treks.map((t) => (
                <View key={t.slug} style={styles.colHeaderCell}>
                  {selectedImages[t.slug] ? (
                    <Image source={{ uri: selectedImages[t.slug]! }} style={styles.headerThumb} resizeMode="cover" />
                  ) : (
                    <View style={[styles.headerThumb, { backgroundColor: "rgba(232,112,42,0.1)", alignItems: "center", justifyContent: "center" }]}>
                      <Text>⛰️</Text>
                    </View>
                  )}
                  <Text style={[styles.colHeaderText, { color: colors.textPrimary }]} numberOfLines={2}>{t.name}</Text>
                </View>
              ))}
            </View>
            {compareData.rows.map((row) => (
              <View key={row.field} style={[styles.tableRow, { borderTopColor: border }]}>
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

        {/* TrekSage AI summary */}
        {compareData?.ai_summary && (
          <GlassSurface rounded="lg" style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
              <View style={styles.summaryBadge}>
                <Text style={styles.summaryBadgeText}>✨ TrekSage says</Text>
              </View>
            </View>
            <Text style={[styles.summaryText, { color: colors.textSecondary }]}>{compareData.ai_summary}</Text>
          </GlassSurface>
        )}
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  heroTitle: { fontSize: 26, fontWeight: "700", fontFamily: "PlayfairDisplay_700Bold", marginBottom: 6 },
  heroSubtitle: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  center: { paddingVertical: 24, alignItems: "center" },
  helperText: { fontSize: 13, textAlign: "center", marginTop: 16 },

  // Selected pills
  selectedRow: { marginBottom: 14 },
  selectedRowContent: { gap: 8, paddingVertical: 2 },
  selectedPill: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(232,112,42,0.12)", borderRadius: 20, borderWidth: 1, borderColor: "rgba(232,112,42,0.35)", paddingRight: 10, overflow: "hidden", maxWidth: 160 },
  pillImage: { width: 32, height: 32, borderRadius: 0 },
  pillName: { flex: 1, fontSize: 12, fontWeight: "600", color: "#E8702A" },
  pillRemove: { fontSize: 11, color: "rgba(232,112,42,0.6)" },
  selectedPillEmpty: { borderRadius: 20, borderWidth: 1, borderStyle: "dashed", borderColor: "rgba(255,255,255,0.2)", paddingHorizontal: 14, paddingVertical: 8, justifyContent: "center" },
  pillEmptyText: { fontSize: 12, color: "rgba(255,255,255,0.3)" },

  // Search
  searchBar: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, marginBottom: 16, paddingHorizontal: 12 },
  searchIcon: { fontSize: 15, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 14, paddingVertical: 12 },

  // Trek grid (2-col)
  trekGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 4 },
  trekTile: { width: "47%", borderRadius: 14, borderWidth: 1.5, overflow: "hidden" },
  tileImage: { width: "100%", height: 90 },
  tileCheck: { position: "absolute", top: 8, right: 8, width: 22, height: 22, borderRadius: 11, backgroundColor: "#E8702A", alignItems: "center", justifyContent: "center" },
  tileCheckText: { color: "#fff", fontSize: 12, fontWeight: "700" },
  tileBody: { padding: 8, gap: 2 },
  tileName: { fontSize: 12, fontWeight: "700", lineHeight: 16 },
  tileMeta: { fontSize: 10 },

  // Comparison table
  table: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 16 },
  tableRow: { flexDirection: "row", borderTopWidth: 1, padding: 10, gap: 6, alignItems: "center" },
  labelCol: { width: 80, fontSize: 11, fontWeight: "600" },
  colHeaderCell: { flex: 1, alignItems: "center", gap: 6 },
  headerThumb: { width: "100%", height: 64, borderRadius: 10, overflow: "hidden" },
  colHeaderText: { fontSize: 12, fontWeight: "700", textAlign: "center" },
  cell: { flex: 1, fontSize: 12, textAlign: "center" },

  // AI Summary
  summaryCard: { marginTop: 8 },
  summaryHeader: { paddingHorizontal: 14, paddingTop: 14, paddingBottom: 6 },
  summaryBadge: { alignSelf: "flex-start", backgroundColor: "rgba(232,112,42,0.15)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "rgba(232,112,42,0.3)" },
  summaryBadgeText: { fontSize: 11, fontWeight: "700", color: "#E8702A", letterSpacing: 0.3 },
  summaryText: { fontSize: 13, lineHeight: 20, paddingHorizontal: 14, paddingBottom: 14 },
});
