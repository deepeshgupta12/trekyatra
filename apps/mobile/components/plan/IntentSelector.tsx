import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";

const OPTIONS = [
  { value: "adventure", label: "Adventure & challenge", emoji: "🏔" },
  { value: "beginner", label: "Beginner-friendly", emoji: "🌱" },
  { value: "monsoon", label: "Monsoon magic", emoji: "🌧" },
  { value: "family", label: "Family-friendly", emoji: "👨‍👩‍👧" },
  { value: "solo", label: "Solo trekker", emoji: "🧍" },
  { value: "group", label: "Group / friends trip", emoji: "👥" },
];

function toggle(list: string[], v: string) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

interface Props {
  value: string[];
  onChange: (v: string[]) => void;
}

export function IntentSelector({ value, onChange }: Props) {
  const { colors, isDark } = useTheme();
  return (
    <View style={styles.grid}>
      {OPTIONS.map((o) => {
        const active = value.includes(o.value);
        return (
          <TouchableOpacity
            key={o.value}
            style={[
              styles.tile,
              {
                backgroundColor: active ? "rgba(232,112,42,0.15)" : isDark ? "rgba(255,255,255,0.04)" : "rgba(29,58,46,0.04)",
                borderColor: active ? "#E8702A" : isDark ? "rgba(255,255,255,0.1)" : "rgba(29,58,46,0.12)",
              },
            ]}
            onPress={() => onChange(toggle(value, o.value))}
            activeOpacity={0.75}
          >
            <Text style={styles.emoji}>{o.emoji}</Text>
            <Text style={[styles.label, { color: active ? "#E8702A" : colors.textSecondary }]}>{o.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  tile: { width: "47%", borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 8, alignItems: "flex-start" },
  emoji: { fontSize: 22 },
  label: { fontSize: 13, fontWeight: "600", lineHeight: 18 },
});
