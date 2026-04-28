"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Filter, Loader2, ExternalLink, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchFactCheckClaims, patchFactCheckClaim, triggerFactCheck, type FactCheckClaim } from "@/lib/api";

const CLAIM_TYPE_LABELS: Record<string, string> = {
  route_distance: "Route distance",
  altitude: "Altitude",
  permit_requirement: "Permit",
  seasonality: "Seasonality",
  cost_estimate: "Cost estimate",
  safety_advisory: "Safety",
  operator_claim: "Operator claim",
  emergency_contact: "Emergency contact",
  medical_advisory: "Medical advisory",
  general_fact: "General fact",
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
  const [claimBusy, setClaimBusy] = useState<Record<string, string | null>>({});
  // Per-draft trigger state: draftId → "triggering" | "done:{N}" | null
  const [triggerBusy, setTriggerBusy] = useState<Record<string, string | null>>({});

  function load() {
    setLoading(true);
    setError(null);
    fetchFactCheckClaims(flaggedOnly)
      .then(setClaims)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [flaggedOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleMarkVerified(claimId: string) {
    setClaimBusy((prev) => ({ ...prev, [claimId]: "verifying" }));
    try {
      await patchFactCheckClaim(claimId, false);
      setClaims((prev) => prev.map((c) => c.id === claimId ? { ...c, flagged_for_review: false } : c));
    } catch {
      setError("Failed to update claim. Please try again.");
    } finally {
      setClaimBusy((prev) => ({ ...prev, [claimId]: null }));
    }
  }

  async function handleFlagForEditor(claimId: string) {
    setClaimBusy((prev) => ({ ...prev, [claimId]: "flagging" }));
    try {
      await patchFactCheckClaim(claimId, true);
      setClaimBusy((prev) => ({ ...prev, [claimId]: "editor_flagged" }));
    } catch {
      setError("Failed to flag claim. Please try again.");
      setClaimBusy((prev) => ({ ...prev, [claimId]: null }));
    }
  }

  async function handleTriggerFactCheck(draftId: string) {
    setTriggerBusy((prev) => ({ ...prev, [draftId]: "triggering" }));
    try {
      const res = await triggerFactCheck(draftId);
      setTriggerBusy((prev) => ({ ...prev, [draftId]: `done:${res.claims_extracted}` }));
      load(); // refresh claim list
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Fact-check trigger failed.");
      setTriggerBusy((prev) => ({ ...prev, [draftId]: null }));
    }
  }

  // Group claims by draft so we can show a "Re-run fact-check" button per draft.
  const byDraft = claims.reduce<Record<string, { title: string; claims: FactCheckClaim[] }>>(
    (acc, c) => {
      if (!acc[c.draft_id]) acc[c.draft_id] = { title: c.draft_title, claims: [] };
      acc[c.draft_id].claims.push(c);
      return acc;
    },
    {}
  );

  const flaggedCount = claims.filter((c) => c.flagged_for_review).length;
  const ymylCount = claims.filter((c) => c.ymyl_flag).length;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Fact Check</h1>
          <p className="text-white/50 text-sm">
            AI-extracted claims from drafts.
            {flaggedCount > 0 && <span className="text-amber-400"> {flaggedCount} need review.</span>}
            {ymylCount > 0 && <span className="text-red-400"> {ymylCount} YMYL.</span>}
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

      {loading && <div className="text-white/40 text-sm py-12 text-center">Loading claims…</div>}
      {error && (
        <div className="text-red-400 text-sm py-4 bg-red-400/10 border border-red-400/20 rounded-2xl px-5 mb-4">
          {error}
        </div>
      )}
      {!loading && !error && claims.length === 0 && (
        <div className="text-white/30 text-sm py-12 text-center">
          No claims found. Run the pipeline to generate fact-checked drafts.
        </div>
      )}

      <div className="space-y-6">
        {Object.entries(byDraft).map(([draftId, { title, claims: draftClaims }]) => {
          const triggerState = triggerBusy[draftId];
          const isDone = triggerState?.startsWith("done:");
          const doneCount = isDone ? triggerState!.split(":")[1] : null;

          return (
            <div key={draftId} className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
              {/* Draft header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
                <p className="text-white font-semibold text-sm truncate">{title}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/20 text-white/50 hover:text-white text-xs gap-1.5 flex-shrink-0"
                  disabled={triggerState === "triggering"}
                  onClick={() => handleTriggerFactCheck(draftId)}
                >
                  {triggerState === "triggering" ? (
                    <><Loader2 className="h-3 w-3 animate-spin" /> Running…</>
                  ) : isDone ? (
                    <><CheckCircle className="h-3 w-3 text-pine" /> {doneCount} claims extracted</>
                  ) : (
                    "Re-run fact-check"
                  )}
                </Button>
              </div>

              {/* Claims list */}
              <div className="divide-y divide-white/5">
                {draftClaims.map((c) => {
                  const flagged = c.flagged_for_review;
                  const pct = Math.round(c.confidence_score * 100);
                  const badgeStyle = flagged
                    ? "text-amber-400 bg-amber-400/10 border border-amber-400/20"
                    : "text-pine bg-pine/10 border border-pine/20";
                  const BadgeIcon = flagged ? AlertTriangle : CheckCircle;

                  return (
                    <div key={c.id} className="px-5 py-4">
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-start gap-2 min-w-0">
                          {c.ymyl_flag && (
                            <ShieldAlert className="h-3.5 w-3.5 text-red-400 flex-shrink-0 mt-0.5" aria-label="YMYL — safety-critical claim" />
                          )}
                          <p className="text-white font-medium text-sm">&#8220;{c.claim_text}&#8221;</p>
                        </div>
                        <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${badgeStyle}`}>
                          <BadgeIcon className="h-3 w-3" />
                          {flagged ? "Needs review" : "Low risk"}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-x-4 gap-y-0.5">
                        <p className="text-white/40 text-xs">
                          Type: <span className="text-white/60">{CLAIM_TYPE_LABELS[c.claim_type] ?? c.claim_type}</span>
                        </p>
                        {c.ymyl_flag && (
                          <p className="text-red-400/70 text-xs font-medium">YMYL</p>
                        )}
                        {c.evidence_url && (
                          <a
                            href={c.evidence_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent/70 text-xs flex items-center gap-0.5 hover:text-accent"
                          >
                            <ExternalLink className="h-3 w-3" /> Source
                          </a>
                        )}
                      </div>

                      <ConfidenceBar score={c.confidence_score} />

                      {flagged && (
                        <div className="flex gap-2 mt-4 pt-3 border-t border-white/8">
                          {claimBusy[c.id] === "editor_flagged" ? (
                            <span className="text-xs text-pine px-2 py-1">Sent to editor queue ✓</span>
                          ) : (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-white/20 text-white/60 hover:text-pine hover:border-pine/40 text-xs"
                                disabled={!!claimBusy[c.id]}
                                onClick={() => handleMarkVerified(c.id)}
                              >
                                {claimBusy[c.id] === "verifying"
                                  ? <Loader2 className="h-3 w-3 animate-spin" />
                                  : <CheckCircle className="h-3 w-3" />}
                                Mark verified
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-white/20 text-white/60 hover:text-amber-400 hover:border-amber-400/40 text-xs"
                                disabled={!!claimBusy[c.id]}
                                onClick={() => handleFlagForEditor(c.id)}
                              >
                                {claimBusy[c.id] === "flagging"
                                  ? <Loader2 className="h-3 w-3 animate-spin" />
                                  : <AlertTriangle className="h-3 w-3" />}
                                Flag for editor
                              </Button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
