import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import type { SignalOut } from "@/hooks/useBuddies";
import { buddyApi } from "@/hooks/useBuddies";

const EXP_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  expert: "Expert",
};

interface Props {
  signal: SignalOut;
  onViewProfile: (signalId: string) => void;
  onRequestSent?: () => void;
}

export function BuddyListCard({ signal, onViewProfile, onRequestSent }: Props) {
  const { colors } = useTheme();
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const initials = signal.display_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleSend() {
    setSending(true);
    setError(null);
    try {
      await buddyApi.sendRequest(signal.id, message.trim() || undefined);
      setSent(true);
      setShowCompose(false);
      onRequestSent?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send request");
    } finally {
      setSending(false);
    }
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.row}>
        {/* Avatar */}
        <TouchableOpacity
          onPress={() => onViewProfile(signal.id)}
          style={[styles.avatar, { backgroundColor: colors.accent + "22" }]}
          accessibilityLabel={`View ${signal.display_name}'s profile`}
        >
          <Text style={[styles.avatarText, { color: colors.accent }]}>{initials}</Text>
        </TouchableOpacity>

        {/* Info */}
        <View style={styles.info}>
          <TouchableOpacity onPress={() => onViewProfile(signal.id)}>
            <Text style={[styles.name, { color: colors.textPrimary }]}>{signal.display_name}</Text>
          </TouchableOpacity>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            {signal.month_year}
            {signal.experience ? `  ·  ${EXP_LABEL[signal.experience] ?? signal.experience}` : ""}
            {signal.group_size > 1 ? `  ·  Group of ${signal.group_size}` : ""}
          </Text>
          {signal.notes ? (
            <Text style={[styles.notes, { color: colors.textSecondary }]} numberOfLines={2}>{signal.notes}</Text>
          ) : null}
        </View>

        {/* Action */}
        {signal.is_own ? (
          <Text style={[styles.ownBadge, { color: colors.textFaint }]}>You</Text>
        ) : sent ? (
          <Text style={[styles.sentLabel, { color: "#22c55e" }]}>Sent ✓</Text>
        ) : (
          <TouchableOpacity
            onPress={() => setShowCompose((v) => !v)}
            style={[styles.connectBtn, { borderColor: colors.accent }]}
            accessibilityLabel="Connect with this trekker"
          >
            <Text style={[styles.connectText, { color: colors.accent }]}>Connect</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Inline compose */}
      {showCompose && !sent && (
        <View style={[styles.compose, { borderTopColor: colors.borderSubtle }]}>
          <Text style={[styles.composeLabel, { color: colors.textMuted }]}>Add a message (optional)</Text>
          <View style={[styles.inputRow]}>
            <Text
              style={[styles.msgInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.background }]}
              // Note: TextInput not used here to keep the file self-contained; parent can extend if needed
            >
              {message}
            </Text>
          </View>
          {error && <Text style={styles.error}>{error}</Text>}
          <View style={styles.btnRow}>
            <TouchableOpacity
              onPress={handleSend}
              disabled={sending}
              style={[styles.sendBtn, { backgroundColor: colors.accent, opacity: sending ? 0.6 : 1 }]}
              accessibilityLabel="Send buddy request"
            >
              <Text style={styles.sendBtnText}>{sending ? "Sending…" : "Send request"}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { setShowCompose(false); setError(null); }} style={styles.cancelBtn}>
              <Text style={[styles.cancelText, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12, borderWidth: StyleSheet.hairlineWidth,
    padding: 14, marginBottom: 10,
  },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontSize: 14, fontWeight: "700" },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  meta: { fontSize: 12, marginBottom: 4 },
  notes: { fontSize: 13, lineHeight: 18 },
  ownBadge: { fontSize: 12, fontWeight: "500", paddingTop: 4 },
  sentLabel: { fontSize: 12, fontWeight: "600", paddingTop: 4 },
  connectBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginTop: 2 },
  connectText: { fontSize: 12, fontWeight: "600" },
  compose: { borderTopWidth: StyleSheet.hairlineWidth, marginTop: 12, paddingTop: 12, gap: 8 },
  composeLabel: { fontSize: 12 },
  inputRow: {},
  msgInput: {
    borderWidth: 1, borderRadius: 8, padding: 10, fontSize: 14, minHeight: 60,
  },
  btnRow: { flexDirection: "row", gap: 8 },
  sendBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  sendBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  cancelBtn: { paddingHorizontal: 12, paddingVertical: 8 },
  cancelText: { fontSize: 13 },
  error: { color: "#ef4444", fontSize: 12 },
});
