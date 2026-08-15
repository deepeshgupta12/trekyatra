"use client";

import type { MouseEvent } from "react";
import { trackEvent } from "@/lib/analytics";

export const APP_STORE_URL = "https://apps.apple.com/in/app/trekyatra/id6795408094";
// The app's registered custom scheme (apps/mobile app.config.ts `scheme: ["trekyatra", ...]`).
// Opens the installed app; if it is not installed the timeout falls back to the App Store.
const APP_SCHEME = "trekyatra://";

function AppleGlyph({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 384 512" aria-hidden="true" className={className} fill="currentColor">
      <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
    </svg>
  );
}

/** Presentational "Download on the App Store" badge (Apple-style black pill). */
export function AppStoreBadge({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-2.5 rounded-xl bg-black px-4 py-2.5 ring-1 ring-white/15 transition-transform duration-200 group-hover:scale-[1.03] group-active:scale-95 ${className}`}
    >
      <AppleGlyph className="h-7 w-7 text-white" />
      <span className="flex flex-col text-left leading-none">
        <span className="text-[10px] tracking-wide text-white/85">Download on the</span>
        <span className="-mt-0.5 text-[19px] font-semibold text-white">App Store</span>
      </span>
    </span>
  );
}

/**
 * Smart App Store download button.
 *  - On iOS mobile web: tries to open the installed app via the custom scheme; if it does not open
 *    within a short window (app not installed), it falls back to the App Store product page.
 *  - Everywhere else (desktop, Android): follows the App Store link directly.
 * Progressive enhancement: the element is a real <a href={APP_STORE_URL}>, so it works even if JS fails.
 */
export function AppDownloadButton({ label = "download", className = "" }: { label?: string; className?: string }) {
  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    const ua = navigator.userAgent || "";
    const isIOS = /iP(hone|od|ad)/.test(ua) || (/(Macintosh)/.test(ua) && "ontouchend" in document);
    trackEvent("conversion", "app_download_click", { placement: label, platform: isIOS ? "ios" : "other" });

    if (!isIOS) return; // desktop / Android → let the App Store href proceed

    // iOS: attempt the app first, fall back to the App Store if it does not take over the page.
    e.preventDefault();
    let settled = false;
    const timer = window.setTimeout(() => {
      if (!settled) {
        settled = true;
        window.location.href = APP_STORE_URL;
      }
    }, 1400);
    const cancel = () => {
      if (!settled) {
        settled = true;
        window.clearTimeout(timer);
      }
    };
    // If the app opens, the page is backgrounded → cancel the App Store fallback.
    window.addEventListener("pagehide", cancel, { once: true });
    const onVis = () => {
      if (document.hidden) {
        cancel();
        document.removeEventListener("visibilitychange", onVis);
      }
    };
    document.addEventListener("visibilitychange", onVis);
    window.location.href = APP_SCHEME;
  }

  return (
    <a
      href={APP_STORE_URL}
      onClick={handleClick}
      aria-label="Download TrekYatra on the App Store"
      className={`group inline-flex w-fit ${className}`}
    >
      <AppStoreBadge />
    </a>
  );
}
