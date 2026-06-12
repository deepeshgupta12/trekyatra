import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";

export function HomeSearchBar() {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity
        style={[
          styles.bar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: isDark ? "#000" : "#1D3A2E",
          },
        ]}
        activeOpacity={0.8}
        onPress={() => router.push("/(tabs)/browse/search" as never)}
        accessibilityRole="button"
        accessibilityLabel="Search treks, regions, seasons"
      >
        <Ionicons name="search" size={18} color={colors.saffron} />
        <Text style={[styles.placeholder, { color: colors.textMuted }]}>
          Search treks, regions, seasons…
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: -24,
    paddingHorizontal: 20,
    zIndex: 2,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  placeholder: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
});
