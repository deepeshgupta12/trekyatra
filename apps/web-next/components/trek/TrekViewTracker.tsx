"use client";

import { useEffect } from "react";
import { recordTrekView, syncBehaviorProfileToBackend } from "@/lib/behavior-tracker";
import { useAuth } from "@/lib/auth-context";

const RECENTLY_VIEWED_KEY = "ty_recently_viewed";
const MAX_RECENTLY_VIEWED = 10;

interface RecentlyViewedItem {
  slug: string;
  title: string;
  pageType?: string;
  href: string;
  viewedAt: number;
}

function recordRecentlyViewed(slug: string, title: string) {
  try {
    const prev: RecentlyViewedItem[] = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) ?? "[]");
    const filtered = prev.filter((i) => i.slug !== slug);
    const next: RecentlyViewedItem[] = [
      { slug, title, pageType: "trek_guide", href: `/trek/${slug}`, viewedAt: Date.now() },
      ...filtered,
    ].slice(0, MAX_RECENTLY_VIEWED);
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next));
  } catch { /* ignore storage errors */ }
}

interface Props {
  slug: string;
  title: string;
  region: string;
  difficulty: string;
  season: string;
}

/** Invisible client component — records a trek page view in localStorage.
 *  When authenticated, also syncs to backend for cross-platform personalization. */
export function TrekViewTracker({ slug, title, region, difficulty, season }: Props) {
  const { user } = useAuth();

  useEffect(() => {
    recordTrekView({ slug, region, difficulty, season });
    recordRecentlyViewed(slug, title);
    // Push to backend when authenticated so mobile picks up web activity
    if (user) {
      syncBehaviorProfileToBackend();
    }
  }, [slug, title, region, difficulty, season, user]);
  return null;
}
