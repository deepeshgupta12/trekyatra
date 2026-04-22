"use client";

import { useEffect, useState } from "react";
import { FileText, ArrowRight, Loader2, RefreshCw, CheckCircle, XCircle, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Brief {
  id: string;
  title: string;
  target_keyword: string;
  page_type: string | null;
  intent: string | null;
  word_count_target: number | null;
  status: string;
  created_at: string;
  structured_brief: Record<string, unknown> | null;
}

const statusStyle: Record<string, string> = {
  review: "text-amber-400 bg-amber-400/10 border border-amber-400/20",
  approved: "text-pine bg-pine/10 border border-pine/20",
  rejected: "text-red-400 bg-red-400/10 border border-red-400/20",
  draft: "text-white/40 bg-white/5 border border-white/10",
  scheduled: "text-blue-400 bg-blue-400/10 border border-blue-400/20",
  new: "text-white/40 bg-white/5 border border-white/10",
};

export default function BriefReview() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Generate brief trigger state
  const [topicId, setTopicId] = useState("");
  const [targetKw, setTargetKw] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genRunId, setGenRunId] = useState<number | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  // Per-brief action state
  const [actionMap, setActionMap] = useState<Record<string, "approving" | "rejecting" | null>>({});

  async function loadBriefs() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/briefs");
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      setBriefs(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load briefs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBriefs();
  }, []);

  async function triggerGenerateBrief() {
    if (!topicId.trim() || !targetKw.trim()) {
      setGenError("Enter a topic UUID and target keyword");
      return;
    }
    setGenerating(true);
    setGenError(null);
    try {
      const res = await fetch("/api/v1/admin/agents/generate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic_id: topicId.trim(), target_keyword: targetKw.trim() }),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      setGenRunId(data.agent_run_id);
    } catch (err: unknown) {
      setGenError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setGenerating(false);
    }
  }

  async function patchStatus(briefId: string, newStatus: "approved" | "rejected") {
    setActionMap(prev => ({ ...prev, [briefId]: newStatus === "approved" ? "approving" : "rejecting" }));
    try {
      const res = await fetch(`/api/v1/admin/briefs/${briefId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        throw new Error(detail.detail || `${res.status}`);
      }
      await loadBriefs();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Action failed");
    } finally {
      setActionMap(prev => ({ ...prev, [briefId]: null }));
    }
  }

  const reviewBriefs = briefs.filter(b => b.status === "review");
  const otherBriefs = briefs.filter(b => b.status !== "review");

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Brief Review</h1>
          <p className="text-white/50 text-sm">AI-generated content briefs awaiting approval.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="border-white/20 text-white/60 hover:text-white w-fit"
          onClick={loadBriefs}
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </div>

      {/* Generate brief trigger */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Bot className="h-4 w-4 text-accent" />
          <h2 className="text-white font-semibold text-sm">Generate Brief</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={topicId}
            onChange={e => setTopicId(e.target.value)}
            placeholder="Topic UUID"
            className="text-xs bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white/70 placeholder-white/30 w-full sm:w-64 focus:outline-none focus:border-white/40"
          />
          <input
            type="text"
            value={targetKw}
            onChange={e => setTargetKw(e.target.value)}
            placeholder="Target keyword"
            className="text-xs bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white/70 placeholder-white/30 w-full sm:flex-1 focus:outline-none focus:border-white/40"
          />
          <Button
            variant="hero"
            size="sm"
            onClick={triggerGenerateBrief}
            disabled={generating}
            className="w-full sm:w-auto"
          >
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
            {generating ? "Generating…" : "Generate brief"}
          </Button>
        </div>
        {genRunId && (
          <p className="text-xs text-green-400 mt-2">
            Agent run #{genRunId} dispatched — brief will appear in the queue when complete.
          </p>
        )}
        {genError && <p className="text-xs text-red-400 mt-2">{genError}</p>}
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-white/30" />
        </div>
      )}

      {!loading && briefs.length === 0 && (
        <div className="bg-[#14161f] rounded-2xl border border-white/10 p-10 text-center">
          <FileText className="h-8 w-8 text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">No briefs yet.</p>
          <p className="text-white/20 text-xs mt-1">Trigger the agent above to generate the first brief.</p>
        </div>
      )}

      {/* Review queue */}
      {!loading && reviewBriefs.length > 0 && (
        <div className="mb-6">
          <p className="text-white/30 text-xs uppercase tracking-widest font-semibold mb-3 px-1">
            Needs review ({reviewBriefs.length})
          </p>
          <div className="space-y-4">
            {reviewBriefs.map(b => (
              <BriefCard
                key={b.id}
                brief={b}
                actionState={actionMap[b.id] ?? null}
                onApprove={() => patchStatus(b.id, "approved")}
                onReject={() => patchStatus(b.id, "rejected")}
              />
            ))}
          </div>
        </div>
      )}

      {/* Other briefs */}
      {!loading && otherBriefs.length > 0 && (
        <div>
          <p className="text-white/30 text-xs uppercase tracking-widest font-semibold mb-3 px-1">
            All briefs
          </p>
          <div className="space-y-3">
            {otherBriefs.map(b => (
              <BriefCard key={b.id} brief={b} actionState={null} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BriefCard({
  brief,
  actionState,
  onApprove,
  onReject,
}: {
  brief: Brief;
  actionState: "approving" | "rejecting" | null;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  const isReview = brief.status === "review";
  const created = new Date(brief.created_at).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (
    <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <h3 className="text-white font-semibold mb-1 truncate">{brief.title}</h3>
          <div className="flex flex-wrap gap-3 text-xs text-white/40">
            <span>Keyword: <span className="text-white/60">{brief.target_keyword}</span></span>
            {brief.page_type && <span>{brief.page_type}</span>}
            {brief.word_count_target && <span>~{brief.word_count_target.toLocaleString()} words</span>}
            <span>{created}</span>
          </div>
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${statusStyle[brief.status] ?? ""}`}>
          {brief.status}
        </span>
      </div>

      {isReview && (
        <div className="flex items-center gap-3 pt-3 border-t border-white/8">
          <Button
            variant="hero"
            size="sm"
            onClick={onApprove}
            disabled={!!actionState}
          >
            {actionState === "approving"
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <CheckCircle className="h-3.5 w-3.5" />}
            Approve
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="border-white/20 text-white/60 hover:text-white hover:border-red-400/40 ml-auto"
            onClick={onReject}
            disabled={!!actionState}
          >
            {actionState === "rejecting"
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <XCircle className="h-3.5 w-3.5" />}
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}
