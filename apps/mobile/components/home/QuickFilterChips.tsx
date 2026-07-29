import { ScrollView, TouchableOpacity, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

export interface QuickFilterChip {
  key: string;
  label: string;
  icon?: keyof typeof Ionicons.glyphMap;
  active?: boolean;
}

interface QuickFilterChipsProps {
  chips: QuickFilterChip[];
  onPress: (key: string) => void;
  testID?: string;
}

/**
 * Redesign (v1.1) quick-filter entry chips (Difficulty / Length / Elevation gain).
 * Presentational + horizontally scrollable; the parent maps a key to its filter action.
 * Active chips render solid saffron per the design-system legibility rule (selected =
 * solid accent, never glassed).
 */
export function QuickFilterChips({ chips, onPress, testID }: QuickFilterChipsProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      testID={testID ?? "quick-filter-chips"}
    >
      {chips.map((chip) => {
        const active = chip.active ?? false;
        return (
          <TouchableOpacity
            key={chip.key}
            onPress={() => onPress(chip.key)}
            activeOpacity={0.8}
            style={[
              styles.chip,
              {
                backgroundColor: active ? colors.accent : colors.surface,
                borderColor: active ? colors.accent : colors.border,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Filter by ${chip.label}`}
            testID={`quick-filter-${chip.key}`}
          >
            {chip.icon ? (
              <Ionicons name={chip.icon} size={13} color={active ? "#fff" : colors.textSecondary} />
            ) : null}
            <Text style={[styles.label, { color: active ? "#fff" : colors.textPrimary }]}>
              {chip.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingRight: 16 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  label: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
});
