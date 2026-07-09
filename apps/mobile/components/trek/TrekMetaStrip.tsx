import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

interface TrekMetaStripProps {
  duration?: string | null;
  altitude?: string | null;
  difficulty?: string | null;
  season?: string | null;
}

type IconName = React.ComponentProps<typeof Ionicons>["name"];

interface Chip {
  icon: IconName;
  label: string;
  accentColor: string;
}

function difficultyAccent(d: string): string {
  switch (d.toLowerCase()) {
    case "easy": return "#22c55e";
    case "moderate": return "#f59e0b";
    case "challenging":
    case "difficult": return "#ef4444";
    default: return "#6b7280";
  }
}

export function TrekMetaStrip({ duration, altitude, difficulty, season }: TrekMetaStripProps) {
  const { isDark } = useTheme();

  const chips: Chip[] = [
    duration ? { icon: "time-outline", label: duration, accentColor: "#5298C9" } : null,
    altitude ? { icon: "trending-up-outline", label: altitude, accentColor: "#8B6914" } : null,
    difficulty
      ? { icon: "fitness-outline", label: difficulty, accentColor: difficultyAccent(difficulty) }
      : null,
    season ? { icon: "calendar-outline", label: season, accentColor: "#7C3AED" } : null,
  ].filter(Boolean) as Chip[];

  if (chips.length === 0) return null;

  const cardBg = isDark ? "rgba(255,255,255,0.05)" : "#ffffff";
  const cardBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";

  return (
    <View style={[styles.wrapper, { backgroundColor: isDark ? "#0c0e14" : "#f8f9fa", borderBottomColor: cardBorder, borderBottomWidth: 1 }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {chips.map((chip, i) => (
          <View
            key={i}
            style={[
              styles.chip,
              {
                backgroundColor: cardBg,
                borderColor: cardBorder,
              },
            ]}
          >
            <View style={[styles.iconWrap, { backgroundColor: chip.accentColor + "1A" }]}>
              <Ionicons name={chip.icon} size={14} color={chip.accentColor} />
            </View>
            <Text style={[styles.chipLabel, { color: isDark ? "rgba(255,255,255,0.85)" : "#1a1a1a" }]}>
              {chip.label}
            </Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingVertical: 12,
  },
  row: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 10,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
  },
  iconWrap: {
    width: 24,
    height: 24,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  chipLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
});
