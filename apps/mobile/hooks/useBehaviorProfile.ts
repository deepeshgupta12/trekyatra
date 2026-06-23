import { useEffect, useRef, useState } from "react";
import {
  getBehaviorProfile,
  hasBehaviorData,
  pullAndMergeBehaviorProfile,
  type BehaviorProfile,
} from "@/lib/behaviorProfile";
import { useAuth } from "@/hooks/useAuth";

export function useBehaviorProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<BehaviorProfile | null>(null);
  const [loaded, setLoaded] = useState(false);
  const prevUserId = useRef<string | null>(null);

  // Load from AsyncStorage on mount
  useEffect(() => {
    getBehaviorProfile()
      .then((p) => {
        setProfile(p);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  // On login: pull remote profile and merge with local
  useEffect(() => {
    const currentId = user?.id ?? null;
    if (currentId && currentId !== prevUserId.current) {
      prevUserId.current = currentId;
      pullAndMergeBehaviorProfile().then(() =>
        getBehaviorProfile().then((p) => setProfile(p))
      );
    } else if (!currentId) {
      prevUserId.current = null;
    }
  }, [user?.id]);

  return {
    profile,
    loaded,
    hasBehavior: hasBehaviorData(profile),
    recentViews: profile?.views.slice(0, 3) ?? [],
    topRegions: profile?.topRegions ?? [],
    topDifficulties: profile?.topDifficulties ?? [],
  };
}
