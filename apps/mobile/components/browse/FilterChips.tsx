import { useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useExploreStore } from "@/stores/exploreStore";
import { FilterSheet } from "@/components/browse/FilterSheet";

export function FilterChips() {
  const { colors, isDark } = useTheme();
  const [sheetVisible, setSheetVisible] = useState(false);
  const { trekState, trekDifficulty, trekSeason, durationBucket, setTrekState, setTrekDifficulty, setTrekSeason, setDurationBucket, clearAll } =
    useExploreStore();

  const activeChips: { key: string; label: string; onClear: () => void }[] = [];
  if (trekState) activeChips.push({ key: "state", label: trekState, onClear: () => setTrekState(null) });
  if (trekDifficulty) activeChips.push({ key: "difficulty", label: trekDifficulty, onClear: () => setTrekDifficulty(null) });
  if (trekSeason) activeChips.push({ key: "season", label: trekSeason, onClear: () => setTrekSeason(null) });
  if (durationBucket) activeChips.push({ key: "duration", label: durationBucket.label, onClear: () => setDurationBucket(null) });

  const hasActive = activeChips.length > 0;

  return (
    <>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        <TouchableOpacity
          style={[
            styles.filterChip,
            {
              backgroundColor: hasActive ? colors.saffron + "22" : (isDark ? "rgba(255,255,255,0.06)" : "rgba(29,58,46,0.06)"),
              borderColor: hasActive ? colors.saffron : colors.border,
            },
          ]}
          activeOpacity={0.7}
          onPress={() => setSheetVisible(true)}
        >
          <Ionicons name="options-outline" size={14} color={hasActive ? colors.saffron : colors.textSecondary} />
          <Text style={[styles.chipText, { color: hasActive ? colors.saffron : colors.textSecondary }]}>
            Filters
          </Text>
        </TouchableOpacity>

        {activeChips.map((chip) => (
          <TouchableOpacity
            key={chip.key}
            style={[
              styles.chip,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(29,58,46,0.06)",
                borderColor: colors.border,
              },
            ]}
            activeOpacity={0.7}
            onPress={chip.onClear}
          >
            <Text style={[styles.chipText, { color: colors.textSecondary }]}>{chip.label}</Text>
            <Ionicons name="close" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

        {hasActive && (
          <TouchableOpacity style={styles.clearAll} activeOpacity={0.7} onPress={clearAll}>
            <Text style={[styles.clearAllText, { color: colors.textMuted }]}>Clear all</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <FilterSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: "center",
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  clearAll: {
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
