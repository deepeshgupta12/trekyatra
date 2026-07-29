import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeArea } from "@/components/ui/SafeArea";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { savePreferences, type Experience, type UserPreferences } from "@/lib/preferences";
import { trackEvent } from "@/lib/analytics";
import { REGIONS } from "@/constants/regions";

const EXPERIENCES: { key: Experience; label: string; sub: string }[] = [
  { key: "beginner", label: "Beginner", sub: "First few treks" },
  { key: "intermediate", label: "Intermediate", sub: "A season or two" },
  { key: "experienced", label: "Experienced", sub: "High-altitude ready" },
];
const DIFFICULTIES = ["Easy", "Moderate", "Hard", "Challenging"];
const VIBES = [
  { key: "high-altitude", label: "🏔️ High-altitude" },
  { key: "scenic", label: "📸 Scenic" },
  { key: "weekend", label: "⛺ Weekend escape" },
  { key: "spiritual", label: "🕉️ Spiritual" },
  { key: "fitness", label: "💪 Fitness" },
];
const STEPS = 4;

function toggle(set: Set<string>, v: string): Set<string> {
  const next = new Set(set);
  next.has(v) ? next.delete(v) : next.add(v);
  return next;
}

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { isAuthenticated } = useAuth();
  const { markDone } = useOnboarding();

  const [step, setStep] = useState(0);
  const [experience, setExperience] = useState<Experience | null>(null);
  const [difficulties, setDifficulties] = useState<Set<string>>(new Set());
  const [regions, setRegions] = useState<Set<string>>(new Set());
  const [vibes, setVibes] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  async function finish(completed: boolean) {
    if (saving) return;
    setSaving(true);
    const prefs: UserPreferences = {
      experience,
      difficulties: difficulties.size ? [...difficulties] : null,
      regions: regions.size ? [...regions] : null,
      vibes: vibes.size ? [...vibes] : null,
      onboarding_completed: completed,
    };
    await savePreferences(prefs, isAuthenticated);
    trackEvent("onboarding", completed ? "onboarding_completed" : "onboarding_skipped", {
      experience,
      regions: prefs.regions?.length ?? 0,
    }).catch(() => {});
    await markDone();
    router.replace(isAuthenticated ? ("/(tabs)/(home)" as never) : ("/(auth)/sign-up" as never));
  }

  function next() {
    trackEvent("onboarding", "onboarding_step", { step: step + 1 }).catch(() => {});
    if (step < STEPS - 1) setStep(step + 1);
    else finish(true);
  }

  const canContinue =
    (step === 0 && !!experience) ||
    (step === 1 && difficulties.size > 0) ||
    (step === 2 && regions.size > 0) ||
    step === 3;

  return (
    <SafeArea>
      <View style={styles.header}>
        <View style={styles.progress}>
          {Array.from({ length: STEPS }).map((_, i) => (
            <View key={i} style={[styles.bar, { backgroundColor: i <= step ? colors.accent : colors.border }]} />
          ))}
        </View>
        <TouchableOpacity onPress={() => finish(false)} accessibilityRole="button" accessibilityLabel="Skip onboarding" testID="onboarding-skip">
          <Text style={[styles.skip, { color: colors.earth }]}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={[styles.stepLabel, { color: colors.earth }]}>Step {step + 1} of {STEPS}</Text>

        {step === 0 && (
          <>
            <Text style={[styles.title, { color: colors.textPrimary }]}>How much have you trekked?</Text>
            <Text style={[styles.sub, { color: colors.earth }]}>We'll pitch trails at the right level.</Text>
            <View style={styles.list}>
              {EXPERIENCES.map((e) => {
                const on = experience === e.key;
                return (
                  <TouchableOpacity
                    key={e.key}
                    style={[styles.opt, { borderColor: on ? colors.accent : colors.border, backgroundColor: on ? colors.accent + "12" : colors.surface }]}
                    onPress={() => setExperience(e.key)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    accessibilityLabel={e.label}
                    testID={`onboarding-exp-${e.key}`}
                  >
                    <View style={[styles.radio, { borderColor: on ? colors.accent : colors.border, backgroundColor: on ? colors.accent : "transparent" }]}>
                      {on ? <Ionicons name="checkmark" size={13} color="#fff" /> : null}
                    </View>
                    <Text style={[styles.optLabel, { color: colors.textPrimary }]}>{e.label}</Text>
                    <Text style={[styles.optSub, { color: colors.earth }]}>{e.sub}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {step === 1 && (
          <>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Pick your comfort zone</Text>
            <Text style={[styles.sub, { color: colors.earth }]}>Choose one or more difficulties.</Text>
            <View style={styles.chipWrap}>
              {DIFFICULTIES.map((d) => {
                const on = difficulties.has(d);
                return (
                  <TouchableOpacity
                    key={d}
                    style={[styles.chip, { borderColor: on ? colors.accent : colors.border, backgroundColor: on ? colors.accent : colors.surface }]}
                    onPress={() => setDifficulties(toggle(difficulties, d))}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    testID={`onboarding-diff-${d}`}
                  >
                    <Text style={[styles.chipText, { color: on ? "#fff" : colors.textPrimary }]}>{d}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {step === 2 && (
          <>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Where to, trailgoer?</Text>
            <Text style={[styles.sub, { color: colors.earth }]}>Your states of interest.</Text>
            <View style={styles.regionGrid}>
              {REGIONS.map((r) => {
                const on = regions.has(r);
                return (
                  <TouchableOpacity
                    key={r}
                    style={[styles.region, { borderColor: on ? colors.pine : colors.border, backgroundColor: on ? colors.pine : colors.surface }]}
                    onPress={() => setRegions(toggle(regions, r))}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    testID={`onboarding-region-${r}`}
                  >
                    <Text style={[styles.regionText, { color: on ? "#fff" : colors.textPrimary }]} numberOfLines={1}>{r}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        {step === 3 && (
          <>
            <Text style={[styles.title, { color: colors.textPrimary }]}>What's the vibe?</Text>
            <Text style={[styles.sub, { color: colors.earth }]}>Shapes your feed. Optional.</Text>
            <View style={styles.chipWrap}>
              {VIBES.map((v) => {
                const on = vibes.has(v.key);
                return (
                  <TouchableOpacity
                    key={v.key}
                    style={[styles.chip, { borderColor: on ? colors.accent : colors.border, backgroundColor: on ? colors.accent : colors.surface }]}
                    onPress={() => setVibes(toggle(vibes, v.key))}
                    accessibilityRole="button"
                    accessibilityState={{ selected: on }}
                    testID={`onboarding-vibe-${v.key}`}
                  >
                    <Text style={[styles.chipText, { color: on ? "#fff" : colors.textPrimary }]}>{v.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <View style={[styles.confirm, { backgroundColor: colors.sky + "14", borderColor: colors.sky + "40" }]}>
              <Text style={[styles.confirmText, { color: colors.textPrimary }]}>
                ✨ Your Home is ready. We'll lead with the treks you'll love.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step > 0 ? (
          <TouchableOpacity style={[styles.backBtn, { borderColor: colors.border }]} onPress={() => setStep(step - 1)} accessibilityLabel="Back" testID="onboarding-back">
            <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[styles.cta, { backgroundColor: canContinue ? colors.accent : colors.border }]}
          onPress={next}
          disabled={!canContinue || saving}
          accessibilityRole="button"
          accessibilityLabel={step === STEPS - 1 ? "Finish onboarding" : "Continue"}
          testID="onboarding-continue"
        >
          <Text style={styles.ctaText}>{step === STEPS - 1 ? "Explore my trails" : "Continue"}</Text>
        </TouchableOpacity>
      </View>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 16, paddingTop: 6, paddingBottom: 4 },
  progress: { flexDirection: "row", gap: 6, flex: 1 },
  bar: { height: 4, borderRadius: 2, flex: 1 },
  skip: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  body: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 20, gap: 8 },
  stepLabel: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  title: { fontSize: 26, fontFamily: "PlayfairDisplay_700Bold", letterSpacing: -0.3, marginTop: 4 },
  sub: { fontSize: 13, marginBottom: 8 },
  list: { gap: 11, marginTop: 8 },
  opt: { flexDirection: "row", alignItems: "center", gap: 12, padding: 15, borderRadius: 16, borderWidth: 1.5 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, alignItems: "center", justifyContent: "center" },
  optLabel: { fontSize: 15, fontWeight: "700", fontFamily: "Inter_600SemiBold" },
  optSub: { fontSize: 11, marginLeft: "auto" },
  chipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 999, borderWidth: 1.5 },
  chipText: { fontSize: 14, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  regionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 },
  region: { width: "47%", paddingVertical: 14, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1.5, alignItems: "center" },
  regionText: { fontSize: 13, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  confirm: { marginTop: 18, padding: 14, borderRadius: 14, borderWidth: 1 },
  confirmText: { fontSize: 13, lineHeight: 19 },
  footer: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { width: 52, height: 52, borderRadius: 16, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  cta: { flex: 1, height: 52, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  ctaText: { color: "#fff", fontSize: 15, fontWeight: "700", fontFamily: "Inter_600SemiBold" },
});
