import { useEffect, useRef, type ReactNode } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { usePathname } from "expo-router";
import * as Crypto from "expo-crypto";
import {
  setAnalyticsSessionId,
  trackEvent,
  trackScreen,
  flushOfflineQueue,
} from "@/lib/analytics";

const SESSION_BACKGROUND_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

function newSessionId(): string {
  return Crypto.randomUUID();
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const backgroundedAt = useRef<number | null>(null);
  const pathname = usePathname();
  const lastPath = useRef<string>("");

  // Auto screen_view: fire on every route change (dedup consecutive identical paths).
  useEffect(() => {
    if (pathname && pathname !== lastPath.current) {
      lastPath.current = pathname;
      trackScreen(pathname).catch(() => {});
    }
  }, [pathname]);

  useEffect(() => {
    const sid = newSessionId();
    setAnalyticsSessionId(sid);
    trackEvent("engagement", "app_open", { cold_start: true }).catch(() => {});
    flushOfflineQueue();

    const sub = AppState.addEventListener("change", (nextState) => {
      const prev = appState.current;

      if (prev === "active" && (nextState === "background" || nextState === "inactive")) {
        backgroundedAt.current = Date.now();
      }

      if ((prev === "background" || prev === "inactive") && nextState === "active") {
        const elapsed = backgroundedAt.current
          ? Date.now() - backgroundedAt.current
          : SESSION_BACKGROUND_THRESHOLD_MS + 1;

        if (elapsed >= SESSION_BACKGROUND_THRESHOLD_MS) {
          const newSid = newSessionId();
          setAnalyticsSessionId(newSid);
          trackEvent("engagement", "app_open", { cold_start: false }).catch(() => {});
        }

        flushOfflineQueue();
        backgroundedAt.current = null;
      }

      appState.current = nextState;
    });

    return () => sub.remove();
  }, []);

  return <>{children}</>;
}
