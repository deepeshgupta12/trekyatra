import { useState, useEffect } from "react";
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, Pressable } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { useFilterFacets } from "@/hooks/useFilterFacets";
import { useExploreStore, DURATION_BUCKETS, type DurationBucket } from "@/stores/exploreStore";
import { GlassSurface } from "@/components/ui/GlassSurface";

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
}

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors, isDark } = useTheme();
  return (
    <TouchableOpacity
      style={[
        styles.chip,
        {
          backgroundColor: selected
            ? colors.saffron + "22"
            : isDark ? "rgba(255,255,255,0.06)" : "rgba(29,58,46,0.06)",
          borderColor: selected ? colors.saffron : colors.border,
        },
      ]}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <Text style={[styles.chipText, { color: selected ? colors.saffron : colors.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export function FilterSheet({ visible, onClose }: FilterSheetProps) {
  const { colors } = useTheme();
  const { facets } = useFilterFacets();
  const store = useExploreStore();

  const [draftState, setDraftState] = useState(store.trekState);
  const [draftDifficulty, setDraftDifficulty] = useState(store.trekDifficulty);
  const [draftSeason, setDraftSeason] = useState(store.trekSeason);
  const [draftSuitability, setDraftSuitability] = useState(store.trekSuitability);
  const [draftDuration, setDraftDuration] = useState<DurationBucket | null>(store.durationBucket);

  useEffect(() => {
    if (visible) {
      setDraftState(store.trekState);
      setDraftDifficulty(store.trekDifficulty);
      setDraftSeason(store.trekSeason);
      setDraftSuitability(store.trekSuitability);
      setDraftDuration(store.durationBucket);
    }
  }, [visible, store.trekState, store.trekDifficulty, store.trekSeason, store.trekSuitability, store.durationBucket]);

  const handleApply = () => {
    store.setTrekState(draftState);
    store.setTrekDifficulty(draftDifficulty);
    store.setTrekSeason(draftSeason);
    store.setTrekSuitability(draftSuitability);
    store.setDurationBucket(draftDuration);
    onClose();
  };

  const handleClearAll = () => {
    setDraftState(null);
    setDraftDifficulty(null);
    setDraftSeason(null);
    setDraftSuitability(null);
    setDraftDuration(null);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <GlassSurface rounded="none" bordered={false} style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>Filters</Text>
        <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
          <Text style={[styles.section, { color: colors.textMuted }]}>Region</Text>
          <View style={styles.row}>
            {facets.states.map((state) => (
              <Chip
                key={state}
                label={state}
                selected={draftState === state}
                onPress={() => setDraftState(draftState === state ? null : state)}
              />
            ))}
          </View>

          <Text style={[styles.section, { color: colors.textMuted }]}>Difficulty</Text>
          <View style={styles.row}>
            {facets.difficulties.map((difficulty) => (
              <Chip
                key={difficulty}
                label={difficulty}
                selected={draftDifficulty === difficulty}
                onPress={() => setDraftDifficulty(draftDifficulty === difficulty ? null : difficulty)}
              />
            ))}
          </View>

          <Text style={[styles.section, { color: colors.textMuted }]}>Season</Text>
          <View style={styles.row}>
            {facets.seasons.map((season) => (
              <Chip
                key={season}
                label={season}
                selected={draftSeason === season}
                onPress={() => setDraftSeason(draftSeason === season ? null : season)}
              />
            ))}
          </View>

          {facets.suitabilities.length > 0 && (
            <>
              <Text style={[styles.section, { color: colors.textMuted }]}>Suitability</Text>
              <View style={styles.row}>
                {facets.suitabilities.map((suitability) => (
                  <Chip
                    key={suitability}
                    label={suitability}
                    selected={draftSuitability === suitability}
                    onPress={() => setDraftSuitability(draftSuitability === suitability ? null : suitability)}
                  />
                ))}
              </View>
            </>
          )}

          <Text style={[styles.section, { color: colors.textMuted }]}>Duration</Text>
          <View style={styles.row}>
            {DURATION_BUCKETS.map((bucket) => (
              <Chip
                key={bucket.label}
                label={bucket.label}
                selected={draftDuration?.label === bucket.label}
                onPress={() => setDraftDuration(draftDuration?.label === bucket.label ? null : bucket)}
              />
            ))}
          </View>
        </ScrollView>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.clearButton} onPress={handleClearAll}>
            <Text style={[styles.clearText, { color: colors.textSecondary }]}>Clear all</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.applyButton, { backgroundColor: colors.saffron }]}
            onPress={handleApply}
          >
            <Text style={styles.applyText}>Apply</Text>
          </TouchableOpacity>
        </View>
      </GlassSurface>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingHorizontal: 16,
    paddingBottom: 24,
    maxHeight: "80%",
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(150,150,150,0.4)",
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
    marginBottom: 12,
  },
  body: {
    maxHeight: 420,
  },
  section: {
    fontSize: 12,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 16,
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(150,150,150,0.3)",
  },
  clearText: {
    fontSize: 14,
    fontWeight: "600",
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 999,
  },
  applyText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#ffffff",
  },
});
