/**
 * Mobile version gate — talks to GET /api/v1/app/version-config, which returns a
 * server-computed decision (ok / soft_update / force_update / maintenance) for this
 * app's version. The server does the semver comparison so the client stays thin.
 *
 * Fail-open: any network/parse error returns null and the app is never blocked.
 */
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as SecureStore from "expo-secure-store";
import { apiGet } from "@/lib/mobileApi";

export type GateStatus = "ok" | "soft_update" | "force_update" | "maintenance";

export interface VersionGateDecision {
  status: GateStatus;
  current_version: string;
  min_supported_version: string;
  latest_version: string;
  update_message?: string | null;
  store_url?: string | null;
  maintenance_message?: string | null;
}

export const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
const PLATFORM = Platform.OS; // 'ios' | 'android'
const DISMISS_KEY = "ty_dismissed_update_version";

/** Fetch the gate decision. Returns null on any error (fail-open — never block). */
export async function fetchVersionGate(): Promise<VersionGateDecision | null> {
  try {
    return await apiGet<VersionGateDecision>(
      `/api/v1/app/version-config?platform=${PLATFORM}&current_version=${encodeURIComponent(APP_VERSION)}`
    );
  } catch {
    return null;
  }
}

/** The latest_version the user tapped "Later" on, so a soft prompt isn't shown again for it. */
export async function getDismissedSoftVersion(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(DISMISS_KEY);
  } catch {
    return null;
  }
}

export async function setDismissedSoftVersion(version: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(DISMISS_KEY, version);
  } catch {
    // non-fatal — worst case the soft prompt shows again next launch
  }
}
