"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CheckSquare,
  AlertCircle,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  FileText,
  Flag,
  Shield,
  ShieldCheck,
  ShieldX,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ComplianceResultItem,
  runComplianceCheck,
  overrideCompliance,
} from "@/lib/api";

interface Draft {
  id: string;
  title: string;
  slug: string;
  status: string;
  version: number;
  confidence_score: number | null;
  content_markdown: string | null;
  optimized_content: string | null;
  compliance_status: string;
  compliance_notes: ComplianceResultItem[] | null;
  created_at: string;
}

interface DraftClaim {
  id: string;
  claim_text: string;
  claim_type: string;
  confidence_score: number;
  flagged_for_review: boolean;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  requires_review: "Needs Review",
  review: "In Review",
  approved: "Approved",
  published: "Published",
};

const STATUS_STYLE: Record<string, string> = {
  draft: "text-white/50 bg-white/5 border border-white/10",
  requires_review: "text-amber-400 bg-amber-400/10 border border-amber-400/20",
  review: "text-blue-400 bg-blue-400/10 border border-blue-400/20",
  approved: "text-pine bg-pine/10 border border-pine/20",
  published: "text-pine bg-pine/10 border border-pine/20",
};

const COMPLIANCE_STYLE: Record<string, string> = {
  unchecked: "text-white/40 bg-white/5 border border-white/10",
  passed: "text-pine bg-pine/10 border border-pine/20",
  flagged: "text-red-400 bg-red-400/10 border border-red-400/20",
  overridden: "text-amber-400 bg-amber-400/10 border border-amber-400/20",
};

const COMPLIANCE_LABELS: Record<string, string> = {
  unchecked: "Not Checked",
  passed: "Compliant",
  flagged: "Flagged",
  overridden: "Override",
};

const CLAIM_TYPE_LABEL: Record<string, string> = {
  altitude: "Altitude",
  route_distance: "Distance",
  permit_requirement: "Permit",
  seasonality: "Season",
  cost_estimate: "Cost",
  safety_advisory: "Safety",
  operator_claim: "Operator",
  other: "Other",
};

function ComplianceIcon({ status }: { status: string }) {
  if (status === "passed") return <ShieldCheck className="h-3.5 w-3.5" />;
  if (status === "flagged") return <ShieldX className="h-3.5 w-3.5" />;
  if (status === "overridden") return <ShieldAlert className="h-3.5 w-3.5" />;
  return <Shield className="h-3.5 w-3.5" />;
}

