/**
 * Analytics consent (opt-out model).
 *
 * Analytics is on by default (the privacy manifest declares it as App Functionality, not
 * tracking), but the user can disable it in Settings. The value is cached in a module var
 * so `trackEvent` can check it synchronously; it's persisted in SecureStore and loaded once
 * at app start. When disabled, no analytics events or sessions are sent at all.
 */
import * as SecureStore from "expo-secure-store";

const KEY = "ty_analytics_consent";

let _consent = true;

export function getAnalyticsConsent(): boolean {
  return _consent;
}

/** Load the persisted value once at startup (before the first event fires). */
export async function loadAnalyticsConsent(): Promise<void> {
  try {
    const v = await SecureStore.getItemAsync(KEY);
    if (v === "false") _consent = false;
  } catch {
    // SecureStore unavailable — keep the default (enabled).
  }
}

export async function setAnalyticsConsent(enabled: boolean): Promise<void> {
  _consent = enabled;
  try {
    await SecureStore.setItemAsync(KEY, enabled ? "true" : "false");
  } catch {
    // best-effort persistence
  }
}
