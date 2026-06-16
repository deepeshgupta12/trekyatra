import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Image } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { SafeArea } from "@/components/ui/SafeArea";
import { useAuth } from "@/hooks/useAuth";
import { planApi, type TrekRecommendation } from "@/lib/mobileApi";

const INTENT_OPTIONS = [
  { value: "beginner", label: "Beginner-friendly", emoji: "🌱" },
  { value: "snow", label: "Snow trek", emoji: "❄️" },
  { value: "valley", label: "Valley / meadow", emoji: "🌸" },
  { value: "adventure", label: "Adventure", emoji: "⛰️" },
  { value: "weekend", label: "Weekend (1-3 days)", emoji: "🏕️" },
  { value: "family", label: "Family-friendly", emoji: "👨‍👩‍👧" },
  { value: "solo", label: "Solo traveller", emoji: "🧑" },
  { value: "photography", label: "Photography", emoji: "📸" },
];

const MONTH_OPTIONS = [
  { value: "Jan,Feb", label: "Jan – Feb", hint: "Winter" },
  { value: "Mar,Apr", label: "Mar – Apr", hint: "Spring" },
  { value: "May,Jun", label: "May – Jun", hint: "Summer" },
  { value: "Jul,Aug", label: "Jul – Aug", hint: "Monsoon" },
  { value: "Sep,Oct", label: "Sep – Oct", hint: "Autumn" },
  { value: "Nov,Dec", label: "Nov – Dec", hint: "Early winter" },
];

const DURATION_OPTIONS = [
  { value: "1,3", label: "1–3 days", hint: "Weekend" },
  { value: "4,5", label: "4–5 days", hint: "Long weekend" },
  { value: "6,7", label: "6–7 days", hint: "1 week" },
  { value: "8,10", label: "8–10 days", hint: "Extended" },
  { value: "1,30", label: "Flexible", hint: "Any duration" },
];

const EXPERIENCE_OPTIONS = [
  { value: "never", label: "Never trekked", diff: "Easy only" },
  { value: "easy", label: "1–2 easy treks", diff: "Easy–Moderate" },
  { value: "moderate", label: "Comfortable, moderate", diff: "Moderate" },
  { value: "experienced", label: "Experienced", diff: "Any" },
  { value: "expert", label: "Expert", diff: "Challenging" },
];

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function MatchBadge({ score }: { score: number }) {
  const color = score >= 85 ? "#22c55e" : score >= 65 ? "#E8702A" : "#94a3b8";
  return (
    <View style={[styles.matchBadge, { backgroundColor: `${color}18`, borderColor: `${color}40` }]}>
      <Text style={[styles.matchText, { color }]}>{score}% match</Text>
    </View>
  );
}

