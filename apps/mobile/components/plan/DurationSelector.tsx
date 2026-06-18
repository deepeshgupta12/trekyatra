import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";

const OPTIONS = [
  { min: 1, max: 2, label: "1–2 days", hint: "Weekend escape" },
  { min: 3, max: 5, label: "3–5 days", hint: "Short trek" },
  { min: 6, max: 8, label: "6–8 days", hint: "Standard" },
  { min: 9, max: 30, label: "9+ days", hint: "Extended expedition" },
];

interface Props {
  durationMin: number;
  durationMax: number;
  onChange: (min: number, max: number) => void;
}

export function DurationSelector({ durationMin, durationMax, onChange }: Props) {
  const { colors, isDark } = useTheme();
  return (
    <View style={styles.root}>
      {OPTIONS.map((o) => {
        const active = durationMin === o.min && durationMax === o.max;
        return (
          <TouchableOpacity
            key={o.label}
            style={[
              styles.card,
              {
                backgroundColor: active ? "rgba(232,112,42,0.15)" : isDark ? "rgba(255,255,255,0.04)" : "rgba(29,58,46,0.04)",
                borderColor: active ? "#E8702A" : isDark ? "rgba(255,255,255,0.1)" : "rgba(29,58,46,0.12)",
              },
            ]}
            onPress={() => onChange(o.min, o.max)}
            activeOpacity={0.75}
          >
            <View style={styles.cardLeft}>
              <Text style={[styles.cardLabel, { color: active ? "#E8702A" : colors.textPrimary }]}>{o.label}</Text>
              <Text style={[styles.cardHint, { color: colors.textMuted }]}>{o.hint}</Text>
            </View>
            {active && <View style={styles.check}><Text style={styles.checkText}>✓</Text></View>}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10 },
  card: { borderRadius: 14, borderWidth: 1.5, paddingVertical: 16, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardLeft: { gap: 2 },
  cardLabel: { fontSize: 15, fontWeight: "700" },
  cardHint: { fontSize: 12 },
  check: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#E8702A", alignItems: "center", justifyContent: "center" },
  checkText: { color: "#fff", fontSize: 12, fontWeight: "700" },
});
