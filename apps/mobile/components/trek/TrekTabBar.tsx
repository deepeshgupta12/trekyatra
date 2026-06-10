import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";

export type TrekTab = "guide" | "packing" | "permits" | "costs";

const TABS: { key: TrekTab; label: string }[] = [
  { key: "guide", label: "Guide" },
  { key: "packing", label: "Packing" },
  { key: "permits", label: "Permits" },
  { key: "costs", label: "Costs" },
];

interface TrekTabBarProps {
  activeTab: TrekTab;
  onTabChange: (tab: TrekTab) => void;
}

export function TrekTabBar({ activeTab, onTabChange }: TrekTabBarProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: isDark ? "#14161f" : colors.surface, borderBottomColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }]}>
      {TABS.map((tab) => {
        const active = tab.key === activeTab;
        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.tab}
            onPress={() => onTabChange(tab.key)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.label,
                {
                  color: active ? "#E8702A" : colors.textMuted,
                  fontWeight: active ? "700" : "500",
                },
              ]}
            >
              {tab.label}
            </Text>
            {active && <View style={styles.indicator} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    borderBottomWidth: 1,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    position: "relative",
  },
  label: {
    fontSize: 13,
  },
  indicator: {
    position: "absolute",
    bottom: 0,
    left: "15%",
    right: "15%",
    height: 2,
    backgroundColor: "#E8702A",
    borderRadius: 2,
  },
});
