import { useEffect, useState } from "react";
import { getBehaviorProfile, hasBehaviorData, type BehaviorProfile } from "@/lib/behaviorProfile";

export function useBehaviorProfile() {
  const [profile, setProfile] = useState<BehaviorProfile | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    getBehaviorProfile()
      .then((p) => {
        setProfile(p);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  return {
    profile,
    loaded,
    hasBehavior: hasBehaviorData(profile),
    recentViews: profile?.views.slice(0, 3) ?? [],
    topRegions: profile?.topRegions ?? [],
    topDifficulties: profile?.topDifficulties ?? [],
  };
}
