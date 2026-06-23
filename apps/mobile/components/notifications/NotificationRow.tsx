import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import type { InboxNotification } from "@/services/notificationService";

const CATEGORY_ICONS: Record<string, React.ComponentProps<typeof Ionicons>["name"]> = {
  permit_alert: "document-text-outline",
  trek_condition: "warning-outline",
  seasonal_alert: "calendar-outline",
  news_article: "newspaper-outline",
  plan_followup: "map-outline",
  admin_broadcast: "megaphone-outline",
};

function formatTs(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

interface Props {
  item: InboxNotification;
  onPress?: () => void;
}

export function NotificationRow({ item, onPress }: Props) {
  const { colors, isDark } = useTheme();
  const iconName = CATEGORY_ICONS[item.data?.category ?? ""] ?? "notifications-outline";
  const unread = !item.read;

  return (
    <TouchableOpacity
      style={[
        styles.row,
        {
          backgroundColor: unread
            ? isDark ? "rgba(232,112,42,0.07)" : "rgba(232,112,42,0.04)"
            : "transparent",
          borderBottomColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.iconBadge,
          { backgroundColor: isDark ? "rgba(232,112,42,0.15)" : "rgba(232,112,42,0.1)" },
        ]}
      >
        <Ionicons name={iconName} size={18} color="#E8702A" />
      </View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, { color: colors.textPrimary }]}
            numberOfLines={1}
          >
            {item.title}
          </Text>
          {unread && <View style={styles.unreadDot} />}
        </View>
        <Text
          style={[styles.body, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {item.body}
        </Text>
        <Text style={[styles.time, { color: colors.textMuted }]}>
          {formatTs(item.receivedAt)}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  iconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 2,
  },
  content: { flex: 1 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 3,
  },
  title: { fontSize: 14, fontWeight: "600", flex: 1 },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#E8702A",
    flexShrink: 0,
  },
  body: { fontSize: 13, lineHeight: 18 },
  time: { fontSize: 11, marginTop: 4 },
});