export default function DraftReview() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});
  const [agentFeedback, setAgentFeedback] = useState<Record<string, string>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [claims, setClaims] = useState<Record<string, DraftClaim[]>>({});
  const [claimsLoading, setClaimsLoading] = useState<Record<string, boolean>>({});

  // Override drawer state
  const [overrideOpen, setOverrideOpen] = useState<Record<string, boolean>>({});
  const [overrideNote, setOverrideNote] = useState<Record<string, string>>({});

  // Write-draft trigger form
  const [writeBriefId, setWriteBriefId] = useState("");
  const [writeStatus, setWriteStatus] = useState("");
  const [writeLoading, setWriteLoading] = useState(false);

  const fetchDrafts = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/v1/drafts");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setDrafts(await r.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load drafts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDrafts(); }, [fetchDrafts]);

  // Pre-fill brief_id from URL query param (?brief_id=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    if (p.get("brief_id")) setWriteBriefId(p.get("brief_id")!);
  }, []);

  async function loadClaims(draftId: string) {
    if (claims[draftId]) return;
    setClaimsLoading(prev => ({ ...prev, [draftId]: true }));
    try {
      const r = await fetch(`/api/v1/admin/drafts/${draftId}/claims`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data: DraftClaim[] = await r.json();
      setClaims(prev => ({ ...prev, [draftId]: data }));
    } catch {
      setClaims(prev => ({ ...prev, [draftId]: [] }));
    } finally {
      setClaimsLoading(prev => { const n = { ...prev }; delete n[draftId]; return n; });
    }
  }

  function toggleExpand(draftId: string) {
    const next = !expanded[draftId];
    setExpanded(prev => ({ ...prev, [draftId]: next }));
    if (next) loadClaims(draftId);
  }

  async function patchStatus(draftId: string, newStatus: string) {
    setActionLoading(prev => ({ ...prev, [draftId]: "status" }));
    try {
      const r = await fetch(`/api/v1/admin/drafts/${draftId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error((body as { detail?: string }).detail ?? `HTTP ${r.status}`);
      }
      await fetchDrafts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Status update failed.");
    } finally {
      setActionLoading(prev => { const n = { ...prev }; delete n[draftId]; return n; });
    }
  }

  async function publishDraft(draftId: string) {
    setActionLoading(prev => ({ ...prev, [draftId]: "publish" }));
    try {
      const r = await fetch(`/api/v1/admin/drafts/${draftId}/publish`, { method: "POST" });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error((body as { detail?: string }).detail ?? `HTTP ${r.status}`);
      }
      await fetchDrafts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed.");
    } finally {
      setActionLoading(prev => { const n = { ...prev }; delete n[draftId]; return n; });
    }
  }

  async function optimizeDraft(draftId: string) {
    setActionLoading(prev => ({ ...prev, [draftId]: "optimize" }));
    setAgentFeedback(prev => { const n = { ...prev }; delete n[draftId]; return n; });
    try {
      const r = await fetch("/api/v1/admin/agents/optimize-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ draft_id: draftId }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error((body as { detail?: string }).detail ?? `HTTP ${r.status}`);
      setAgentFeedback(prev => ({ ...prev, [draftId]: `Optimise dispatched — run #${(body as { agent_run_id: number }).agent_run_id}` }));
    } catch (err) {
      setAgentFeedback(prev => ({ ...prev, [draftId]: `Error: ${err instanceof Error ? err.message : "Optimize failed"}` }));
    } finally {
      setActionLoading(prev => { const n = { ...prev }; delete n[draftId]; return n; });
    }
  }

  async function runCheck(draftId: string) {
    setActionLoading(prev => ({ ...prev, [draftId]: "compliance" }));
    try {
      await runComplianceCheck(draftId);
      await fetchDrafts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Compliance check failed.");
    } finally {
      setActionLoading(prev => { const n = { ...prev }; delete n[draftId]; return n; });
    }
  }

  async function submitOverride(draftId: string) {
    const note = overrideNote[draftId]?.trim();
    if (!note) return;
    setActionLoading(prev => ({ ...prev, [draftId]: "override" }));
    try {
      await overrideCompliance(draftId, note);
      setOverrideOpen(prev => ({ ...prev, [draftId]: false }));
      setOverrideNote(prev => ({ ...prev, [draftId]: "" }));
      await fetchDrafts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Override failed.");
    } finally {
      setActionLoading(prev => { const n = { ...prev }; delete n[draftId]; return n; });
    }
  }

  async function triggerWriteDraft(e: React.FormEvent) {
    e.preventDefault();
    if (!writeBriefId.trim()) return;
    setWriteLoading(true);
    setWriteStatus("");
    try {
      const r = await fetch("/api/v1/admin/agents/write-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief_id: writeBriefId.trim() }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error((body as { detail?: string }).detail ?? `HTTP ${r.status}`);
      setWriteStatus(`Dispatched — run #${(body as { agent_run_id: number }).agent_run_id}`);
      setWriteBriefId("");
    } catch (err) {
      setWriteStatus(err instanceof Error ? err.message : "Failed to dispatch.");
    } finally {
      setWriteLoading(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Draft Review</h1>
          <p className="text-white/50 text-sm">Content drafts across the review and publish pipeline.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-white/20 text-white/60 hover:text-white w-fit"
          onClick={fetchDrafts}
          disabled={loading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Write Draft Trigger */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-accent/10 w-7 h-7 rounded-lg flex items-center justify-center">
            <FileText className="h-3.5 w-3.5 text-accent" />
          </div>
          <h2 className="text-white font-semibold text-sm">Write Draft from Brief</h2>
        </div>
        <form onSubmit={triggerWriteDraft} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={writeBriefId}
            onChange={e => setWriteBriefId(e.target.value)}
            placeholder="Approved brief UUID"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-accent/50"
          />
          <Button
            type="submit"
            variant="hero"
            size="sm"
            disabled={writeLoading || !writeBriefId.trim()}
            className="w-full sm:w-auto"
          >
            {writeLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Write Draft
          </Button>
        </form>
        {writeStatus && (
          <p className={`text-xs mt-2 ${writeStatus.startsWith("Dispatched") ? "text-pine" : "text-amber-400"}`}>
            {writeStatus}
          </p>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-amber-400 text-sm bg-amber-400/10 border border-amber-400/20 rounded-xl px-4 py-3 mb-6">
          <AlertCircle className="h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}

      {loading && drafts.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-white/40">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading drafts…
        </div>
      ) : drafts.length === 0 ? (
        <div className="text-center py-16 text-white/40">No drafts yet. Use the form above to write one from an approved brief.</div>
      ) : (
        <div className="space-y-4">
          {drafts.map(d => {
            const busy = actionLoading[d.id];
            const isExpanded = expanded[d.id];
            const draftClaims = claims[d.id] ?? [];
            const flaggedClaims = draftClaims.filter(c => c.flagged_for_review);
            const previewContent = d.optimized_content || d.content_markdown;
            const compStatus = d.compliance_status ?? "unchecked";
            const compNotes: ComplianceResultItem[] = d.compliance_notes ?? [];
            const isOverrideOpen = overrideOpen[d.id] ?? false;

            return (
              <div key={d.id} className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
                {/* Card header */}
                <div className="flex items-start justify-between gap-4 p-5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-3 flex-wrap">
                      <h3 className="text-white font-semibold text-sm">{d.title}</h3>
                      <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLE[d.status] ?? "text-white/40 bg-white/5 border border-white/10"}`}>
                        {STATUS_LABELS[d.status] ?? d.status}
                      </span>
                      {/* Compliance badge */}
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${COMPLIANCE_STYLE[compStatus] ?? COMPLIANCE_STYLE.unchecked}`}>
                        <ComplianceIcon status={compStatus} />
                        {COMPLIANCE_LABELS[compStatus] ?? compStatus}
                      </span>
                      {d.optimized_content && (
                        <span className="text-xs font-medium px-2.5 py-0.5 rounded-full text-purple-400 bg-purple-500/10 border border-purple-400/20 flex-shrink-0">
                          SEO optimised
                        </span>
                      )}
                    </div>
                    <p className="text-white/40 text-xs mt-1">/{d.slug} · v{d.version}</p>
                    {d.confidence_score !== null && (
                      <p className="text-white/50 text-xs mt-1">
                        Confidence: <span className="text-accent font-semibold">{Math.round((d.confidence_score ?? 0) * 100)}%</span>
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleExpand(d.id)}
                    className="text-white/40 hover:text-white/80 transition-colors flex-shrink-0 mt-0.5"
                  >
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>
                </div>

                {/* Expanded detail */}
                {isExpanded && (
                  <div className="border-t border-white/8 px-5 pb-5 pt-4 space-y-4">
                    {/* Compliance results */}
                    {compNotes.length > 0 && (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-3.5 w-3.5 text-white/40" />
                          <p className="text-xs text-white/40 font-medium">
                            Compliance results — {compNotes.filter(r => r.status === "fail").length} failed, {compNotes.filter(r => r.status === "warn").length} warnings
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          {compNotes.map((item, i) => (
                            <div
                              key={i}
                              className={`rounded-xl px-3 py-2 text-xs flex items-start gap-2 ${
                                item.status === "fail"
                                  ? "bg-red-400/8 border border-red-400/20"
                                  : item.status === "warn"
                                  ? "bg-amber-400/8 border border-amber-400/20"
                                  : "bg-white/3 border border-white/8"
                              }`}
                            >
                              <span className={`font-medium px-1.5 py-0.5 rounded text-xs flex-shrink-0 ${
                                item.status === "fail" ? "bg-red-400/20 text-red-400"
                                : item.status === "warn" ? "bg-amber-400/20 text-amber-400"
                                : "bg-white/10 text-white/50"
                              }`}>
                                {item.status.toUpperCase()}
                              </span>
                              <div className="flex-1 min-w-0">
                                <p className={`font-medium ${item.status === "fail" ? "text-red-300/90" : item.status === "warn" ? "text-amber-300/80" : "text-white/60"}`}>
                                  {item.rule}
                                </p>
                                {item.note && <p className="text-white/40 mt-0.5">{item.note}</p>}
                                {item.suggestion && (
                                  <p className="text-white/30 mt-0.5 italic">{item.suggestion}</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Override input (for flagged drafts) */}
                    {compStatus === "flagged" && isOverrideOpen && (
                      <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-3 space-y-2">
                        <p className="text-amber-400 text-xs font-medium">Compliance Override — Editor note required</p>
                        <textarea
                          value={overrideNote[d.id] ?? ""}
                          onChange={e => setOverrideNote(prev => ({ ...prev, [d.id]: e.target.value }))}
                          placeholder="Explain why this content is approved despite compliance flags…"
                          rows={3}
                          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-amber-400/40 resize-none"
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/20 text-white/60 hover:text-white"
                            onClick={() => setOverrideOpen(prev => ({ ...prev, [d.id]: false }))}
                            disabled={!!busy}
                          >
                            Cancel
                          </Button>
                          <Button
                            variant="hero"
                            size="sm"
                            disabled={!!busy || !(overrideNote[d.id]?.trim())}
                            onClick={() => submitOverride(d.id)}
                          >
                            {busy === "override" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                            Confirm Override
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Fact-check claims */}
                    {claimsLoading[d.id] ? (
                      <div className="flex items-center gap-2 text-white/40 text-xs">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading claims…
                      </div>
                    ) : draftClaims.length > 0 ? (
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Flag className="h-3.5 w-3.5 text-white/40" />
                          <p className="text-xs text-white/40 font-medium">
                            Fact-check claims — {flaggedClaims.length} flagged
                          </p>
                        </div>
                        <div className="space-y-1.5">
                          {draftClaims.map(claim => (
                            <div
                              key={claim.id}
                              className={`rounded-xl px-3 py-2 text-xs flex items-start gap-2 ${
                                claim.flagged_for_review
                                  ? "bg-amber-400/8 border border-amber-400/20"
                                  : "bg-white/3 border border-white/8"
                              }`}
                            >
                              <span className={`font-medium px-1.5 py-0.5 rounded text-xs flex-shrink-0 ${
                                claim.flagged_for_review ? "bg-amber-400/20 text-amber-400" : "bg-white/10 text-white/50"
                              }`}>
                                {CLAIM_TYPE_LABEL[claim.claim_type] ?? claim.claim_type}
                              </span>
                              <span className={`flex-1 ${claim.flagged_for_review ? "text-amber-300/80" : "text-white/60"}`}>
                                {claim.claim_text}
                              </span>
                              <span className={`flex-shrink-0 font-semibold ${
                                claim.confidence_score >= 0.7 ? "text-pine" : "text-amber-400"
                              }`}>
                                {Math.round(claim.confidence_score * 100)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {/* Content preview */}
                    {previewContent && (
                      <div>
                        <p className="text-xs text-white/40 font-medium mb-2">
                          {d.optimized_content ? "Optimised content preview" : "Content preview"}
                        </p>
                        <div className="bg-[#0c0e14] rounded-xl border border-white/8 p-3 max-h-48 overflow-y-auto">
                          <pre className="text-white/60 text-xs font-mono whitespace-pre-wrap leading-relaxed">
                            {previewContent.slice(0, 1200)}{previewContent.length > 1200 ? "\n…" : ""}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Agent dispatch feedback */}
                {agentFeedback[d.id] && (
                  <div className={`px-5 py-2 text-xs border-t border-white/8 ${agentFeedback[d.id].startsWith("Error") ? "text-amber-400" : "text-pine"}`}>
                    {agentFeedback[d.id]}
                  </div>
                )}

                {/* Action bar */}
                <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-t border-white/8">
                  {/* Optimize */}
                  {(d.status === "draft" || d.status === "requires_review" || d.status === "review") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white/60 hover:text-white"
                      disabled={!!busy}
                      onClick={() => optimizeDraft(d.id)}
                    >
                      {busy === "optimize" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      Optimize
                    </Button>
                  )}

                  {/* Submit for review */}
                  {(d.status === "draft" || d.status === "requires_review") && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white/60 hover:text-white"
                      disabled={!!busy}
                      onClick={() => patchStatus(d.id, "review")}
                    >
                      {busy === "status" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckSquare className="h-3.5 w-3.5" />}
                      Submit for Review
                    </Button>
                  )}

                  {/* Send back */}
                  {d.status === "review" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white/60 hover:text-white"
                      disabled={!!busy}
                      onClick={() => patchStatus(d.id, "draft")}
                    >
                      Send Back
                    </Button>
                  )}

                  {/* Compliance check — available for non-published drafts */}
                  {d.status !== "published" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className={`border-white/20 ${
                        compStatus === "flagged"
                          ? "text-red-400 hover:text-red-300"
                          : compStatus === "passed"
                          ? "text-pine hover:text-pine/80"
                          : "text-white/60 hover:text-white"
                      }`}
                      disabled={!!busy}
                      onClick={() => runCheck(d.id)}
                    >
                      {busy === "compliance" ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Shield className="h-3.5 w-3.5" />
                      )}
                      {compStatus === "unchecked" ? "Check Compliance" : "Re-check"}
                    </Button>
                  )}

                  {/* Override button — only for flagged */}
                  {compStatus === "flagged" && d.status !== "published" && !isOverrideOpen && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-amber-400/30 text-amber-400 hover:text-amber-300"
                      disabled={!!busy}
                      onClick={() => {
                        setOverrideOpen(prev => ({ ...prev, [d.id]: true }));
                        setExpanded(prev => ({ ...prev, [d.id]: true }));
                        loadClaims(d.id);
                      }}
                    >
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Override
                    </Button>
                  )}

                  {/* Approve */}
                  {d.status === "review" && (
                    <Button
                      variant="hero"
                      size="sm"
                      className="ml-auto"
                      disabled={!!busy}
                      onClick={() => patchStatus(d.id, "approved")}
                    >
                      {busy === "status" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      Approve
                    </Button>
                  )}

                  {/* Publish */}
                  {d.status === "approved" && (
                    <Button
                      variant="hero"
                      size="sm"
                      className="ml-auto"
                      disabled={!!busy}
                      onClick={() => publishDraft(d.id)}
                    >
                      {busy === "publish" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      Publish to Master CMS
                    </Button>
                  )}

                  {d.status === "published" && (
                    <span className="ml-auto text-pine text-xs font-medium">Published</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
