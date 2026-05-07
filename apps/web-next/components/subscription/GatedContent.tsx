"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import PremiumBadge from "./PremiumBadge";

interface Props {
  title?: string;
  teaser?: string;
}

export default function GatedContent({ title, teaser }: Props) {
  return (
    <div className="relative rounded-2xl border border-amber-400/30 bg-amber-400/5 overflow-hidden">
      {/* Blurred content placeholder */}
      {teaser && (
        <div
          className="p-6 select-none pointer-events-none"
          style={{ filter: "blur(4px)", opacity: 0.4 }}
          aria-hidden
        >
          <p className="text-foreground text-sm line-clamp-4">{teaser}</p>
        </div>
      )}

      {/* Overlay CTA */}
      <div className="flex flex-col items-center gap-4 px-6 py-8 text-center">
        <div className="w-12 h-12 rounded-full bg-amber-400/15 flex items-center justify-center">
          <Lock className="h-6 w-6 text-amber-500" />
        </div>
        <div>
          <PremiumBadge size="md" className="mb-2" />
          <h3 className="font-semibold text-foreground mt-2">
            {title ?? "This is premium content"}
          </h3>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
            Upgrade to TrekYatra Premium to access expert route guides, detailed compendiums, and exclusive trekking content.
          </p>
        </div>
        <Link href="/premium">
          <Button variant="hero" size="sm" className="gap-1.5">
            Upgrade to Premium
          </Button>
        </Link>
        <p className="text-xs text-muted-foreground">Already premium? <Link href="/auth/sign-in" className="text-accent hover:underline">Sign in</Link></p>
      </div>
    </div>
  );
}
