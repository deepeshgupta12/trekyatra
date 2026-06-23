/**
 * Push notification service (M14).
 * Handles permission requests, device token registration, and notification
 * handling for foreground/background/quit states.
 *
 * Requires a development build (not Expo Go) + Firebase project for real push tokens.
 * Gracefully falls back to no-op when running in Expo Go / simulator.
 */
import * as Notifications from "expo-notifications";
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiPost } from "@/lib/mobileApi";
import { getOrCreateDeviceId } from "@/lib/authStorage";

const OPEN_COUNT_KEY = "ty_app_open_count";
const INBOX_KEY = "ty_notification_inbox";
const MAX_INBOX = 50;

export interface InboxNotification {
  id: string;
  title: string;
  body: string;
  data: Record<string, string>;
  receivedAt: number;
  read: boolean;
}

// Show banner + sound + badge for foreground notifications (expo-notifications v56+)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/** Increment app open count. Returns the new count. */
export async function incrementOpenCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(OPEN_COUNT_KEY);
    const count = (raw ? parseInt(raw, 10) : 0) + 1;
    await AsyncStorage.setItem(OPEN_COUNT_KEY, String(count));
    return count;
  } catch {
    return 1;
  }
}

/**
 * Request push permission and register native device token with the backend.
 * Token is stored on the MobileDevice row via POST /api/v1/mobile/device.
 * Only called on second app open to avoid immediate permission prompt dismissal.
 */
export async function requestAndRegisterPushToken(): Promise<string | null> {
  // Push tokens only work in native builds (not Expo Go simulator)
  if (Constants.executionEnvironment === ExecutionEnvironment.StoreClient) {
    console.log("[push] Skipping — Expo Go / simulator does not support push tokens");
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("[push] Permission denied");
      return null;
    }

    // Get native device token (FCM for Android, APNs for iOS)
    const { data: nativeToken } = await Notifications.getDevicePushTokenAsync();
    const deviceId = await getOrCreateDeviceId();

    // Register with backend — updates fcm_token / apns_token on the MobileDevice row
    await apiPost("/api/v1/mobile/device", {
      device_id: deviceId,
      platform: Platform.OS,
      fcm_token: Platform.OS === "android" ? nativeToken : null,
      apns_token: Platform.OS === "ios" ? nativeToken : null,
    });

    // Also get Expo push token for Expo notification service (optional)
    try {
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ??
        Constants.easConfig?.projectId;
      const { data: expoPushToken } = await Notifications.getExpoPushTokenAsync(
        projectId ? { projectId } : {}
      );
      return expoPushToken;
    } catch {
      return nativeToken;
    }
  } catch (err) {
    console.warn("[push] Token registration failed:", err);
    return null;
  }
}

/** Save a received notification to the local inbox. */
export async function saveToInbox(
  notification: Notifications.Notification
): Promise<void> {
  try {
    const content = notification.request.content;
    const item: InboxNotification = {
      id: notification.request.identifier,
      title: content.title ?? "TrekYatra",
      body: content.body ?? "",
      data: (content.data as Record<string, string>) ?? {},
      receivedAt: Date.now(),
      read: false,
    };

    const raw = await AsyncStorage.getItem(INBOX_KEY);
    const inbox: InboxNotification[] = raw ? JSON.parse(raw) : [];
    const updated = [item, ...inbox.filter((n) => n.id !== item.id)].slice(
      0,
      MAX_INBOX
    );
    await AsyncStorage.setItem(INBOX_KEY, JSON.stringify(updated));
    await Notifications.setBadgeCountAsync(updated.filter((n) => !n.read).length);
  } catch {
    // Non-critical
  }
}

/** Return all inbox notifications. */
export async function getInbox(): Promise<InboxNotification[]> {
  try {
    const raw = await AsyncStorage.getItem(INBOX_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Mark all notifications as read and reset badge to 0. */
export async function markAllRead(): Promise<void> {
  try {
    const inbox = await getInbox();
    const updated = inbox.map((n) => ({ ...n, read: true }));
    await AsyncStorage.setItem(INBOX_KEY, JSON.stringify(updated));
    await Notifications.setBadgeCountAsync(0);
  } catch {
    // Non-critical
  }
}

/** Return unread notification count. */
export async function getUnreadCount(): Promise<number> {
  const inbox = await getInbox();
  return inbox.filter((n) => !n.read).length;
}
