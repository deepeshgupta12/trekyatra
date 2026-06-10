import { View, Text, StyleSheet, ScrollView } from "react-native";
import { useTheme } from "@/hooks/useTheme";

interface TrekMetaStripProps {
  duration?: string | null;
  altitude?: string | null;
  difficulty?: string | null;
  season?: string | null;
}

interface Chip {
  icon: string;
  label: string;
  color: string;
}

function difficultyColor(d: string): string {
  switch (d.toLowerCase()) {
    case "easy": return "#1D3A2E";
    case "moderate": return "#d97706";
    case "challenging":
    case "difficult": return "#dc2626";
    default: return "#6b7280";
  }
}

export function TrekMetaStrip({ duration, altitude, difficulty, season }: TrekMetaStripProps) {
  const { colors } = useTheme();

  const chips: Chip[] = [
    duration ? { icon: "🕐", label: duration, color: "#5298C9" } : null,
    altitude ? { icon: "⛰", label: altitude, color: "#6B4929" } : null,
    difficulty
      ? { icon: "●", label: difficulty, color: difficultyColor(difficulty) }
      : null,
    season ? { icon: "❄️", label: season, color: "#5298C9" } : null,
  ].filter(Boolean) as Chip[];

  if (chips.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {chips.map((chip, i) => (
        <View
          key={i}
          style={[styles.chip, { backgroundColor: chip.color + "18", borderColor: chip.color + "40" }]}
        >
          <Text style={styles.chipIcon}>{chip.icon}</Text>
          <Text style={[styles.chipLabel, { color: chip.color }]}>{chip.label}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipIcon: {
    fontSize: 12,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
});
