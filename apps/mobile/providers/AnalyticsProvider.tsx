import { useEffect, useRef, type ReactNode } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { usePathname, useSegments } from "expo-router";
import * as Crypto from "expo-crypto";
import { loadAnalyticsConsent } from "@/lib/consent";
import {
  setAnalyticsSessionId,
  trackEvent,
  trackScreen,
  flushOfflineQueue,
  startAnalyticsSession,
  endAnalyticsSession,
} from "@/lib/analytics";

const SESSION_BACKGROUND_THRESHOLD_MS = 15 * 60 * 1000; // 15 minutes

function newSessionId(): string {
  return Crypto.randomUUID();
}

export function AnalyticsProvider({ children }: { children: ReactNode }) {
  const appState = useRef<AppStateStatus>(AppState.currentState);
  const backgroundedAt = useRef<number | null>(null);
  const pathname = usePathname();
  const segments = useSegments();
  const lastPath = useRef<string>("");
  const pathRef = useRef<string>("");

  // Auto screen_view: fire on every route change. Normalize the screen NAME to the route
  // pattern (drop "(group)" segments) so dynamic slugs like /trek/kedarkantha collapse to
  // /trek/[slug] — avoids CDP cardinality blowup. Concrete path kept in properties.path.
  useEffect(() => {
    if (pathname && pathname !== lastPath.current) {
      lastPath.current = pathname;
      pathRef.current = pathname;
      const pattern = segments.filter((s) => !s.startsWith("(")).join("/");
      trackScreen(pattern ? `/${pattern}` : "/", pathname).catch(() => {});
    }
  }, [pathname]);

  useEffect(() => {
    let active = true;
    (async () => {
      await loadAnalyticsConsent(); // respect a prior opt-out before any event fires
      setAnalyticsSessionId(newSessionId()); // offline fallback id, overridden by server on success
      await startAnalyticsSession(pathRef.current || pathname || undefined);
      if (!active) return;
      trackEvent("engagement", "app_open", { cold_start: true }).catch(() => {});
      flushOfflineQueue();
    })();

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
          // New session after a long background: close the old one, open a fresh server session.
          (async () => {
            await endAnalyticsSession(pathRef.current);
            setAnalyticsSessionId(newSessionId());
            await startAnalyticsSession(pathRef.current || undefined);
            trackEvent("engagement", "app_open", { cold_start: false }).catch(() => {});
          })();
        }

        flushOfflineQueue();
        backgroundedAt.current = null;
      }

      appState.current = nextState;
    });

    return () => {
      active = false;
      endAnalyticsSession(pathRef.current).catch(() => {});
      sub.remove();
    };
  }, []);

  return <>{children}</>;
}
