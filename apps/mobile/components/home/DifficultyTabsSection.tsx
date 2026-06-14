import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { TrekCard } from "@/components/trek/TrekCard";
import { useTheme } from "@/hooks/useTheme";
import { useDifficultyTreks } from "@/hooks/useDifficultyTreks";

const TABS = ["Easy", "Moderate", "Challenging"] as const;

export function DifficultyTabsSection() {
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Easy");

  const { data: filtered = [], isLoading } = useDifficultyTreks(activeTab);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.heading, { color: colors.textPrimary }]}>Treks by difficulty</Text>
        <TouchableOpacity onPress={() => router.push(`/(tabs)/browse?difficulty=${activeTab}` as never)}>
          <Text style={styles.viewAll}>View all →</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabRow}>
        {TABS.map((tab) => {
          const active = tab === activeTab;
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                {
                  backgroundColor: active
                    ? "#E8702A"
                    : isDark
                      ? "rgba(255,255,255,0.06)"
                      : "rgba(29,58,46,0.06)",
                  borderColor: active ? "#E8702A" : isDark ? "rgba(255,255,255,0.12)" : "rgba(29,58,46,0.15)",
                },
              ]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, { color: active ? "#fff" : colors.textSecondary }]}>{tab}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {isLoading ? (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>Loading…</Text>
      ) : filtered.length === 0 ? (
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>
          No {activeTab.toLowerCase()} treks to show right now.
        </Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          {filtered.map((trek) => (
            <TrekCard key={trek.slug} trek={trek} width={180} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 24, gap: 12 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  heading: { fontSize: 18, fontWeight: "700", fontFamily: "PlayfairDisplay_700Bold" },
  viewAll: { fontSize: 12, fontWeight: "600", color: "#E8702A" },
  tabRow: { flexDirection: "row", gap: 8, paddingHorizontal: 16 },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  tabText: { fontSize: 13, fontWeight: "600" },
  row: { paddingHorizontal: 16, paddingBottom: 4 },
  emptyText: { fontSize: 13, paddingHorizontal: 16 },
});
