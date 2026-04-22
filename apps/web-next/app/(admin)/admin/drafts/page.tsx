"use client";

import { useState, useEffect, useCallback } from "react";
import { CheckSquare, Eye, Edit, AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Draft {
  id: string;
  title: string;
  slug: string;
  status: string;
  version: number;
  confidence_score: number | null;
  created_at: string;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  review: "In Review",
  approved: "Approved",
  published: "Published",
};

const STATUS_STYLE: Record<string, string> = {
  draft: "text-white/50 bg-white/5",
  review: "text-amber-400 bg-amber-400/10",
  approved: "text-pine bg-pine/10",
  published: "text-emerald-400 bg-emerald-400/10",
};

const NEXT_STATUS: Record<string, string | null> = {
  draft: "review",
  review: "approved",
  approved: null,
  published: null,
};

const NEXT_LABEL: Record<string, string> = {
  draft: "Submit for Review",
  review: "Approve",
};

export default function DraftReview() {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});

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
        throw new Error(body.detail ?? `HTTP ${r.status}`);
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
        throw new Error(body.detail ?? `HTTP ${r.status}`);
      }
      await fetchDrafts();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed.");
    } finally {
      setActionLoading(prev => { const n = { ...prev }; delete n[draftId]; return n; });
    }
  }

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Draft Review</h1>
          <p className="text-white/50 text-sm">Content drafts across the review and publish pipeline.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-white/20 text-white/60 hover:text-white"
          onClick={fetchDrafts}
          disabled={loading}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
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
        <div className="text-center py-16 text-white/40">No drafts yet.</div>
      ) : (
        <div className="space-y-4">
          {drafts.map(d => {
            const busy = actionLoading[d.id];
            const nextStatus = NEXT_STATUS[d.status];
            return (
              <div key={d.id} className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="text-white font-semibold">{d.title}</h3>
                    <p className="text-white/40 text-xs mt-0.5">/{d.slug} · v{d.version}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${STATUS_STYLE[d.status] ?? "text-white/40 bg-white/5"}`}>
                    {STATUS_LABELS[d.status] ?? d.status}
                  </span>
                </div>

                {d.confidence_score !== null && (
                  <div className="mb-4">
                    <p className="text-white/40 text-xs mb-1">Confidence</p>
                    <p className="text-accent font-semibold">{Math.round((d.confidence_score ?? 0) * 100)}%</p>
                  </div>
                )}

                <div className="flex items-center gap-3 pt-3 border-t border-white/8">
                  {nextStatus && nextStatus !== "approved" && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white/60 hover:text-white"
                      disabled={!!busy}
                      onClick={() => patchStatus(d.id, nextStatus)}
                    >
                      {busy === "status" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckSquare className="h-3.5 w-3.5" />}
                      {NEXT_LABEL[d.status]}
                    </Button>
                  )}
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
                  {d.status === "approved" && (
                    <Button
                      variant="hero"
                      size="sm"
                      className="ml-auto"
                      disabled={!!busy}
                      onClick={() => publishDraft(d.id)}
                    >
                      {busy === "publish" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      Publish to WordPress
                    </Button>
                  )}
                  {d.status === "draft" && (
                    <Button
                      variant="hero"
                      size="sm"
                      className="ml-auto"
                      disabled={!!busy}
                      onClick={() => patchStatus(d.id, "review")}
                    >
                      {busy === "status" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                      Submit for Review
                    </Button>
                  )}
                  {d.status === "published" && (
                    <span className="ml-auto text-emerald-400 text-xs font-medium">Published</span>
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
