import { useEffect, useRef, useState } from "react";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import {
  getInbox,
  InboxNotification,
  markAllRead,
  saveToInbox,
} from "@/services/notificationService";

export function useNotifications() {
  const [inbox, setInbox] = useState<InboxNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [permissionStatus, setPermissionStatus] = useState<string>("undetermined");
  const router = useRouter();
  const notifListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    loadInbox();
    checkPermission();
    setupListeners();

    return () => {
      notifListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);

  async function loadInbox() {
    const items = await getInbox();
    setInbox(items);
    const unread = items.filter((n) => !n.read).length;
    setUnreadCount(unread);
  }

  async function checkPermission() {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
  }

  function setupListeners() {
    // Foreground notification received
    notifListener.current = Notifications.addNotificationReceivedListener(
      async (notification) => {
        await saveToInbox(notification);
        await loadInbox();
      }
    );

    // User tapped a notification (background or quit state)
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as Record<string, string>;
        if (data?.trek_slug) {
          router.push(`/(tabs)/(home)/trek/${data.trek_slug}` as never);
        } else if (data?.screen === "plan") {
          router.push("/(tabs)/plan" as never);
        }
      });
  }

  async function clearAll() {
    await markAllRead();
    await loadInbox();
  }

  return {
    inbox,
    unreadCount,
    permissionStatus,
    clearAll,
    reload: loadInbox,
  };
}
