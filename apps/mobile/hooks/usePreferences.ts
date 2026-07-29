import { useEffect, useState } from "react";
import { restorePreferences, type UserPreferences } from "@/lib/preferences";
import { useAuth } from "@/hooks/useAuth";

/**
 * Loads the user's onboarding preferences for Home personalization. Restores from local,
 * else the backend (user row when logged-in — which also triggers the server-side anon→user
 * merge via the anonymous_id — else the anon row that survives uninstall).
 */
export function usePreferences() {
  const { isAuthenticated } = useAuth();
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    restorePreferences(isAuthenticated).then((p) => {
      if (!active) return;
      setPrefs(p);
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  return { prefs, loaded };
}
