/**
 * Onboarding preferences (v1.1 personalization).
 *
 * Persistence model (matches the backend user_preferences design):
 * - Local (AsyncStorage): instant personalization; wiped on uninstall.
 * - Backend anon row (keyed by the SecureStore anonymous_id, which SURVIVES uninstall via
 *   the iOS Keychain): so a logged-out user who reinstalls is remembered → onboarding skipped.
 * - Backend user row (logged-in): cross-synced with web; merges the anon row on login.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as Device from "expo-device";
import { apiGet, apiPut } from "@/lib/mobileApi";
import { getAnonymousId } from "@/lib/identity";

export type Experience = "beginner" | "intermediate" | "experienced";

export interface UserPreferences {
  experience: Experience | null;
  difficulties: string[] | null;
  regions: string[] | null;
  vibes: string[] | null;
  onboarding_completed: boolean;
}

export const EMPTY_PREFERENCES: UserPreferences = {
  experience: null,
  difficulties: null,
  regions: null,
  vibes: null,
  onboarding_completed: false,
};

const LOCAL_KEY = "ty_preferences";
const DEVICE_ID = (Device.modelName ?? Platform.OS).slice(0, 64);

export async function getLocalPreferences(): Promise<UserPreferences | null> {
  try {
    const v = await AsyncStorage.getItem(LOCAL_KEY);
    return v ? (JSON.parse(v) as UserPreferences) : null;
  } catch {
    return null;
  }
}

async function setLocalPreferences(p: UserPreferences): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(p));
  } catch {
    /* non-fatal */
  }
}

/**
 * Persist prefs: local (instant) + the backend anon row (survives uninstall) + the user row
 * when logged in (cross-web). Fail-soft — a network error never blocks the user.
 */
export async function savePreferences(p: UserPreferences, isLoggedIn: boolean): Promise<void> {
  await setLocalPreferences(p);
  try {
    const anon = await getAnonymousId();
    await apiPut("/api/v1/app/preferences", { ...p, anonymous_id: anon, device_id: DEVICE_ID });
    if (isLoggedIn) {
      await apiPut(
        `/api/v1/account/preferences?anonymous_id=${encodeURIComponent(anon)}&device_id=${encodeURIComponent(DEVICE_ID)}`,
        p
      );
    }
  } catch {
    /* offline — local copy is kept; will re-sync next completed write */
  }
}

/**
 * Hydrate prefs on launch. Prefer local; if absent (e.g. reinstall), pull from the backend —
 * the user row when logged in, else the anon row (by the persisted anonymous_id).
 */
export async function restorePreferences(isLoggedIn: boolean): Promise<UserPreferences | null> {
  const local = await getLocalPreferences();
  if (local?.onboarding_completed) return local;
  try {
    const anon = await getAnonymousId();
    const path = isLoggedIn
      ? `/api/v1/account/preferences?anonymous_id=${encodeURIComponent(anon)}`
      : `/api/v1/app/preferences?anonymous_id=${encodeURIComponent(anon)}`;
    const remote = await apiGet<UserPreferences>(path);
    if (remote?.onboarding_completed) {
      await setLocalPreferences(remote);
      return remote;
    }
  } catch {
    /* offline — fall back to whatever local we have */
  }
  return local;
}

/** On login: the authed GET with anonymous_id triggers the server-side anon→user merge. */
export async function mergePreferencesOnLogin(): Promise<UserPreferences | null> {
  try {
    const anon = await getAnonymousId();
    const merged = await apiGet<UserPreferences>(
      `/api/v1/account/preferences?anonymous_id=${encodeURIComponent(anon)}`
    );
    if (merged?.onboarding_completed) {
      await setLocalPreferences(merged);
      return merged;
    }
  } catch {
    /* non-fatal */
  }
  return null;
}
