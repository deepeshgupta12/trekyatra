import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";

const FITNESS_OPTIONS = [
  { value: "low", label: "Light walker", hint: "Low activity" },
  { value: "average", label: "Occasional hiker", hint: "Moderate activity" },
  { value: "good", label: "Regular trekker", hint: "Good stamina" },
  { value: "very_good", label: "Athletic", hint: "High endurance" },
];

const EXPERIENCE_OPTIONS = [
  { value: "never", label: "Never trekked", hint: "First-timer" },
  { value: "easy", label: "1–2 easy treks", hint: "Beginner" },
  { value: "moderate", label: "Comfortable moderate", hint: "Intermediate" },
  { value: "experienced", label: "Experienced", hint: "Any terrain" },
  { value: "expert", label: "Expert", hint: "Challenging+" },
];

interface Props {
  fitnessLevel: string;
  experienceLevel: string;
  onFitnessChange: (v: string) => void;
  onExperienceChange: (v: string) => void;
}

function SegmentGroup({
  options,
  value,
  onChange,
}: {
  options: { value: string; label: string; hint: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  const { colors, isDark } = useTheme();
  return (
    <View style={styles.segGroup}>
      {options.map((o) => {
        const active = value === o.value;
        return (
          <TouchableOpacity
            key={o.value}
            style={[
              styles.seg,
              {
                backgroundColor: active ? "rgba(232,112,42,0.15)" : isDark ? "rgba(255,255,255,0.04)" : "rgba(29,58,46,0.04)",
                borderColor: active ? "#E8702A" : isDark ? "rgba(255,255,255,0.08)" : "rgba(29,58,46,0.1)",
              },
            ]}
            onPress={() => onChange(o.value)}
            activeOpacity={0.75}
          >
            <Text style={[styles.segLabel, { color: active ? "#E8702A" : colors.textSecondary }]}>{o.label}</Text>
            <Text style={[styles.segHint, { color: colors.textMuted }]}>{o.hint}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function FitnessSliders({ fitnessLevel, experienceLevel, onFitnessChange, onExperienceChange }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.root}>
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Fitness level</Text>
        <Text style={[styles.sectionHint, { color: colors.textMuted }]}>How active are you day-to-day?</Text>
        <SegmentGroup options={FITNESS_OPTIONS} value={fitnessLevel} onChange={onFitnessChange} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textPrimary }]}>Trekking experience</Text>
        <Text style={[styles.sectionHint, { color: colors.textMuted }]}>How much trekking have you done?</Text>
        <SegmentGroup options={EXPERIENCE_OPTIONS} value={experienceLevel} onChange={onExperienceChange} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 28 },
  section: { gap: 6 },
  sectionLabel: { fontSize: 15, fontWeight: "700" },
  sectionHint: { fontSize: 12, marginBottom: 8 },
  segGroup: { gap: 8 },
  seg: { borderRadius: 12, borderWidth: 1.5, paddingHorizontal: 14, paddingVertical: 11, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  segLabel: { fontSize: 13, fontWeight: "600" },
  segHint: { fontSize: 11 },
});
