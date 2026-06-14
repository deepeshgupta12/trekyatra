import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { TrekCard } from "@/components/trek/TrekCard";
import { useRegionTreks } from "@/hooks/useRegionTreks";
import { useTheme } from "@/hooks/useTheme";

const REGIONS = [
  "Himachal Pradesh",
  "Uttarakhand",
  "Jammu & Kashmir",
  "Sikkim",
  "Ladakh",
  "Maharashtra",
  "Rajasthan",
  "Karnataka",
];

export function RegionsRow() {
  const { colors, isDark } = useTheme();
  const [activeRegion, setActiveRegion] = useState(REGIONS[0]);
  const { data: treks = [], isLoading } = useRegionTreks(activeRegion);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.heading, { color: colors.textPrimary }]}>Explore by Region</Text>
        <TouchableOpacity
          onPress={() => router.push(`/(tabs)/browse?region=${encodeURIComponent(activeRegion)}` as never)}
        >
          <Text style={styles.viewAll}>View all →</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {REGIONS.map((region) => {
          const active = region === activeRegion;
          return (
            <TouchableOpacity
              key={region}
              style={[
                styles.chip,
                {
                  backgroundColor: active
                    ? "#E8702A"
                    : isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(29,58,46,0.07)",
                  borderColor: active ? "#E8702A" : isDark ? "rgba(255,255,255,0.12)" : "rgba(29,58,46,0.15)",
                },
              ]}
              activeOpacity={0.7}
              onPress={() => setActiveRegion(region)}
            >
              <Text style={[styles.chipText, { color: active ? "#fff" : colors.textSecondary }]}>{region}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {isLoading ? (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>Loading…</Text>
      ) : treks.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          No treks for {activeRegion} yet.
        </Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {treks.map((trek) => (
            <TrekCard key={trek.slug} trek={trek} width={180} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
  },
  viewAll: { fontSize: 12, fontWeight: "600", color: "#E8702A" },
  row: {
    paddingHorizontal: 16,
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
  emptyText: { fontSize: 13, paddingHorizontal: 16 },
});
