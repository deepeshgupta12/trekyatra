import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

export interface TrekCategory {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  /** Icon tint + soft circle background base (a brand-adjacent hue). */
  tint: string;
}

interface CategoryRowProps {
  categories: TrekCategory[];
  onPress: (key: string) => void;
  testID?: string;
}

/**
 * Redesign (v1.1) Explore "Categories" — an illustrated terrain/collection row. Presentational:
 * the parent maps a key to a real navigable filter (region / season / difficulty route). Brand
 * hues, soft tinted circles.
 */
export function CategoryRow({ categories, onPress, testID }: CategoryRowProps) {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      testID={testID ?? "category-row"}
    >
      {categories.map((cat) => (
        <TouchableOpacity
          key={cat.key}
          style={styles.item}
          activeOpacity={0.8}
          onPress={() => onPress(cat.key)}
          accessibilityRole="button"
          accessibilityLabel={`${cat.label} treks`}
          testID={`category-${cat.key}`}
        >
          <View style={[styles.circle, { backgroundColor: cat.tint + "1F", borderColor: colors.border }]}>
            <Ionicons name={cat.icon} size={22} color={cat.tint} />
          </View>
          <Text style={[styles.label, { color: colors.textPrimary }]} numberOfLines={1}>{cat.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 16, paddingHorizontal: 16, paddingVertical: 2 },
  item: { alignItems: "center", width: 62, gap: 6 },
  circle: {
    width: 58,
    height: 58,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  label: { fontSize: 10.5, fontWeight: "600", fontFamily: "Inter_600SemiBold", textAlign: "center" },
});
