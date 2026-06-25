import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useBuddyRequests } from "@/hooks/useBuddies";
import type { BuddyRequestOut } from "@/hooks/useBuddies";

interface Props {
  visible: boolean;
  onClose: () => void;
  onOpenChat: (req: BuddyRequestOut) => void;
  onViewProfile: (signalId: string) => void;
}

type Tab = "received" | "sent";

const STATUS_COLOR: Record<string, string> = {
  pending: "#f59e0b",
  accepted: "#22c55e",
  rejected: "#6b7280",
};

function RequestCard({
  req,
  perspective,
  onRespond,
  onOpenChat,
  onViewProfile,
  colors,
}: {
  req: BuddyRequestOut;
  perspective: Tab;
  onRespond: (id: string, action: "accept" | "reject") => Promise<void>;
  onOpenChat: (req: BuddyRequestOut) => void;
  onViewProfile: (signalId: string) => void;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  const initials = req.other_party_name.slice(0, 2).toUpperCase();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.cardRow}>
        {/* Avatar */}
        <TouchableOpacity
          onPress={() => onViewProfile(req.signal.id)}
          style={[styles.avatar, { backgroundColor: colors.accent + "22" }]}
          accessibilityLabel={`View ${req.other_party_name}'s profile`}
        >
          <Text style={[styles.avatarText, { color: colors.accent }]}>{initials}</Text>
        </TouchableOpacity>

        {/* Details */}
        <View style={styles.cardInfo}>
          <TouchableOpacity onPress={() => onViewProfile(req.signal.id)}>
            <Text style={[styles.partyName, { color: colors.textPrimary }]}>{req.other_party_name}</Text>
          </TouchableOpacity>
          <Text style={[styles.cardMeta, { color: colors.textMuted }]}>
            {req.trek_slug.replace(/-/g, " ")} · {req.month_year}
          </Text>
          {req.message ? (
            <Text style={[styles.cardMsg, { color: colors.textSecondary }]} numberOfLines={2}>
              &ldquo;{req.message}&rdquo;
            </Text>
          ) : null}
        </View>

        {/* Status badge */}
        <View style={[styles.badge, { backgroundColor: STATUS_COLOR[req.status] + "20" }]}>
          <Text style={[styles.badgeText, { color: STATUS_COLOR[req.status] }]}>
            {req.status}
          </Text>
        </View>
      </View>

      {/* Actions */}
      {perspective === "received" && req.status === "pending" && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={() => onRespond(req.id, "accept")}
            style={[styles.acceptBtn, { backgroundColor: colors.accent }]}
            accessibilityLabel="Accept buddy request"
          >
            <Text style={styles.acceptText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => onRespond(req.id, "reject")}
            style={[styles.declineBtn, { borderColor: colors.border }]}
            accessibilityLabel="Decline buddy request"
          >
            <Text style={[styles.declineText, { color: colors.textMuted }]}>Decline</Text>
          </TouchableOpacity>
        </View>
      )}

      {req.status === "accepted" && (
        <TouchableOpacity
          onPress={() => onOpenChat(req)}
          style={[styles.chatBtn, { borderColor: colors.border }]}
          accessibilityLabel="Open chat"
        >
          <Text style={[styles.chatBtnText, { color: colors.accent }]}>Open Chat →</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function BuddyRequestSheet({ visible, onClose, onOpenChat, onViewProfile }: Props) {
  const { colors } = useTheme();
  const { received, sent, loading, respond, pendingCount } = useBuddyRequests();
  const [tab, setTab] = useState<Tab>("received");

  const current = tab === "received" ? received : sent;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Buddy Requests</Text>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
            <Text style={[styles.done, { color: colors.accent }]}>Done</Text>
          </TouchableOpacity>
        </View>

        {/* Tabs */}
        <View style={[styles.tabRow, { borderBottomColor: colors.border }]}>
          {(["received", "sent"] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              style={[styles.tab, tab === t && { borderBottomColor: colors.accent, borderBottomWidth: 2 }]}
              accessibilityLabel={`${t} requests`}
            >
              <Text style={[styles.tabText, { color: tab === t ? colors.accent : colors.textMuted }]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {t === "received" && pendingCount > 0 ? ` (${pendingCount})` : ""}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : current.length === 0 ? (
          <View style={styles.center}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {tab === "received"
                ? "No requests yet. Post a signal on a trek page to start receiving them."
                : "You haven't sent any requests yet."}
            </Text>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {current.map((req) => (
              <RequestCard
                key={req.id}
                req={req}
                perspective={tab}
                onRespond={respond}
                onOpenChat={onOpenChat}
                onViewProfile={onViewProfile}
                colors={colors}
              />
            ))}
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 17, fontWeight: "700" },
  done: { fontSize: 15, fontWeight: "600" },
  tabRow: {
    flexDirection: "row", borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1, paddingVertical: 12, alignItems: "center",
  },
  tabText: { fontSize: 14, fontWeight: "600" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 22 },
  list: { padding: 14, gap: 10 },
  card: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 14 },
  cardRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 14, fontWeight: "700" },
  cardInfo: { flex: 1 },
  partyName: { fontSize: 14, fontWeight: "600" },
  cardMeta: { fontSize: 12, marginTop: 2 },
  cardMsg: { fontSize: 13, marginTop: 4, fontStyle: "italic" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },
  actionRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  acceptBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 8 },
  acceptText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  declineBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  declineText: { fontSize: 13 },
  chatBtn: { marginTop: 10, paddingVertical: 8, borderRadius: 8, borderWidth: 1, alignItems: "center" },
  chatBtnText: { fontSize: 13, fontWeight: "600" },
});
