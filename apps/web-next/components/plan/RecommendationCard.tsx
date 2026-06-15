"use client";

import Link from "next/link";
import { Mountain, Clock, TrendingUp, Calendar, FileCheck, MapPin, AlertTriangle, Star, Wallet, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TrekRecommendation } from "@/lib/api";

const CATEGORY_LABELS: Record<string, { label: string; color: string }> = {
  best_match:   { label: "Best Match",          color: "bg-accent text-white" },
  safer:        { label: "Safer Option",         color: "bg-emerald-600 text-white" },
  adventurous:  { label: "More Adventurous",     color: "bg-orange-500 text-white" },
  budget:       { label: "Budget-Friendly",      color: "bg-blue-600 text-white" },
  comparison:   { label: "Worth Comparing",      color: "bg-purple-600 text-white" },
};

interface Props {
  rec: TrekRecommendation;
  onAddToCompare?: (slug: string) => void;
  compareSelected?: boolean;
  onEnquire?: (rec: TrekRecommendation) => void;
}

export default function RecommendationCard({ rec, onAddToCompare, compareSelected, onEnquire }: Props) {
  const cat = CATEGORY_LABELS[rec.category] ?? CATEGORY_LABELS.best_match;

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
      {/* Hero image */}
      <div className="relative h-44 bg-muted flex-shrink-0">
        {rec.hero_image_url ? (
          <img src={rec.hero_image_url} alt={rec.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Mountain className="h-10 w-10 text-muted-foreground/30" />
          </div>
        )}
        {/* Category badge */}
        <span className={`absolute top-3 left-3 text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${cat.color}`}>
          {cat.label}
        </span>
        {/* Match score */}
        <span className="absolute top-3 right-3 bg-foreground/80 text-surface text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
          <Star className="h-3 w-3 fill-accent text-accent" /> {rec.match_score}%
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1 gap-3">
        {/* Trek name + state */}
        <div>
          {rec.state && (
            <div className="flex items-center gap-1 text-[10px] uppercase tracking-widest text-accent mb-1">
              <MapPin className="h-3 w-3" /> {rec.state}
            </div>
          )}
          <h3 className="font-display text-lg font-semibold leading-snug">{rec.name}</h3>
        </div>

        {/* Facts strip */}
        <div className="grid grid-cols-2 gap-1.5 text-xs text-muted-foreground">
          {rec.duration && <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {rec.duration}</span>}
          {rec.altitude && <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {rec.altitude}</span>}
          {rec.difficulty && <span className="flex items-center gap-1"><Mountain className="h-3 w-3" /> {rec.difficulty}</span>}
          {rec.season && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {rec.season}</span>}
          {rec.permits && <span className="flex items-center gap-1 col-span-2"><FileCheck className="h-3 w-3" /> Permits: {rec.permits.length > 30 ? rec.permits.slice(0, 30) + "…" : rec.permits}</span>}
        </div>

        {/* Step 72 — structured trek intelligence badges (budget, themes, crowd) */}
        {((rec.budget_min || rec.budget_max) || rec.crowd_level || rec.themes?.length) && (
          <div className="flex flex-wrap gap-1.5">
            {(rec.budget_min || rec.budget_max) && (
              <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-accent/10 text-accent">
                <Wallet className="h-3 w-3" />
                {rec.budget_min && rec.budget_max
                  ? `₹${rec.budget_min.toLocaleString("en-IN")} – ₹${rec.budget_max.toLocaleString("en-IN")}`
                  : `From ₹${(rec.budget_min ?? rec.budget_max)!.toLocaleString("en-IN")}`}
              </span>
            )}
            {rec.crowd_level && (
              <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground capitalize">
                <Users className="h-3 w-3" /> {rec.crowd_level} crowd
              </span>
            )}
            {rec.themes?.slice(0, 2).map((theme) => (
              <span key={theme} className="text-[11px] font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground capitalize">
                {theme}
              </span>
            ))}
          </div>
        )}

        {/* Why this matches */}
        <p className="text-xs text-foreground/70 leading-relaxed border-l-2 border-accent/40 pl-3 italic">
          {rec.why_this_matches}
        </p>

        {/* Warnings */}
        {rec.warnings.length > 0 && (
          <div className="space-y-1">
            {rec.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-1.5 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                <AlertTriangle className="h-3 w-3 flex-shrink-0 mt-0.5" /> {w}
              </div>
            ))}
          </div>
        )}

        {/* CTAs */}
        <div className="flex flex-col gap-2 mt-auto pt-2">
          <Link href={`/trek/${rec.slug}`}>
            <Button variant="default" size="sm" className="w-full">View Trek Guide</Button>
          </Link>
          <div className="flex gap-2">
            {onAddToCompare && (
              <Button
                variant="outline"
                size="sm"
                className={`flex-1 text-xs ${compareSelected ? "border-accent text-accent" : ""}`}
                onClick={() => onAddToCompare(rec.slug)}
              >
                {compareSelected ? "✓ Comparing" : "Compare"}
              </Button>
            )}
            {onEnquire && (
              <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => onEnquire(rec)}>
                Get Operator Help
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
