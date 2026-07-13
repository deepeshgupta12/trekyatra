import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { SafeArea } from "@/components/ui/SafeArea";
import { TrekCard } from "@/components/trek/TrekCard";
import { contentApi, type CMSPage, type TrekListItem } from "@/lib/mobileApi";

const SAFFRON = "#E8702A";
// 2-column grid: screen − horizontal padding (16×2) − inter-card gap (12), split in two.
const CARD_WIDTH = (Dimensions.get("window").width - 32 - 12) / 2;

// Mirrors the web /beginner page: easy/beginner difficulty is the filter.
function isBeginnerFriendly(difficulty: string | null | undefined): boolean {
  const d = (difficulty ?? "").toLowerCase();
  return d.includes("easy") || d.includes("beginner");
}

const MISTAKES = [
  "Booking the cheapest operator",
  "Not training for 4 weeks",
  "Wearing brand new boots",
  "Skipping the medical certificate",
  "Underestimating altitude",
  "Cotton clothing",
  "Cheap rented sleeping bag",
  "Booking peak weekend dates",
  "Solo trekking unprepared",
  "Skipping travel insurance",
  "Not buffering 1 extra day",
];

const FIRST_TREKS_BY_CITY = [
  { city: "From Mumbai", treks: "Rajmachi, Kalsubai, Harishchandragad" },
  { city: "From Bangalore", treks: "Kumara Parvatha, Tadiyandamol, Skandagiri" },
  { city: "From Delhi", treks: "Kedarkantha, Brahmatal, Nag Tibba" },
];

export default function BeginnerScreen() {
  const { colors, isDark } = useTheme();
  const [hubPages, setHubPages] = useState<CMSPage[]>([]);
  const [beginnerTreks, setBeginnerTreks] = useState<TrekListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled([
      contentApi.getCmsPagesByType("beginner_guide"),
      contentApi.exploreTreks({}, 100, 0),
    ]).then(([hubRes, treksRes]) => {
      if (cancelled) return;
      if (hubRes.status === "fulfilled") setHubPages(hubRes.value);
      if (treksRes.status === "fulfilled") {
        setBeginnerTreks(
          treksRes.value.filter((t) => isBeginnerFriendly(t.trek_difficulty)).slice(0, 6)
        );
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const cardBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(29,58,46,0.04)";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(29,58,46,0.1)";

  return (
    <SafeArea edges={["bottom"]}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        <Text style={[styles.eyebrow, { color: SAFFRON }]}>BEGINNER GUIDES</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Your first trek — start here</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          India-specific, no-nonsense guides for first-time trekkers.
        </Text>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color={SAFFRON} />
          </View>
        )}

        {/* Editorial hub pages (if any beginner_guide CMS pages exist) */}
        {hubPages.map((page) => (
          <TouchableOpacity
            key={page.slug}
            style={[styles.hubCard, { backgroundColor: cardBg, borderColor: cardBorder }]}
            activeOpacity={0.8}
            onPress={() => router.push(`/guide/${page.slug}` as never)}
          >
            <Text style={[styles.hubCardTitle, { color: colors.textPrimary }]}>{page.title}</Text>
            {page.seo_description && (
              <Text style={[styles.hubCardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                {page.seo_description}
              </Text>
            )}
          </TouchableOpacity>
        ))}

        {/* Best beginner treks right now — real published easy trek_guide pages */}
        {!loading && beginnerTreks.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Best beginner treks right now
            </Text>
            <View style={styles.trekGrid}>
              {beginnerTreks.map((trek) => (
                <TrekCard key={trek.slug} trek={trek} width={CARD_WIDTH} height={220} />
              ))}
            </View>
          </View>
        )}

        {/* Editorial: 11 mistakes */}
        <View style={styles.section}>
          <Text style={[styles.eyebrow, { color: SAFFRON }]}>MISTAKES</Text>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            11 mistakes first-time Indian trekkers make
          </Text>
          <View style={[styles.listCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {MISTAKES.map((m, i) => (
              <View key={i} style={styles.listRow}>
                <Text style={[styles.listNum, { color: SAFFRON }]}>{i + 1}</Text>
                <Text style={[styles.listText, { color: colors.textSecondary }]}>{m}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Editorial: best first treks by city */}
        <View style={styles.section}>
          <Text style={[styles.eyebrow, { color: SAFFRON }]}>PICKS</Text>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
            Best first treks by city
          </Text>
          <View style={{ gap: 10 }}>
            {FIRST_TREKS_BY_CITY.map((c) => (
              <View key={c.city} style={[styles.cityCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
                <Text style={[styles.cityTitle, { color: colors.textPrimary }]}>{c.city}</Text>
                <Text style={[styles.cityTreks, { color: colors.textSecondary }]}>{c.treks}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  eyebrow: { fontSize: 11, fontWeight: "700", letterSpacing: 2, marginBottom: 6 },
  title: { fontSize: 26, fontWeight: "700", fontFamily: "PlayfairDisplay_700Bold", marginBottom: 6 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  center: { paddingVertical: 40, alignItems: "center" },
  section: { marginTop: 26 },
  sectionTitle: { fontSize: 18, fontWeight: "700", fontFamily: "PlayfairDisplay_700Bold", marginBottom: 14 },
  trekGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "space-between" },
  hubCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 4, marginTop: 14 },
  hubCardTitle: { fontSize: 15, fontWeight: "600" },
  hubCardDesc: { fontSize: 13, lineHeight: 18 },
  listCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  listRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  listNum: { fontSize: 14, fontWeight: "800", width: 20 },
  listText: { fontSize: 14, lineHeight: 20, flex: 1 },
  cityCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 4 },
  cityTitle: { fontSize: 15, fontWeight: "700" },
  cityTreks: { fontSize: 13, lineHeight: 19 },
});
