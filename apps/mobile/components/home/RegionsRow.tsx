import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
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

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: colors.textPrimary }]}>Explore by Region</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {REGIONS.map((region) => (
          <TouchableOpacity
            key={region}
            style={[
              styles.chip,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(29,58,46,0.07)",
                borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(29,58,46,0.15)",
              },
            ]}
            activeOpacity={0.7}
            onPress={() => router.push(`/(tabs)/browse?region=${encodeURIComponent(region)}` as never)}
          >
            <Text style={[styles.chipText, { color: colors.textSecondary }]}>{region}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    gap: 10,
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
    paddingHorizontal: 16,
  },
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
});
