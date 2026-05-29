"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { getBehaviorProfile, hasBehaviorData } from "@/lib/behavior-tracker";
import type { Trek } from "@/components/trek/TrekCard";

interface Props {
  trekList: Trek[];   // static trek list from server for name/image enrichment
}

interface ViewChip {
  slug: string;
  name: string;
  image: string;
  region: string;
  difficulty: string;
}

export function RecentlyViewedSection({ trekList }: Props) {
  const { user, isLoading } = useAuth();
  const [chips, setChips] = useState<ViewChip[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isLoading) return;
    // Only render for State D: logged-out + has behavior data
    if (user || !hasBehaviorData()) return;

    const profile = getBehaviorProfile();
    if (!profile) return;

    const enriched = profile.views.slice(0, 5).map((v) => {
      const staticMatch = trekList.find((t) => t.slug === v.slug);
      return {
        slug: v.slug,
        name: staticMatch?.name ?? v.slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        image: staticMatch?.image ?? "",
        region: staticMatch?.region ?? v.region ?? "",
        difficulty: staticMatch?.difficulty ?? v.difficulty ?? "",
      };
    });

    setChips(enriched);
  }, [mounted, isLoading, user, trekList]);

  // Only show for State D (logged-out repeat user)
  if (!mounted || isLoading || user || chips.length === 0) return null;

  return (
    <section className="py-12 md:py-16">
      <div className="container-wide">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 mb-6">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-accent mb-2">Recently viewed</div>
            <h2 className="font-display text-2xl md:text-3xl font-semibold leading-tight">
              Pick up where you left off
            </h2>
          </div>
          <Link
            href="/auth/sign-in"
            className="text-xs text-muted-foreground hover:text-accent transition-colors whitespace-nowrap"
          >
            Sign in to save your treks →
          </Link>
        </div>

        {/* Horizontal scroll on mobile, grid on desktop */}
        <div className="flex gap-3 overflow-x-auto pb-2 snap-x -mx-1 px-1 sm:grid sm:grid-cols-5">
          {chips.map((chip) => (
            <Link
              key={chip.slug}
              href={`/trek/${chip.slug}`}
              className="group flex-shrink-0 w-44 sm:w-auto snap-start bg-card border border-border rounded-2xl overflow-hidden hover:border-accent/40 transition-colors"
            >
              {chip.image ? (
                <div className="relative h-28 overflow-hidden">
                  <img
                    src={chip.image}
                    alt={chip.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
              ) : (
                <div className="h-28 bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                  <span className="text-3xl">⛰</span>
                </div>
              )}
              <div className="p-3">
                <p className="text-xs font-semibold leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                  {chip.name}
                </p>
                {chip.region && (
                  <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{chip.region}</p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Login nudge */}
        <p className="text-xs text-muted-foreground mt-4">
          <Link href="/auth/sign-in" className="text-accent hover:underline font-medium">
            Sign in
          </Link>{" "}
          to save your treks and get personalised recommendations.
        </p>
      </div>
    </section>
  );
}
