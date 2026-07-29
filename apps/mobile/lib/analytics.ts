/**
 * Mobile analytics SDK (M15).
 * Posts events to POST /api/v1/analytics/event (same CDP endpoint as web).
 * Falls back to SQLite offline queue on network failure.
 */
import { Platform } from "react-native";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { apiPost } from "@/lib/mobileApi";
import { getAnonymousId, getUserId } from "@/lib/identity";
import { getAnalyticsConsent } from "@/lib/consent";
import { enqueueEventSync, flushQueueSync, QueuedEvent } from "@/lib/analyticsQueue";

const APP_VERSION = Constants.expoConfig?.version ?? "1.0.0";
const PLATFORM = Platform.OS; // 'ios' | 'android'
// Device metadata (captured once) — attached to every event's `properties` so the CDP can
// segment by device/OS. `analytics_events` has no device columns, so these ride in the JSON.
const DEVICE_MODEL = Device.modelName ?? undefined;
const OS_VERSION = Device.osVersion ?? String(Platform.Version);

let _currentScreen = "";
let _sessionId: string | null = null;

export function setCurrentScreen(screen: string): void {
  _currentScreen = screen;
}

export function setAnalyticsSessionId(id: string): void {
  _sessionId = id;
}

export async function trackEvent(
  category: string,
  eventName: string,
  properties: Record<string, unknown> = {}
): Promise<void> {
  if (!getAnalyticsConsent()) return; // user opted out of analytics
  const anonId = await getAnonymousId();
  const payload: QueuedEvent = {
    anonymous_id: anonId,
    user_id: getUserId() ?? undefined,
    session_id: _sessionId ?? undefined,
    event_category: category,
    event_name: eventName,
    properties: { ...properties, device_model: DEVICE_MODEL, os_version: OS_VERSION },
    page_url: _currentScreen,
    platform: PLATFORM,
    app_version: APP_VERSION,
    consent_given: true,
  };

  try {
    await apiPost<unknown>("/api/v1/analytics/event", payload);
  } catch {
    enqueueEventSync(payload);
  }
}

export async function trackScreen(screenName: string, path?: string): Promise<void> {
  setCurrentScreen(screenName);
  await trackEvent("navigation", "screen_view", { screen: screenName, path });
}

export function flushOfflineQueue(): void {
  flushQueueSync(async (events) => {
    await apiPost<unknown>("/api/v1/analytics/events/batch", { events });
  });
}

// ── Session lifecycle ───────────────────────────────────────────────────────
// Create a server-side AnalyticsSession (so mobile sessions appear in the CDP with device
// metadata + power cohort/retention reports). On success the server `s_…` id becomes the
// session_id used by subsequent events; on failure we keep the client fallback id.

export async function startAnalyticsSession(landingPage?: string): Promise<void> {
  if (!getAnalyticsConsent()) return; // user opted out of analytics
  const anonId = await getAnonymousId();
  try {
    const res = await apiPost<{ id: string }>("/api/v1/analytics/session/start", {
      anonymous_id: anonId,
      platform: PLATFORM,
      app_version: APP_VERSION,
      device_model: DEVICE_MODEL,
      os_version: OS_VERSION,
      landing_page: landingPage,
    });
    if (res?.id) _sessionId = res.id;
  } catch {
    // Offline / server unreachable — keep the client-generated fallback session id.
  }
}

export async function endAnalyticsSession(exitPage?: string): Promise<void> {
  const id = _sessionId;
  if (!id) return;
  try {
    await apiPost<unknown>("/api/v1/analytics/session/end", {
      session_id: id,
      exit_page: exitPage ?? _currentScreen,
    });
  } catch {}
}

// ── Convenience helpers ────────────────────────────────────────────────────

export const trackTrekView = (slug: string, state?: string) =>
  trackEvent("engagement", "trek_viewed", { trek_slug: slug, state });

export const trackSearch = (query: string, resultCount: number) =>
  trackEvent("engagement", "search_performed", { query, result_count: resultCount });

export const trackTrekSaved = (slug: string) =>
  trackEvent("engagement", "trek_saved", { trek_slug: slug });

export const trackTrekDownloaded = (slug: string) =>
  trackEvent("engagement", "trek_downloaded", { trek_slug: slug });

export const trackPushOpened = (category: string, trekSlug?: string) =>
  trackEvent("engagement", "push_notification_opened", { category, trek_slug: trekSlug });

export const trackPlanWizardStep = (step: number, data?: Record<string, unknown>) =>
  trackEvent("conversion", `plan_wizard_step_${step}`, { step, ...data });

export const trackPlanWizardCompleted = (payload: Record<string, unknown>) =>
  trackEvent("conversion", "plan_wizard_completed", payload);

export const trackOperatorInquiry = (operatorSlug: string) =>
  trackEvent("conversion", "operator_inquiry_sent", { operator_slug: operatorSlug });

export const trackProductPurchased = (productId: string, price: number) =>
  trackEvent("conversion", "product_purchased", { product_id: productId, price });

export const trackPremiumSubscribed = (productId: string) =>
  trackEvent("conversion", "premium_subscribed", { product_id: productId, platform: PLATFORM });

export const trackCheckin = (slug: string, date: string) =>
  trackEvent("engagement", "checkin_created", { trek_slug: slug, date });

export const trackUserSignedIn = (method: string) =>
  trackEvent("conversion", "user_signed_in", { method });

export const trackUserSignedUp = (method: string) =>
  trackEvent("conversion", "user_signed_up", { method });

export const trackTrekShared = (slug: string, method: string) =>
  trackEvent("engagement", "trek_shared", { trek_slug: slug, method });

export const trackNewsArticleViewed = (slug: string, title?: string) =>
  trackEvent("engagement", "news_article_viewed", { slug, title });

// v1.1 redesign surfaces
export const trackAiSearchOpened = (source: string) =>
  trackEvent("engagement", "ai_search_opened", { source });

export const trackVoiceSearchUsed = (source: string) =>
  trackEvent("engagement", "voice_search_used", { source });

export const trackFilterChipTapped = (filter: string) =>
  trackEvent("engagement", "filter_chip_tapped", { filter });

export const trackCategoryTapped = (category: string) =>
  trackEvent("engagement", "category_tapped", { category });
