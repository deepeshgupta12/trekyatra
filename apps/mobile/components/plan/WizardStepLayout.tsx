import { useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { SafeArea } from "@/components/ui/SafeArea";
import { WizardProgress } from "./WizardProgress";
import { useTheme } from "@/hooks/useTheme";
import { trackPlanWizardStep } from "@/lib/analytics";

interface Props {
  children: React.ReactNode;
  step: number;
  totalSteps?: number;
  title: string;
  subtitle?: string;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  skipLabel?: string;
  onSkip?: () => void;
}

export function WizardStepLayout({
  children,
  step,
  totalSteps = 6,
  title,
  subtitle,
  onBack,
  onNext,
  nextLabel = "Continue →",
  nextDisabled = false,
  skipLabel,
  onSkip,
}: Props) {
  const { colors, isDark } = useTheme();

  // Plan-wizard funnel: fire a step event each time a step is shown (covers all 6 steps).
  useEffect(() => {
    trackPlanWizardStep(step);
  }, [step]);

  return (
    <SafeArea edges={["top", "bottom"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} hitSlop={12}>
          <Text style={[styles.backArrow, { color: colors.textSecondary }]}>←</Text>
        </TouchableOpacity>
        <WizardProgress current={step} total={totalSteps} />
        <Text style={[styles.stepCounter, { color: colors.textMuted }]}>{step}/{totalSteps}</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>
        ) : null}
        {children}
      </ScrollView>

      {/* Bottom bar */}
      <View style={[styles.bottomBar, { borderTopColor: colors.borderSubtle }]}>
        {skipLabel && onSkip ? (
          <TouchableOpacity
            style={[
              styles.skipBtn,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(29,58,46,0.06)",
                borderColor: colors.border,
              },
            ]}
            onPress={onSkip}
          >
            <Text style={[styles.skipText, { color: colors.textSecondary }]}>{skipLabel}</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity
          style={[styles.nextBtn, nextDisabled && styles.nextBtnDisabled, skipLabel ? styles.nextBtnFlex : styles.nextBtnFull]}
          onPress={onNext}
          disabled={nextDisabled}
          activeOpacity={0.8}
        >
          <Text style={styles.nextText}>{nextLabel}</Text>
        </TouchableOpacity>
      </View>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  backArrow: { fontSize: 20 },
  stepCounter: { fontSize: 12, fontWeight: "600" },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },
  title: { fontSize: 24, fontWeight: "700", fontFamily: "PlayfairDisplay_700Bold", marginBottom: 8, lineHeight: 32 },
  subtitle: { fontSize: 14, lineHeight: 20, marginBottom: 24 },
  bottomBar: { flexDirection: "row", gap: 10, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: 1 },
  skipBtn: { flex: 1, borderRadius: 14, paddingVertical: 15, alignItems: "center", borderWidth: 1 },
  skipText: { fontSize: 14, fontWeight: "600" },
  nextBtn: { borderRadius: 14, paddingVertical: 15, alignItems: "center", backgroundColor: "#E8702A" },
  nextBtnDisabled: { opacity: 0.4 },
  nextBtnFull: { flex: 1 },
  nextBtnFlex: { flex: 2 },
  nextText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