export default function PlanMyTrekScreen() {
  const { colors, isDark } = useTheme();
  const { isAuthenticated } = useAuth();

  const [intent, setIntent] = useState<string[]>([]);
  const [months, setMonths] = useState<string[]>([]);
  const [duration, setDuration] = useState<string>("1,30");
  const [experience, setExperience] = useState<string>("moderate");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [results, setResults] = useState<TrekRecommendation[]>([]);
  const [noMatchMessage, setNoMatchMessage] = useState<string | null>(null);

  async function handleSubmit() {
    if (!isAuthenticated) {
      router.push("/(auth)/sign-in" as never);
      return;
    }
    const [durMin, durMax] = duration.split(",").map(Number);
    setStatus("loading");
    try {
      const monthsList = months.flatMap((m) => m.split(","));
      const res = await planApi.recommend({
        intent,
        months: monthsList,
        duration_min: durMin,
        duration_max: durMax,
        experience_level: experience,
        fitness_level: "average",
      });
      setResults(res.recommendations);
      setNoMatchMessage(res.no_match ? res.no_match_message : null);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  const isActive = (val: string, list?: string[]) =>
    list ? list.includes(val) : duration === val || experience === val;

  const chipStyle = (active: boolean) => [
    styles.chip,
    {
      backgroundColor: active ? "#E8702A" : isDark ? "rgba(255,255,255,0.06)" : "rgba(29,58,46,0.06)",
      borderColor: active ? "#E8702A" : isDark ? "rgba(255,255,255,0.12)" : "rgba(29,58,46,0.15)",
    },
  ];
  const chipTextStyle = (active: boolean) => [styles.chipText, { color: active ? "#fff" : colors.textSecondary }];

  return (
    <SafeArea edges={["bottom"]}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroBlock}>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Plan my trek</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
            Answer a few quick questions and our AI will match you to the right treks.
          </Text>
        </View>

        {/* Section: What kind? */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>What kind of trek?</Text>
          <Text style={[styles.sectionHint, { color: colors.textMuted }]}>Pick all that apply</Text>
          <View style={styles.chipRow}>
            {INTENT_OPTIONS.map((o) => {
              const active = intent.includes(o.value);
              return (
                <TouchableOpacity key={o.value} style={chipStyle(active)} onPress={() => setIntent(toggle(intent, o.value))}>
                  <Text style={[styles.chipEmoji]}>{o.emoji}</Text>
                  <Text style={chipTextStyle(active)}>{o.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section: When */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>When are you free?</Text>
          <View style={styles.chipRow}>
            {MONTH_OPTIONS.map((o) => {
              const active = months.includes(o.value);
              return (
                <TouchableOpacity key={o.value} style={chipStyle(active)} onPress={() => setMonths(toggle(months, o.value))}>
                  <Text style={chipTextStyle(active)}>{o.label}</Text>
                  {!active && <Text style={[styles.chipHint, { color: colors.textMuted }]}>{o.hint}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section: Duration */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>How long can you trek?</Text>
          <View style={styles.chipRow}>
            {DURATION_OPTIONS.map((o) => {
              const active = duration === o.value;
              return (
                <TouchableOpacity key={o.value} style={chipStyle(active)} onPress={() => setDuration(o.value)}>
                  <Text style={chipTextStyle(active)}>{o.label}</Text>
                  {!active && <Text style={[styles.chipHint, { color: colors.textMuted }]}>{o.hint}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Section: Experience */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Your trekking experience</Text>
          <View style={styles.chipRow}>
            {EXPERIENCE_OPTIONS.map((o) => {
              const active = experience === o.value;
              return (
                <TouchableOpacity key={o.value} style={chipStyle(active)} onPress={() => setExperience(o.value)}>
                  <Text style={chipTextStyle(active)}>{o.label}</Text>
                  {!active && <Text style={[styles.chipHint, { color: colors.textMuted }]}>{o.diff}</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          style={[styles.submitBtn, { opacity: status === "loading" ? 0.6 : 1 }]}
          onPress={handleSubmit}
          disabled={status === "loading"}
        >
          {status === "loading" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>
              {isAuthenticated ? "✨  Get my recommendations" : "Sign in to get recommendations"}
            </Text>
          )}
        </TouchableOpacity>

        {status === "error" && (
          <Text style={styles.errorText}>
            Something went wrong — please try again. (Limited to 2 requests / 24 h.)
          </Text>
        )}

        {status === "done" && noMatchMessage && (
          <View style={styles.noMatchBox}>
            <Text style={[styles.noMatchText, { color: colors.textSecondary }]}>{noMatchMessage}</Text>
          </View>
        )}

        {/* Results */}
        {status === "done" && results.length > 0 && (
          <>
            <Text style={[styles.resultsHeading, { color: colors.textPrimary }]}>
              {results.length} recommended trek{results.length !== 1 ? "s" : ""}
            </Text>
            {results.map((rec) => (
              <TouchableOpacity
                key={rec.slug}
                style={[
                  styles.resultCard,
                  { backgroundColor: isDark ? "#14161f" : "#fff", borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(29,58,46,0.1)" },
                ]}
                activeOpacity={0.85}
                onPress={() => router.push(`/trek/${rec.slug}` as never)}
              >
                {/* Hero image */}
                {rec.hero_image_url ? (
                  <Image source={{ uri: rec.hero_image_url }} style={styles.cardImage} resizeMode="cover" />
                ) : (
                  <View style={[styles.cardImagePlaceholder, { backgroundColor: isDark ? "rgba(232,112,42,0.08)" : "rgba(29,58,46,0.06)" }]}>
                    <Text style={styles.cardImageEmoji}>⛰️</Text>
                  </View>
                )}

                <View style={styles.cardBody}>
                  {/* Title row */}
                  <View style={styles.cardTitleRow}>
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]} numberOfLines={2}>{rec.name}</Text>
                    <MatchBadge score={rec.match_score} />
                  </View>

                  {/* Meta */}
                  <Text style={[styles.cardMeta, { color: colors.textMuted }]}>
                    {[rec.state, rec.difficulty, rec.duration, rec.season].filter(Boolean).join(" · ")}
                  </Text>

                  {/* Budget / crowd / themes badges */}
                  {((rec.budget_min || rec.budget_max) || rec.crowd_level || rec.themes?.length || rec.permit_required) && (
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
                          <Text style={[styles.badgeText, styles.badgeTextAmber]}>Permit req.</Text>
                        </View>
                      )}
                      {rec.themes?.slice(0, 2).map((t) => (
                        <View key={t} style={[styles.badge, styles.badgeAccent]}>
                          <Text style={[styles.badgeText, styles.badgeTextAccent]}>{t}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  {/* Why this matches */}
                  <Text style={[styles.cardWhy, { color: colors.textSecondary }]} numberOfLines={3}>
                    {rec.why_this_matches}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </>
        )}
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, paddingBottom: 48 },
  heroBlock: { marginBottom: 20 },
  heroTitle: { fontSize: 26, fontWeight: "700", fontFamily: "PlayfairDisplay_700Bold", marginBottom: 6 },
  heroSubtitle: { fontSize: 14, lineHeight: 20 },
  section: { marginBottom: 20 },
  sectionLabel: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  sectionHint: { fontSize: 12, marginBottom: 10 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  chip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipEmoji: { fontSize: 13 },
  chipText: { fontSize: 13, fontWeight: "500" },
  chipHint: { fontSize: 10, fontWeight: "500" },
  submitBtn: { backgroundColor: "#E8702A", borderRadius: 14, paddingVertical: 15, alignItems: "center", marginTop: 4, marginBottom: 8 },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  errorText: { color: "#ef4444", fontSize: 13, marginTop: 12, textAlign: "center" },
  noMatchBox: { backgroundColor: "rgba(232,112,42,0.08)", borderRadius: 12, padding: 12, marginTop: 8 },
  noMatchText: { fontSize: 13, lineHeight: 18, textAlign: "center" },
  resultsHeading: { fontSize: 16, fontWeight: "700", marginTop: 20, marginBottom: 8 },
  resultCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden", marginBottom: 14 },
  cardImage: { width: "100%", height: 160 },
  cardImagePlaceholder: { width: "100%", height: 120, alignItems: "center", justifyContent: "center" },
  cardImageEmoji: { fontSize: 36 },
  cardBody: { padding: 14, gap: 6 },
  cardTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: "700", flex: 1, lineHeight: 22 },
  matchBadge: { borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, flexShrink: 0 },
  matchText: { fontSize: 11, fontWeight: "700" },
  cardMeta: { fontSize: 12 },
  cardWhy: { fontSize: 13, lineHeight: 18, marginTop: 2 },
  badgeRow: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  badge: { backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  badgeText: { fontSize: 10, fontWeight: "600", color: "rgba(255,255,255,0.65)" },
  badgeAmber: { backgroundColor: "rgba(245,158,11,0.10)", borderColor: "rgba(245,158,11,0.3)" },
  badgeTextAmber: { color: "#F59E0B" },
  badgeAccent: { backgroundColor: "rgba(232,112,42,0.10)", borderColor: "rgba(232,112,42,0.25)" },
  badgeTextAccent: { color: "#E8702A" },
});
