import { useState, useEffect } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeArea } from "@/components/ui/SafeArea";
import { PlanResultCard } from "@/components/plan/PlanResultCard";
import { usePlanWizardStore } from "@/stores/planWizardStore";
import { useAuth } from "@/hooks/useAuth";
import { useTheme } from "@/hooks/useTheme";
import { planApi, type TrekRecommendation } from "@/lib/mobileApi";

export default function PlanResultsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isAuthenticated, accessToken } = useAuth();
  const { answers } = usePlanWizardStore();

  const [status, setStatus] = useState<"loading" | "done" | "error" | "auth">("loading");
  const [results, setResults] = useState<TrekRecommendation[]>([]);
  const [noMatchMsg, setNoMatchMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      setStatus("auth");
      return;
    }
    fetchResults();
  }, [isAuthenticated, accessToken]);

  async function fetchResults() {
    setStatus("loading");
    try {
      const months = answers.months.includes("flexible") ? [] : answers.months;
      const res = await planApi.recommend({
        intent: answers.intent,
        months,
        duration_min: answers.durationMin,
        duration_max: answers.durationMax,
        experience_level: answers.experienceLevel,
        fitness_level: answers.fitnessLevel,
        region: answers.region ?? undefined,
      });
      setResults(res.recommendations);
      setNoMatchMsg(res.no_match ? res.no_match_message : null);
      setStatus("done");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : null;
      // Expired/invalid token despite isAuthenticated — show re-login prompt
      if (msg?.toLowerCase().includes("authentication required") || msg?.includes("401")) {
        setStatus("auth");
        return;
      }
      setErrorMsg(msg);
      setStatus("error");
    }
  }

  if (status === "auth") {
    return (
      <SafeArea edges={["top", "bottom"]}>
        <View style={styles.center}>
          <Text style={styles.authEmoji}>🔒</Text>
          <Text style={[styles.authTitle, { color: colors.textPrimary }]}>Sign in to see your matches</Text>
          <Text style={[styles.authSub, { color: colors.textMuted }]}>
            Your wizard answers are saved — sign in and we'll show your top treks right away.
          </Text>
          <TouchableOpacity style={styles.signInBtn} onPress={() => router.push("/(auth)/sign-in" as never)}>
            <Text style={styles.signInText}>Sign in →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
            <Text style={[styles.backLinkText, { color: colors.textMuted }]}>← Go back</Text>
          </TouchableOpacity>
        </View>
      </SafeArea>
    );
  }

  if (status === "loading") {
    return (
      <SafeArea edges={["top", "bottom"]}>
        <View style={styles.center}>
          <ActivityIndicator color="#E8702A" size="large" />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Finding your best trek matches…</Text>
        </View>
      </SafeArea>
    );
  }

  if (status === "error") {
    const isRateLimit = errorMsg?.toLowerCase().includes("limit") || errorMsg?.toLowerCase().includes("reached");
    return (
      <SafeArea edges={["top", "bottom"]}>
        <View style={styles.center}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>{isRateLimit ? "⏳" : "🏔"}</Text>
          <Text style={[styles.authTitle, { color: colors.textPrimary }]}>
            {isRateLimit ? "Daily limit reached" : "Something went wrong"}
          </Text>
          <Text style={[styles.authSub, { color: colors.textMuted }]}>
            {errorMsg ?? "We couldn't load your trek matches. Please check your connection and try again."}
          </Text>
          {!isRateLimit && (
            <TouchableOpacity style={styles.signInBtn} onPress={fetchResults}>
              <Text style={styles.signInText}>Try again</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.backLink, isRateLimit && { marginTop: 24 }]} onPress={() => router.push("/(tabs)/plan" as never)}>
            <Text style={[styles.backLinkText, { color: colors.textMuted }]}>← Back to Plan</Text>
          </TouchableOpacity>
        </View>
      </SafeArea>
    );
  }

  return (
    <SafeArea edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push("/(tabs)/plan" as never)} style={styles.closeBtn} hitSlop={12}>
          <Text style={styles.closeArrow}>✕</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Your trek matches</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {noMatchMsg ? (
          <View style={styles.noMatchBox}>
            <Text style={[styles.noMatchText, { color: colors.textSecondary }]}>{noMatchMsg}</Text>
          </View>
        ) : null}

        {results.length > 0 ? (
          <>
            <Text style={[styles.countLine, { color: colors.textMuted }]}>
              {results.length} recommendation{results.length !== 1 ? "s" : ""} based on your answers
            </Text>
            {results.map((rec, i) => (
              <PlanResultCard
                key={rec.slug}
                rec={rec}
                rank={i + 1}
                onPress={() => router.push(`/(tabs)/(home)/trek/${rec.slug}` as never)}
              />
            ))}

            <TouchableOpacity
              style={styles.operatorBtn}
              onPress={() => router.push("/(tabs)/plan/step-6" as never)}
              activeOpacity={0.85}
            >
              <Text style={styles.operatorBtnText}>Talk to an operator about any of these →</Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.center}>
            <Text style={{ fontSize: 36, marginBottom: 12 }}>🏔</Text>
            <Text style={[styles.authTitle, { color: colors.textPrimary }]}>No matches yet</Text>
            <Text style={[styles.authSub, { color: colors.textMuted }]}>Try broadening your filters — remove a month or region preference.</Text>
          </View>
        )}
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  authEmoji: { fontSize: 40, marginBottom: 12 },
  authTitle: { fontSize: 20, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  authSub: { fontSize: 14, textAlign: "center", lineHeight: 20, marginBottom: 24 },
  signInBtn: { backgroundColor: "#E8702A", borderRadius: 14, paddingHorizontal: 28, paddingVertical: 14 },
  signInText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  backLink: { marginTop: 14 },
  backLinkText: { fontSize: 13 },
  loadingText: { marginTop: 16, fontSize: 14 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  closeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  closeArrow: { fontSize: 16, color: "rgba(255,255,255,0.5)" },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 },
  countLine: { fontSize: 12, marginBottom: 12 },
  noMatchBox: { backgroundColor: "rgba(232,112,42,0.08)", borderRadius: 12, padding: 14, marginBottom: 16, borderWidth: 1, borderColor: "rgba(232,112,42,0.2)" },
  noMatchText: { fontSize: 13, lineHeight: 18 },
  operatorBtn: { backgroundColor: "rgba(232,112,42,0.1)", borderRadius: 14, paddingVertical: 14, alignItems: "center", borderWidth: 1, borderColor: "rgba(232,112,42,0.25)", marginTop: 8 },
  operatorBtnText: { color: "#E8702A", fontWeight: "700", fontSize: 14 },
});
