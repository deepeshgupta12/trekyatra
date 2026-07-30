import { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { useExploreStore } from "@/stores/exploreStore";
import { FilterSheet } from "@/components/browse/FilterSheet";
import { GlassSurface } from "@/components/ui/GlassSurface";

export function FilterChips() {
  const { colors } = useTheme();
  const [sheetVisible, setSheetVisible] = useState(false);
  const { trekState, trekDifficulty, trekSeason, durationBucket, setTrekState, setTrekDifficulty, setTrekSeason, setDurationBucket, clearAll, sheetOpenNonce } =
    useExploreStore();

  // Open the sheet when a Home quick-filter chip requests it (nonce bump).
  useEffect(() => {
    if (sheetOpenNonce > 0) setSheetVisible(true);
  }, [sheetOpenNonce]);

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
        {/* Prominent Filter button — always visible, fills with saffron when filters active */}
        <TouchableOpacity
          style={[
            styles.filterBtn,
            {
              backgroundColor: hasActive ? colors.saffron : `${colors.saffron}22`,
              borderColor: colors.saffron,
            },
          ]}
          activeOpacity={0.7}
          onPress={() => setSheetVisible(true)}
        >
          <Ionicons name="options-outline" size={15} color={hasActive ? "#fff" : colors.saffron} />
          <Text style={[styles.filterBtnText, { color: hasActive ? "#fff" : colors.saffron }]}>
            {hasActive ? `Filters (${activeChips.length})` : "Filter Treks"}
          </Text>
        </TouchableOpacity>

        {activeChips.map((chip) => (
          <TouchableOpacity key={chip.key} activeOpacity={0.7} onPress={chip.onClear}>
            <GlassSurface rounded="xl" style={styles.chip}>
              <Text style={[styles.chipText, { color: colors.textSecondary }]}>{chip.label}</Text>
              <Ionicons name="close" size={14} color={colors.textMuted} />
            </GlassSurface>
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
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  filterBtnText: {
    fontSize: 13,
    fontWeight: "700",
    fontFamily: "Inter_600SemiBold",
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
