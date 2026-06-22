import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import type { PremiumPurchaseStatus } from "@/hooks/usePremium";
import type { IAPProductId } from "@/services/iapService";

interface SubscribeButtonProps {
  productId: IAPProductId;
  localizedPrice?: string;
  interval: "monthly" | "annual";
  status: PremiumPurchaseStatus;
  onPress: (productId: IAPProductId) => void;
  selected?: boolean;
}

const BUSY_STATES: PremiumPurchaseStatus[] = ["purchasing", "verifying", "restoring", "initializing"];

export function SubscribeButton({
  productId,
  localizedPrice,
  interval,
  status,
  onPress,
  selected = false,
}: SubscribeButtonProps) {
  const { colors } = useTheme();
  const isBusy = BUSY_STATES.includes(status);
  const isDone = status === "done";

  const label =
    isDone
      ? "Subscribed!"
      : isBusy
      ? status === "verifying" ? "Verifying…" : "Processing…"
      : localizedPrice
      ? `${localizedPrice} / ${interval === "annual" ? "year" : "month"}`
      : `Subscribe ${interval === "annual" ? "annually" : "monthly"}`;

  return (
    <TouchableOpacity
      onPress={() => !isBusy && !isDone && onPress(productId)}
      activeOpacity={0.8}
      style={[
        styles.button,
        selected && { borderWidth: 2, borderColor: colors.accent },
        isDone && { backgroundColor: colors.pine ?? "#1D3A2E" },
      ]}
    >
      <View style={[styles.fill, { backgroundColor: colors.accent }]}>
        {isBusy ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : isDone ? (
          <Ionicons name="checkmark-circle" size={20} color="#fff" style={styles.icon} />
        ) : (
          <Ionicons name="star" size={16} color="#fff" style={styles.icon} />
        )}
        <Text style={styles.label}>{label}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: 14,
    overflow: "hidden",
  },
  fill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
  },
  icon: {
    marginRight: 2,
  },
  label: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
