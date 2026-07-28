import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { UpdateGateOverlay } from "@/components/version/UpdateGateOverlay";
import {
  fetchVersionGate,
  getDismissedSoftVersion,
  setDismissedSoftVersion,
  type VersionGateDecision,
} from "@/lib/version";

/**
 * Fetches the server version gate on launch and on every foreground, and renders a
 * blocking overlay (force update / maintenance) or a dismissible soft-update sheet.
 * Fail-open: if the endpoint is unreachable, `decision` stays null and nothing blocks.
 */
export function VersionGateProvider({ children }: { children: ReactNode }) {
  const [decision, setDecision] = useState<VersionGateDecision | null>(null);
  const [dismissedSoftVersion, setDismissedSoftLocal] = useState<string | null>(null);
  const appState = useRef<AppStateStatus>(AppState.currentState);

  const check = useCallback(async () => {
    const d = await fetchVersionGate();
    if (d) setDecision(d);
  }, []);

  useEffect(() => {
    getDismissedSoftVersion().then(setDismissedSoftLocal);
    check();
    const sub = AppState.addEventListener("change", (next) => {
      if ((appState.current === "background" || appState.current === "inactive") && next === "active") {
        check(); // re-check on foreground so a live maintenance flip / raised min-version takes effect
      }
      appState.current = next;
    });
    return () => sub.remove();
  }, [check]);

  const dismissSoft = useCallback(() => {
    if (!decision) return;
    setDismissedSoftLocal(decision.latest_version);
    setDismissedSoftVersion(decision.latest_version);
  }, [decision]);

  const status = decision?.status;
  const blocking = status === "force_update" || status === "maintenance";
  const softVisible = status === "soft_update" && dismissedSoftVersion !== decision?.latest_version;

  return (
    <>
      {children}
      {decision && blocking && <UpdateGateOverlay decision={decision} />}
      {decision && softVisible && <UpdateGateOverlay decision={decision} onDismiss={dismissSoft} />}
    </>
  );
}
