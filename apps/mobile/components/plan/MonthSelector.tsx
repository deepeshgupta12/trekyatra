import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FLEXIBLE = "flexible";

function toggle(list: string[], v: string) {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

interface Props {
  value: string[]; // individual month names, or ["flexible"]
  onChange: (v: string[]) => void;
}

export function MonthSelector({ value, onChange }: Props) {
  const { colors, isDark } = useTheme();
  const isFlexible = value.includes(FLEXIBLE);

  function handleMonth(m: string) {
    if (isFlexible) {
      onChange([m]);
    } else {
      onChange(toggle(value, m));
    }
  }

  function handleFlexible() {
    onChange([FLEXIBLE]);
  }

  const monthBg = (m: string) =>
    value.includes(m) ? "rgba(232,112,42,0.15)" : isDark ? "rgba(255,255,255,0.04)" : "rgba(29,58,46,0.04)";
  const monthBorder = (m: string) =>
    value.includes(m) ? "#E8702A" : isDark ? "rgba(255,255,255,0.1)" : "rgba(29,58,46,0.12)";

  return (
    <View style={styles.root}>
      <View style={styles.grid}>
        {MONTHS.map((m) => {
          const active = value.includes(m);
          return (
            <TouchableOpacity
              key={m}
              style={[styles.cell, { backgroundColor: monthBg(m), borderColor: monthBorder(m) }]}
              onPress={() => handleMonth(m)}
              activeOpacity={0.75}
            >
              <Text style={[styles.cellText, { color: active ? "#E8702A" : colors.textSecondary }]}>{m}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={[
          styles.flexChip,
          {
            backgroundColor: isFlexible ? "rgba(232,112,42,0.15)" : isDark ? "rgba(255,255,255,0.04)" : "rgba(29,58,46,0.04)",
            borderColor: isFlexible ? "#E8702A" : isDark ? "rgba(255,255,255,0.1)" : "rgba(29,58,46,0.12)",
          },
        ]}
        onPress={handleFlexible}
        activeOpacity={0.75}
      >
        <Text style={[styles.flexText, { color: isFlexible ? "#E8702A" : colors.textSecondary }]}>
          I'm flexible — any month
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  cell: { width: "22%", borderRadius: 12, borderWidth: 1.5, paddingVertical: 12, alignItems: "center" },
  cellText: { fontSize: 13, fontWeight: "600" },
  flexChip: { borderRadius: 14, borderWidth: 1.5, paddingVertical: 13, alignItems: "center" },
  flexText: { fontSize: 14, fontWeight: "600" },
});
