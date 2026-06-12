import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

interface TrustSignalsProps {
  publishedAt?: string | null;
  updatedAt?: string | null;
  authorName?: string;
  factChecked?: boolean;
}

function formatDate(d: string): string {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function TrustSignals({
  publishedAt,
  updatedAt,
  authorName = "TrekYatra Editorial",
  factChecked = true,
}: TrustSignalsProps) {
  const { colors, isDark } = useTheme();
  const dateStr = updatedAt ?? publishedAt;

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(29,58,46,0.04)",
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(29,58,46,0.08)",
        },
      ]}
    >
      {dateStr && (
        <View style={styles.item}>
          <Ionicons name="calendar-outline" size={14} color="#E8702A" />
          <Text style={[styles.text, { color: colors.textSecondary }]}>
            {updatedAt ? `Updated ${formatDate(updatedAt)}` : `Published ${formatDate(dateStr)}`}
          </Text>
        </View>
      )}
      <View style={styles.item}>
        <Ionicons name="person-outline" size={14} color="#E8702A" />
        <Text style={[styles.text, { color: colors.textSecondary }]}>{authorName}</Text>
      </View>
      {factChecked && (
        <View style={styles.item}>
          <Ionicons name="shield-checkmark-outline" size={14} color="#2F9E5F" />
          <Text style={[styles.text, { color: "#2F9E5F" }]}>Fact-checked</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: "500",
  },
});
