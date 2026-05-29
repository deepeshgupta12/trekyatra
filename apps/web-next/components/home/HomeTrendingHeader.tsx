"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getBehaviorProfile, hasBehaviorData } from "@/lib/behavior-tracker";

interface Props {
  cta: { label: string; to: string };
}

export function HomeTrendingHeader({ cta }: Props) {
  const { user, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [heading, setHeading] = useState("Trending this month");
  const [subLabel, setSubLabel] = useState("Treks Indians are obsessing over right now");

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || isLoading) return;

    const hasBehavior = hasBehaviorData();
    const profile = getBehaviorProfile();

    if (user && hasBehavior) {
      // State B: Repeat logged in
      const topRegion = profile?.topRegions[0];
      setHeading("Recommended for you");
      setSubLabel(
        topRegion
          ? `Based on your interest in ${topRegion}`
          : "Curated for your trekking style"
      );
    } else if (user && !hasBehavior) {
      // State A: New logged in
      setHeading("Treks Indians are exploring right now");
      setSubLabel("Great starting points for first-time trekkers");
    } else if (!user && hasBehavior) {
      // State D: Repeat logged out
      const topRegion = profile?.topRegions[0];
      setHeading("Continue exploring");
      setSubLabel(
        topRegion
          ? `Popular treks from ${topRegion}`
          : "Picked for returning explorers"
      );
    }
    // State C: New logged out — keep defaults set in useState
  }, [mounted, isLoading, user]);

  return (
    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
      <div>
        <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">
          {mounted && !isLoading && user ? "For you" : "Trending this month"}
        </div>
        {/* While loading auth, show a subtle skeleton to avoid layout shift */}
        {!mounted || isLoading ? (
          <div className="space-y-2">
            <div className="h-8 w-80 rounded-lg bg-muted animate-pulse" />
            <div className="h-4 w-56 rounded-lg bg-muted animate-pulse" />
          </div>
        ) : (
          <>
            <h2 className="font-display text-4xl md:text-5xl font-semibold leading-tight">
              {heading}
            </h2>
            <p className="text-muted-foreground text-sm mt-2">{subLabel}</p>
          </>
        )}
      </div>
      <Link
        href={cta.to}
        className="flex items-center gap-1 text-sm text-accent hover:underline font-medium whitespace-nowrap"
      >
        {cta.label} <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
