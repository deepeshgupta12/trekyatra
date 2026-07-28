import { Modal, View, Text, TouchableOpacity, StyleSheet, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import type { VersionGateDecision } from "@/lib/version";

interface Props {
  decision: VersionGateDecision;
  /** Provided only for soft updates (dismissible). Force/maintenance can't be dismissed. */
  onDismiss?: () => void;
}

export function UpdateGateOverlay({ decision, onDismiss }: Props) {
  const { colors } = useTheme();
  const isMaintenance = decision.status === "maintenance";
  const isForce = decision.status === "force_update";
  const blocking = isMaintenance || isForce;

  const title = isMaintenance ? "Under maintenance" : isForce ? "Update required" : "Update available";
  const body = isMaintenance
    ? decision.maintenance_message ??
      "TrekYatra is briefly unavailable while we make improvements. Please check back shortly."
    : decision.update_message ??
      `A new version of TrekYatra (${decision.latest_version}) is available. Update for the latest treks and fixes.`;
  const icon = isMaintenance ? "construct-outline" : "cloud-download-outline";

  const openStore = () => {
    if (decision.store_url) Linking.openURL(decision.store_url).catch(() => {});
  };

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent onRequestClose={blocking ? undefined : onDismiss}>
      <View style={[styles.backdrop, { backgroundColor: blocking ? colors.background : "rgba(0,0,0,0.45)" }]}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
            !blocking && styles.cardSheet,
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: colors.accent + "1A" }]}>
            <Ionicons name={icon} size={30} color={colors.accent} />
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>{body}</Text>

          {!isMaintenance && (
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: colors.accent }]}
              onPress={openStore}
              accessibilityRole="button"
              accessibilityLabel="Update TrekYatra on the App Store"
            >
              <Text style={styles.primaryBtnText}>Update Now</Text>
            </TouchableOpacity>
          )}

          {decision.status === "soft_update" && onDismiss && (
            <TouchableOpacity style={styles.laterBtn} onPress={onDismiss} accessibilityRole="button">
              <Text style={[styles.laterText, { color: colors.textMuted }]}>Later</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 28,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 22,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    gap: 12,
  },
  cardSheet: {
    // soft prompt sits lower like a sheet rather than dead-centre
    marginTop: "auto",
    marginBottom: 24,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
  },
  primaryBtn: {
    marginTop: 6,
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "700",
    fontFamily: "Inter_600SemiBold",
  },
  laterBtn: {
    paddingVertical: 8,
  },
  laterText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
