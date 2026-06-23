import { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationRow } from "@/components/notifications/NotificationRow";

export default function NotificationsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { inbox, unreadCount, clearAll, reload } = useNotifications();

  useEffect(() => {
    reload();
  }, []);

  function handleNotificationPress(slug?: string) {
    if (slug) {
      router.push(`/(tabs)/(home)/trek/${slug}` as never);
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { borderBottomColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" },
        ]}
      >
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={10}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={clearAll} style={styles.markReadBtn}>
            <Text style={[styles.markReadText, { color: "#E8702A" }]}>Mark all read</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.markReadBtn} />
        )}
      </View>

      {/* Notification list */}
      {inbox.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="notifications-off-outline" size={48} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
            No notifications yet
          </Text>
          <Text style={[styles.emptySubtitle, { color: colors.textMuted }]}>
            We'll let you know about permit windows, seasonal alerts, and trek updates.
          </Text>
        </View>
      ) : (
        <FlatList
          data={inbox}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <NotificationRow
              item={item}
              onPress={() => handleNotificationPress(item.data?.trek_slug)}
            />
          )}
          contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
  },
  markReadBtn: { minWidth: 80, alignItems: "flex-end" },
  markReadText: { fontSize: 13, fontWeight: "600" },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: { fontSize: 17, fontWeight: "600", textAlign: "center" },
  emptySubtitle: { fontSize: 13, lineHeight: 20, textAlign: "center" },
});
