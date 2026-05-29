"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getBehaviorProfile } from "@/lib/behavior-tracker";

export function HomeWelcomeBanner() {
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [topRegion, setTopRegion] = useState<string | null>(null);
  const [recentSlugs, setRecentSlugs] = useState<{ slug: string; name: string }[]>([]);

  useEffect(() => {
    setMounted(true);
    const profile = getBehaviorProfile();
    if (profile) {
      setViewCount(profile.views.length);
      setTopRegion(profile.topRegions[0] ?? null);
      setRecentSlugs(
        profile.views.slice(0, 3).map((v) => ({
          slug: v.slug,
          name: v.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        }))
      );
    }
  }, []);

  // Not logged in, or still loading, or not yet hydrated → render nothing
  if (!mounted || isLoading || !user) return null;

  const firstName =
    (user.display_name || user.full_name || "").split(" ")[0] || "Explorer";
  const isRepeat = viewCount > 0;

  return (
    <div className="bg-accent/5 border-b border-accent/15">
      <div className="container-wide py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {/* Avatar initial */}
          <div className="h-8 w-8 rounded-full bg-accent text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {firstName[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            {isRepeat ? (
              <p className="text-sm font-medium text-foreground truncate">
                Welcome back, <span className="text-accent">{firstName}</span>!
                {topRegion && (
                  <span className="text-muted-foreground font-normal">
                    {" "}You&apos;ve browsed {viewCount} trek{viewCount !== 1 ? "s" : ""} — mostly in {topRegion}.
                  </span>
                )}
              </p>
            ) : (
              <p className="text-sm font-medium text-foreground">
                Welcome to TrekYatra, <span className="text-accent">{firstName}</span>!{" "}
                <span className="text-muted-foreground font-normal">Start by exploring the treks below.</span>
              </p>
            )}
          </div>
        </div>

        {/* Recently viewed chips — repeat users, sm+ only */}
        {isRepeat && recentSlugs.length > 0 && (
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-muted-foreground">Continue:</span>
            {recentSlugs.map((t) => (
              <Link
                key={t.slug}
                href={`/trek/${t.slug}`}
                className="text-xs px-2.5 py-1 rounded-full bg-card border border-border hover:border-accent/40 hover:text-accent transition-colors whitespace-nowrap font-medium"
              >
                {t.name}
              </Link>
            ))}
          </div>
        )}

        {/* New user nudge */}
        {!isRepeat && (
          <Link
            href="/explore"
            className="hidden sm:inline-flex text-xs text-accent font-medium hover:underline flex-shrink-0"
          >
            Explore all treks →
          </Link>
        )}
      </div>
    </div>
  );
}
