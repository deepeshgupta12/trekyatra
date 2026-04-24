"use client";

import { useEffect, useState } from "react";
import { CheckSquare, AlertTriangle, CheckCircle, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchFactCheckClaims, type FactCheckClaim } from "@/lib/api";

const CLAIM_TYPE_LABELS: Record<string, string> = {
  route_distance: "Route distance",
  altitude: "Altitude",
  permit_requirement: "Permit",
  seasonality: "Seasonality",
  cost_estimate: "Cost estimate",
  safety_advisory: "Safety",
  operator_claim: "Operator claim",
};

function ConfidenceBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 70 ? "bg-pine" : pct >= 50 ? "bg-amber-400" : "bg-red-400";
  return (
    <div className="flex items-center gap-2 mt-3">
      <div className="h-1 w-24 rounded-full bg-white/10">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-white/40 text-xs">{pct}% confidence</span>
    </div>
  );
}

export default function FactCheck() {
  const [claims, setClaims] = useState<FactCheckClaim[]>([]);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchFactCheckClaims(flaggedOnly)
      .then(setClaims)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [flaggedOnly]);

  const flaggedCount = claims.filter((c) => c.flagged_for_review).length;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Fact Check</h1>
          <p className="text-white/50 text-sm">
            AI-flagged claims from published and pending drafts. {flaggedCount > 0 && `${flaggedCount} need review.`}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className={`flex items-center gap-2 w-fit border-white/20 text-xs ${
            flaggedOnly ? "text-amber-400 border-amber-400/40" : "text-white/60 hover:text-white"
          }`}
          onClick={() => setFlaggedOnly((f) => !f)}
        >
          <Filter className="h-3 w-3" />
          {flaggedOnly ? "Showing flagged only" : "Show flagged only"}
        </Button>
      </div>

      {loading && (
        <div className="text-white/40 text-sm py-12 text-center">Loading claims…</div>
      )}

      {error && (
        <div className="text-red-400 text-sm py-4 bg-red-400/10 border border-red-400/20 rounded-2xl px-5">
          {error}
        </div>
      )}

      {!loading && !error && claims.length === 0 && (
        <div className="text-white/30 text-sm py-12 text-center">
          No claims found. Run the pipeline to generate fact-checked drafts.
        </div>
      )}

      <div className="space-y-3">
        {claims.map((c) => {
          const flagged = c.flagged_for_review;
          const pct = Math.round(c.confidence_score * 100);
          const badgeStyle = flagged
            ? "text-amber-400 bg-amber-400/10 border border-amber-400/20"
            : "text-pine bg-pine/10 border border-pine/20";
          const BadgeIcon = flagged ? AlertTriangle : CheckCircle;
          const badgeLabel = flagged ? "Needs review" : "Low risk";

          return (
            <div key={c.id} className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
              <div className="flex items-start justify-between gap-4 mb-2">
                <p className="text-white font-medium text-sm">&#8220;{c.claim_text}&#8221;</p>
                <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${badgeStyle}`}>
                  <BadgeIcon className="h-3 w-3" /> {badgeLabel}
                </span>
              </div>
              <p className="text-white/40 text-xs mb-1">
                Article: <span className="text-white/60">{c.draft_title}</span>
              </p>
              <p className="text-white/40 text-xs">
                Type: <span className="text-white/60">{CLAIM_TYPE_LABELS[c.claim_type] ?? c.claim_type}</span>
              </p>
              <ConfidenceBar score={c.confidence_score} />
              {flagged && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-white/8">
                  <Button variant="outline" size="sm" className="border-white/20 text-white/60 hover:text-white text-xs">
                    Mark verified
                  </Button>
                  <Button variant="outline" size="sm" className="border-white/20 text-white/60 hover:text-white text-xs">
                    Flag for editor
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
