import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { GlassSurface } from "@/components/ui/GlassSurface";

export function OperatorsCTACard() {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={0.85} onPress={() => router.push("/(tabs)/browse/operators" as never)} testID="operators-cta-card" accessibilityRole="button" accessibilityLabel="Browse trek operators">
        <GlassSurface rounded="lg" style={styles.card}>
          <View style={styles.iconWrap}>
            <Ionicons name="people-outline" size={22} color="#E8702A" />
          </View>
          <View style={styles.textWrap}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Book with trusted operators</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Verified trek operators across India, rated by trekkers.
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </GlassSurface>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 24, paddingHorizontal: 16 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(232,112,42,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  textWrap: { flex: 1, gap: 2 },
  title: { fontSize: 15, fontWeight: "700" },
  subtitle: { fontSize: 12, lineHeight: 16 },
});
