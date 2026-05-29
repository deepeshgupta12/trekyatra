"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { hasBehaviorData } from "@/lib/behavior-tracker";
import {
  RecommendationItem,
  fetchPersonalisedRecommendations,
  fetchAnonymousRecommendations,
} from "@/lib/api";

function FeedCard({ item }: { item: RecommendationItem }) {
  const href = `/${item.page_type === "trek_guide" ? "trek" : "guides"}/${item.slug}`;
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 p-3 rounded-2xl border border-border bg-card hover:border-accent/40 transition-colors"
    >
      {item.hero_image_url ? (
        <img
          src={item.hero_image_url}
          alt={item.title}
          className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
        />
      ) : (
        <div className="w-14 h-14 rounded-xl bg-accent/5 flex items-center justify-center flex-shrink-0 text-lg">
          ⛰
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-widest text-accent font-medium mb-0.5">
          {item.page_type?.replace("_", " ")}
        </p>
        <p className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-accent transition-colors">
          {item.title}
        </p>
      </div>
    </Link>
  );
}

export default function PersonalisedFeed({ limit = 6 }: { limit?: number }) {
  const { user, isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [heading, setHeading] = useState("For you");
  const [subLabel, setSubLabel] = useState("Treks matched to your interests");

  useEffect(() => {
    if (authLoading) return;

    const hasBehavior = hasBehaviorData();

    // State C (New logged out) — hide entirely
    if (!user && !hasBehavior) {
      setLoading(false);
      return;
    }

    const firstName =
      (user?.display_name || user?.full_name || "").split(" ")[0] || "Explorer";

    // Determine heading + fetcher per state
    let fetcher: (limit: number) => Promise<{ items: RecommendationItem[]; personalised: boolean }>;

    if (user && hasBehavior) {
      // State B: Repeat logged in — personalised
      setHeading(`For ${firstName}`);
      setSubLabel("Based on your browsing history");
      fetcher = fetchPersonalisedRecommendations;
    } else if (user && !hasBehavior) {
      // State A: New logged in — generic popular treks
      setHeading("Popular treks");
      setSubLabel("Most loved by our community");
      fetcher = fetchAnonymousRecommendations;
    } else {
      // State D: Repeat logged out — anonymous recs from browsing history
      setHeading("Continue exploring");
      setSubLabel("Treks based on your browsing history");
      fetcher = fetchAnonymousRecommendations;
    }

    fetcher(limit)
      .then((data) => setItems(data.items))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [user, authLoading, limit]);

  if (loading || items.length === 0) return null;

  return (
    <section className="py-16 md:py-24">
      <div className="container-wide">
        <div className="flex items-end justify-between mb-10 gap-6">
          <div className="max-w-2xl">
            <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">{heading}</div>
            <h2 className="font-display text-3xl md:text-5xl font-semibold leading-tight">{subLabel}</h2>
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          {items.slice(0, limit).map((item) => (
            <FeedCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
