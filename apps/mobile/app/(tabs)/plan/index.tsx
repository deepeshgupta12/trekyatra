import { View, Text, TouchableOpacity, Image, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { SafeArea } from "@/components/ui/SafeArea";
import { useTheme } from "@/hooks/useTheme";
import { usePlanWizardStore } from "@/stores/planWizardStore";

export default function PlanIntroScreen() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const reset = usePlanWizardStore((s) => s.reset);

  function handleStart() {
    reset();
    router.push("/(tabs)/plan/step-1" as never);
  }

  return (
    <SafeArea edges={["top", "bottom"]}>
      <View style={styles.root}>
        {/* Hero */}
        <View style={styles.heroBlock}>
          <View style={styles.heroBadge}>
            <Text style={styles.heroBadgeText}>✨  Plan My Trek</Text>
          </View>
          <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
            Find your perfect trek
          </Text>
          <Text style={[styles.heroSubtitle, { color: colors.textMuted }]}>
            Answer 6 quick questions. Our AI will match you to the right trek and connect you with a certified operator.
          </Text>
        </View>

        {/* Steps preview */}
        <View style={styles.stepsBlock}>
          {[
            { num: "1", text: "What kind of trek?" },
            { num: "2", text: "When are you going?" },
            { num: "3", text: "How long can you trek?" },
            { num: "4", text: "Your fitness & experience" },
            { num: "5", text: "Preferred region" },
            { num: "6", text: "Get a personalised plan" },
          ].map((s) => (
            <View key={s.num} style={styles.stepRow}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{s.num}</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.textSecondary }]}>{s.text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.startBtn} onPress={handleStart} activeOpacity={0.85}>
          <Text style={styles.startBtnText}>Start planning →</Text>
        </TouchableOpacity>

        <Text style={[styles.note, { color: colors.textMuted }]}>
          Takes about 2 minutes · Free · No commitment
        </Text>
      </View>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24, justifyContent: "center", gap: 28 },
  heroBlock: { gap: 10 },
  heroBadge: { alignSelf: "flex-start", backgroundColor: "rgba(232,112,42,0.12)", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, borderColor: "rgba(232,112,42,0.25)" },
  heroBadgeText: { color: "#E8702A", fontSize: 12, fontWeight: "700" },
  heroTitle: { fontSize: 30, fontWeight: "700", fontFamily: "PlayfairDisplay_700Bold", lineHeight: 38 },
  heroSubtitle: { fontSize: 14, lineHeight: 22 },
  stepsBlock: { backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", padding: 16, gap: 12 },
  stepRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepNum: { width: 26, height: 26, borderRadius: 13, backgroundColor: "rgba(232,112,42,0.15)", borderWidth: 1, borderColor: "rgba(232,112,42,0.3)", alignItems: "center", justifyContent: "center" },
  stepNumText: { color: "#E8702A", fontSize: 11, fontWeight: "700" },
  stepText: { fontSize: 13, fontWeight: "500" },
  startBtn: { backgroundColor: "#E8702A", borderRadius: 16, paddingVertical: 17, alignItems: "center" },
  startBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  note: { textAlign: "center", fontSize: 12 },
});
