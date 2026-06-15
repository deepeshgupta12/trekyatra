import type { ReactNode } from "react";
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { GlassSurface } from "@/components/ui/GlassSurface";

interface SearchBarProps {
  placeholder?: string;
  style?: ViewStyle;
}

export function SearchBar({ placeholder = "Search treks, regions, seasons…", style }: SearchBarProps) {
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.touchable, { shadowColor: isDark ? "#000" : "#1D3A2E" }, style]}
      activeOpacity={0.8}
      onPress={() => router.push("/(tabs)/browse/search" as never)}
      accessibilityRole="button"
      accessibilityLabel={placeholder}
    >
      <GlassSurface rounded="full" style={styles.bar}>
        <Ionicons name="search" size={18} color={colors.saffron} />
        <Text style={[styles.placeholder, { color: colors.textMuted }]} numberOfLines={1}>
          {placeholder}
        </Text>
      </GlassSurface>
    </TouchableOpacity>
  );
}

export function SearchBarWrapper({ children }: { children: ReactNode }) {
  return <View style={styles.wrapper}>{children}</View>;
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 20,
    zIndex: 2,
  },
  touchable: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  placeholder: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
