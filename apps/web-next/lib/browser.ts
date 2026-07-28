/**
 * Detects embedded in-app browsers (webviews) — Instagram, Facebook, etc.
 *
 * WHY: Google blocks OAuth 2.0 inside embedded webviews (`disallowed_useragent`,
 * an anti-phishing policy the developer cannot override). When a user opens the
 * site from an Instagram/Facebook link, sign-in with Google fails. We can't make
 * Google allow it, but we can detect the webview and guide the user to open the
 * page in a real browser (Safari/Chrome) or use email sign-in.
 *
 * Client-side only — returns false during SSR (no navigator).
 */
export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return (
    /Instagram|FBAN|FBAV|FB_IAB|Messenger|Line\/|LinkedInApp|Snapchat|MicroMessenger|Twitter|TikTok/i.test(ua) ||
    /\bwv\b/.test(ua) // Android System WebView marker (not present in Chrome Custom Tabs)
  );
}
