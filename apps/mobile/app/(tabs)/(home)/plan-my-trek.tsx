import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { SafeArea } from "@/components/ui/SafeArea";
import { useAuth } from "@/hooks/useAuth";
import { planApi, type TrekRecommendation } from "@/lib/mobileApi";

const INTENT_OPTIONS = [
  { value: "beginner", label: "Beginner-friendly" },
  { value: "snow", label: "Snow trek" },
  { value: "valley", label: "Valley / meadow" },
  { value: "adventure", label: "Adventure" },
  { value: "weekend", label: "Weekend (1-3 days)" },
  { value: "family", label: "Family-friendly" },
];

const MONTH_OPTIONS = [
  { value: "Jan,Feb", label: "Jan-Feb" },
  { value: "Mar,Apr", label: "Mar-Apr" },
  { value: "May,Jun", label: "May-Jun" },
  { value: "Jul,Aug", label: "Jul-Aug" },
  { value: "Sep,Oct", label: "Sep-Oct" },
  { value: "Nov,Dec", label: "Nov-Dec" },
];

const DURATION_OPTIONS = [
  { value: "1,3", label: "1-3 days" },
  { value: "4,5", label: "4-5 days" },
  { value: "6,7", label: "6-7 days" },
  { value: "8,10", label: "8-10 days" },
  { value: "1,30", label: "Flexible" },
];

const EXPERIENCE_OPTIONS = [
  { value: "never", label: "Never trekked" },
  { value: "easy", label: "1-2 easy treks" },
  { value: "moderate", label: "Comfortable, moderate" },
  { value: "experienced", label: "Experienced" },
  { value: "expert", label: "Expert" },
];

function toggle(list: string[], value: string): string[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
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

  const chip = (active: boolean) => [
    styles.chip,
    {
      backgroundColor: active
        ? "#E8702A"
        : isDark
          ? "rgba(255,255,255,0.06)"
          : "rgba(29,58,46,0.06)",
      borderColor: active ? "#E8702A" : isDark ? "rgba(255,255,255,0.12)" : "rgba(29,58,46,0.15)",
    },
  ];
  const chipText = (active: boolean) => [
    styles.chipText,
    { color: active ? "#fff" : colors.textSecondary },
  ];

  return (
    <SafeArea edges={["bottom"]}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Plan my trek</Text>
        <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
          Answer a few quick questions and our AI trip planner will match you to the right treks.
        </Text>

        <Text style={[styles.label, { color: colors.textPrimary }]}>What kind of trek?</Text>
        <View style={styles.chipRow}>
          {INTENT_OPTIONS.map((o) => (
            <TouchableOpacity
              key={o.value}
              style={chip(intent.includes(o.value))}
              onPress={() => setIntent(toggle(intent, o.value))}
            >
              <Text style={chipText(intent.includes(o.value))}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.textPrimary }]}>When are you free?</Text>
        <View style={styles.chipRow}>
          {MONTH_OPTIONS.map((o) => (
            <TouchableOpacity
              key={o.value}
              style={chip(months.includes(o.value))}
              onPress={() => setMonths(toggle(months, o.value))}
            >
              <Text style={chipText(months.includes(o.value))}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.textPrimary }]}>How long can you trek?</Text>
        <View style={styles.chipRow}>
          {DURATION_OPTIONS.map((o) => (
            <TouchableOpacity key={o.value} style={chip(duration === o.value)} onPress={() => setDuration(o.value)}>
              <Text style={chipText(duration === o.value)}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { color: colors.textPrimary }]}>Your trekking experience</Text>
        <View style={styles.chipRow}>
          {EXPERIENCE_OPTIONS.map((o) => (
            <TouchableOpacity key={o.value} style={chip(experience === o.value)} onPress={() => setExperience(o.value)}>
              <Text style={chipText(experience === o.value)}>{o.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, { opacity: status === "loading" ? 0.6 : 1 }]}
          onPress={handleSubmit}
          disabled={status === "loading"}
        >
          {status === "loading" ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>
              {isAuthenticated ? "Get my recommendations" : "Sign in to get recommendations"}
            </Text>
          )}
        </TouchableOpacity>

        {status === "error" && (
          <Text style={styles.errorText}>
            Something went wrong — please try again in a moment. (Note: limited to 2 requests / 24h.)
          </Text>
        )}

        {status === "done" && noMatchMessage && (
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>{noMatchMessage}</Text>
        )}

        {status === "done" &&
          results.map((rec) => (
            <TouchableOpacity
              key={rec.slug}
              style={[
                styles.resultCard,
                {
                  backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(29,58,46,0.04)",
                  borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(29,58,46,0.1)",
                },
              ]}
              activeOpacity={0.8}
              onPress={() => router.push(`/trek/${rec.slug}` as never)}
            >
              <View style={styles.resultHeader}>
                <Text style={[styles.resultTitle, { color: colors.textPrimary }]}>{rec.name}</Text>
                <View style={styles.scorePill}>
                  <Text style={styles.scoreText}>{rec.match_score}% match</Text>
                </View>
              </View>
              <Text style={[styles.resultMeta, { color: colors.textMuted }]}>
                {[rec.state, rec.difficulty, rec.duration, rec.season].filter(Boolean).join(" · ")}
              </Text>
              <Text style={[styles.resultWhy, { color: colors.textSecondary }]}>{rec.why_this_matches}</Text>
            </TouchableOpacity>
          ))}
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 10, paddingBottom: 40 },
  heroTitle: { fontSize: 26, fontWeight: "700", fontFamily: "PlayfairDisplay_700Bold" },
  heroSubtitle: { fontSize: 14, lineHeight: 20, marginBottom: 8 },
  label: { fontSize: 14, fontWeight: "600", marginTop: 8 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 13, fontWeight: "500" },
  submitBtn: {
    backgroundColor: "#E8702A",
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 16,
  },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  errorText: { color: "#ef4444", fontSize: 13, marginTop: 12, textAlign: "center" },
  helperText: { fontSize: 13, marginTop: 12, textAlign: "center" },
  resultCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6, marginTop: 12 },
  resultHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  resultTitle: { fontSize: 16, fontWeight: "700", flex: 1 },
  scorePill: { backgroundColor: "rgba(232,112,42,0.15)", borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  scoreText: { color: "#E8702A", fontSize: 11, fontWeight: "700" },
  resultMeta: { fontSize: 12 },
  resultWhy: { fontSize: 13, lineHeight: 18 },
});
