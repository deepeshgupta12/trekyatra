import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

interface Feature {
  label: string;
  free: boolean;
  premium: boolean;
}

const FEATURES: Feature[] = [
  { label: "Browse all treks", free: true, premium: true },
  { label: "AI trek recommendations", free: true, premium: true },
  { label: "TrekSage Q&A", free: true, premium: true },
  { label: "Offline trek guides (250+ treks)", free: false, premium: true },
  { label: "Download digital products", free: true, premium: true },
  { label: "Priority TrekSage responses", free: false, premium: true },
  { label: "Permit alert notifications", free: false, premium: true },
  { label: "Early access to new routes", free: false, premium: true },
  { label: "Monthly curated trek calendar", free: false, premium: true },
  { label: "Ad-free experience", free: false, premium: true },
];

export function PremiumFeatureList() {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={[styles.colHeader, { color: colors.textSecondary, flex: 1 }]}>Feature</Text>
        <Text style={[styles.colHeader, { color: colors.textSecondary }]}>Free</Text>
        <Text style={[styles.colHeader, { color: colors.accent }]}>Premium</Text>
      </View>
      {FEATURES.map((f, i) => (
        <View
          key={f.label}
          style={[
            styles.row,
            { borderBottomColor: colors.border },
            i === FEATURES.length - 1 && { borderBottomWidth: 0 },
          ]}
        >
          <Text style={[styles.label, { color: colors.textPrimary, flex: 1 }]}>{f.label}</Text>
          <View style={styles.checkCell}>
            {f.free ? (
              <Ionicons name="checkmark-circle" size={18} color={colors.textSecondary} />
            ) : (
              <Ionicons name="remove-circle-outline" size={18} color={colors.textMuted} />
            )}
          </View>
          <View style={styles.checkCell}>
            {f.premium ? (
              <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
            ) : (
              <Ionicons name="remove-circle-outline" size={18} color={colors.textMuted} />
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  colHeader: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    width: 56,
    textAlign: "center",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  label: {
    fontSize: 14,
  },
  checkCell: {
    width: 56,
    alignItems: "center",
  },
});
