/**
 * TrekYatra CDP Client SDK
 * Handles event tracking, session management, identity stitching, and consent.
 * Events are batched (≤20 per flush, max 5s interval) before sending to the API.
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    plausible?: (event: string, opts?: { props?: Record<string, unknown> }) => void;
  }
}

const API_BASE =
  (process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000") + "/api/v1";
const ANONYMOUS_ID_KEY = "ty_anon_id";
const SESSION_ID_KEY = "ty_session_id";
const CONSENT_KEY = "ty_consent";
const FLUSH_INTERVAL_MS = 5000;
const MAX_BATCH_SIZE = 20;

// ── Anonymous ID ──────────────────────────────────────────────────────────────

function generateId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function getAnonymousId(): string {
  if (typeof window === "undefined") return "ssr";
  let id = localStorage.getItem(ANONYMOUS_ID_KEY);
  if (!id) {
    id = `anon_${generateId()}`;
    localStorage.setItem(ANONYMOUS_ID_KEY, id);
  }
  return id;
}

// ── Consent ───────────────────────────────────────────────────────────────────

export function getConsent(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(CONSENT_KEY) === "true";
}

export function setConsent(value: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CONSENT_KEY, String(value));
  fetch(`${API_BASE}/analytics/consent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ anonymous_id: getAnonymousId(), consent_given: value }),
  }).catch(() => {});
}

// ── UTM capture ───────────────────────────────────────────────────────────────

export interface UtmParams {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export function captureUtmParams(): UtmParams {
  if (typeof window === "undefined") return {};
  const p = new URLSearchParams(window.location.search);
  const utms: UtmParams = {};
  if (p.get("utm_source")) utms.utm_source = p.get("utm_source")!;
  if (p.get("utm_medium")) utms.utm_medium = p.get("utm_medium")!;
  if (p.get("utm_campaign")) utms.utm_campaign = p.get("utm_campaign")!;
  if (p.get("utm_term")) utms.utm_term = p.get("utm_term")!;
  if (p.get("utm_content")) utms.utm_content = p.get("utm_content")!;
  if (Object.keys(utms).length > 0) {
    sessionStorage.setItem("ty_utms", JSON.stringify(utms));
  }
  const stored = sessionStorage.getItem("ty_utms");
  return stored ? (JSON.parse(stored) as UtmParams) : utms;
}

// ── Session management ────────────────────────────────────────────────────────

export function getSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SESSION_ID_KEY);
}

export async function startSession(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  const existing = getSessionId();
  if (existing) return existing;
  const utms = captureUtmParams();
  try {
    const res = await fetch(`${API_BASE}/analytics/session/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        anonymous_id: getAnonymousId(),
        landing_page: window.location.pathname,
        device_type: getDeviceType(),
        ...utms,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    sessionStorage.setItem(SESSION_ID_KEY, data.id);
    return data.id as string;
  } catch {
    return null;
  }
}

export async function endSession(exitPage?: string): Promise<void> {
  const sessionId = getSessionId();
  if (!sessionId || typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_ID_KEY);
  try {
    await fetch(`${API_BASE}/analytics/session/end`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        exit_page: exitPage ?? window.location.pathname,
      }),
    });
  } catch {}
}

// ── Event queue + batch flush ─────────────────────────────────────────────────

interface EventPayload {
  anonymous_id: string;
  session_id?: string | null;
  event_category: string;
  event_name: string;
  event_value?: number;
  properties?: Record<string, unknown>;
  page_url?: string;
  page_title?: string;
  referrer?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  device_type?: string;
  browser?: string;
  consent_given: boolean;
}

let _queue: EventPayload[] = [];
let _flushTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleFlush(): void {
  if (_flushTimer) return;
  _flushTimer = setTimeout(() => {
    _flushTimer = null;
    flushQueue();
  }, FLUSH_INTERVAL_MS);
}

export async function flushQueue(): Promise<void> {
  if (_queue.length === 0) return;
  const batch = _queue.splice(0, MAX_BATCH_SIZE);
  try {
    await fetch(`${API_BASE}/analytics/events/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ events: batch }),
    });
  } catch {
    // silently drop — CDP is non-critical
  }
}

// ── Core tracking API ─────────────────────────────────────────────────────────

export function trackEvent(
  category: string,
  name: string,
  properties?: Record<string, unknown>,
  value?: number
): void {
  if (typeof window === "undefined") return;
  const utms = captureUtmParams();
  const payload: EventPayload = {
    anonymous_id: getAnonymousId(),
    session_id: getSessionId(),
    event_category: category,
    event_name: name,
    event_value: value,
    properties: properties ?? {},
    page_url: window.location.href,
    page_title: document.title,
    referrer: document.referrer || undefined,
    device_type: getDeviceType(),
    browser: getBrowser(),
    consent_given: getConsent(),
    ...utms,
  };
  _queue.push(payload);
  if (_queue.length >= MAX_BATCH_SIZE) {
    if (_flushTimer) {
      clearTimeout(_flushTimer);
      _flushTimer = null;
    }
    flushQueue();
  } else {
    scheduleFlush();
  }
  // Mirror to GA4 (client-side)
  if (typeof window.gtag === "function") {
    window.gtag("event", name, { event_category: category, ...properties });
  }
}

export function trackPageView(url?: string, title?: string): void {
  trackEvent("navigation", "page_view", {
    url: url ?? (typeof window !== "undefined" ? window.location.href : ""),
    title: title ?? (typeof window !== "undefined" ? document.title : ""),
  });
}

export function trackTrekViewed(trekSlug: string, trekName?: string): void {
  trackEvent("engagement", "trek_viewed", { trek_slug: trekSlug, trek_name: trekName }, 1);
}

export function trackSearchPerformed(query: string, resultsCount: number): void {
  trackEvent("engagement", "search_performed", { query, results_count: resultsCount });
}

export function trackPlanWizardStarted(step?: string): void {
  trackEvent("conversion", "plan_wizard_started", { step });
}

export function trackPlanWizardCompleted(wizardData?: Record<string, unknown>): void {
  trackEvent("conversion", "plan_wizard_completed", wizardData ?? {}, 1);
  flushQueue();
}

export function trackSignUp(method: string): void {
  trackEvent("conversion", "user_signed_up", { method }, 1);
  flushQueue();
}

export function trackSignIn(method: string): void {
  trackEvent("conversion", "user_signed_in", { method });
}

export function identify(userId: string): void {
  const anonymousId = getAnonymousId();
  fetch(`${API_BASE}/analytics/identify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ anonymous_id: anonymousId, user_id: userId }),
  }).catch(() => {});
}

export function trackNewsArticleViewed(slug: string, title?: string): void {
  trackEvent("engagement", "news_article_viewed", { slug, title });
}

export function trackScrollDepth(depth: 25 | 50 | 75 | 100, pageUrl?: string): void {
  trackEvent("engagement", "scroll_depth", {
    depth_pct: depth,
    page_url: pageUrl ?? (typeof window !== "undefined" ? window.location.href : ""),
  }, depth / 100);
}

export function trackOutboundLink(url: string, label?: string): void {
  trackEvent("engagement", "outbound_link_clicked", { url, label });
}

export function trackLeadFormStarted(source: string): void {
  trackEvent("conversion", "lead_form_started", { source });
}

export function trackLeadFormSubmitted(source: string, trekInterest?: string): void {
  trackEvent("conversion", "lead_form_submitted", { source, trek_interest: trekInterest }, 1);
  flushQueue();
}

// ── Device detection helpers ─────────────────────────────────────────────────

function getDeviceType(): string {
  if (typeof window === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return "mobile";
  if (/Tablet|iPad/i.test(ua)) return "tablet";
  return "desktop";
}

function getBrowser(): string {
  if (typeof window === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (ua.includes("Chrome")) return "Chrome";
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Safari")) return "Safari";
  if (ua.includes("Edge")) return "Edge";
  return "Other";
}
