import { AppState, AppStateStatus } from "react-native";
import { syncContent } from "./syncService";

const SYNC_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

let lastForegroundSync = 0;
let subscription: ReturnType<typeof AppState.addEventListener> | null = null;
let getTokenFn: (() => string | null) | null = null;

export function initBackgroundSync(getAccessToken: () => string | null) {
  getTokenFn = getAccessToken;

  if (subscription) return; // already initialised

  subscription = AppState.addEventListener("change", handleAppStateChange);
}

export function destroyBackgroundSync() {
  subscription?.remove();
  subscription = null;
  getTokenFn = null;
}

function handleAppStateChange(nextState: AppStateStatus) {
  if (nextState !== "active") return;

  const now = Date.now();
  if (now - lastForegroundSync < SYNC_INTERVAL_MS) return;

  const token = getTokenFn?.();
  if (!token) return;

  lastForegroundSync = now;
  syncContent(token).catch(() => {
    // Sync errors are non-fatal — user can still read cached content
  });
}

export function triggerSyncNow(accessToken: string): Promise<import("./syncService").SyncResult> {
  lastForegroundSync = Date.now();
  return syncContent(accessToken);
}
