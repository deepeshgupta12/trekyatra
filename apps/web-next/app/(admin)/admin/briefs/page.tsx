"use client";

import { useEffect, useState, useCallback } from "react";
import {
  FileText, Loader2, RefreshCw, CheckCircle, XCircle,
  Bot, ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyableId } from "@/components/admin/CopyableId";
import { AgentRunsPanel } from "@/components/admin/AgentRunsPanel";
import Link from "next/link";

interface HeadingNode {
  level: string;
  text: string;
  notes?: string;
}

interface FaqNode {
  question: string;
  answer_hint?: string;
}

interface StructuredBrief {
  page_objective?: string;
  heading_structure?: HeadingNode[];
  faqs?: FaqNode[];
  key_entities?: string[];
  secondary_keywords?: string[];
  word_count_target?: number;
  freshness_interval_days?: number;
}

interface Brief {
  id: string;
  topic_opportunity_id: string | null;
  keyword_cluster_id: string | null;
  title: string;
  target_keyword: string;
  page_type: string | null;
  intent: string | null;
  word_count_target: number | null;
  status: string;
  created_at: string;
  structured_brief: StructuredBrief | null;
}

const STATUS_STYLE: Record<string, string> = {
  review:    "text-amber-400 bg-amber-400/10 border border-amber-400/20",
  approved:  "text-pine bg-pine/10 border border-pine/20",
  rejected:  "text-red-400 bg-red-400/10 border border-red-400/20",
  draft:     "text-white/40 bg-white/5 border border-white/10",
  scheduled: "text-blue-400 bg-blue-400/10 border border-blue-400/20",
  new:       "text-white/40 bg-white/5 border border-white/10",
};

const HEADING_COLOR: Record<string, string> = {
  H1: "text-white font-semibold",
  H2: "text-white/70",
  H3: "text-white/50",
};

export default function BriefReview() {
  const [briefs, setBriefs] = useState<Brief[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [actionMap, setActionMap] = useState<Record<string, "approving" | "rejecting" | null>>({});
  const [runKey, setRunKey] = useState(0);

  // Generate brief trigger
  const [topicId, setTopicId] = useState("");
  const [targetKw, setTargetKw] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genMsg, setGenMsg] = useState("");

  const loadBriefs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await fetch("/api/v1/briefs");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setBriefs(await r.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load briefs");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBriefs(); }, [loadBriefs]);

  // Pre-fill topic_id from URL query param (?topic_id=...&kw=...)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const p = new URLSearchParams(window.location.search);
    if (p.get("topic_id")) setTopicId(p.get("topic_id")!);
    if (p.get("kw")) setTargetKw(p.get("kw")!);
  }, []);

  async function triggerGenerateBrief() {
    if (!topicId.trim() || !targetKw.trim()) {
      setGenMsg("Enter a topic UUID and target keyword");
      return;
    }
    setGenerating(true);
    setGenMsg("");
    try {
      const r = await fetch("/api/v1/admin/agents/generate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic_id: topicId.trim(), target_keyword: targetKw.trim() }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error((body as { detail?: string }).detail ?? `HTTP ${r.status}`);
      setGenMsg(`Dispatched — run #${(body as { agent_run_id: number }).agent_run_id}`);
      setRunKey(k => k + 1);
    } catch (e) {
      setGenMsg(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setGenerating(false);
    }
  }

  async function patchStatus(briefId: string, newStatus: "approved" | "rejected") {
    setActionMap(prev => ({ ...prev, [briefId]: newStatus === "approved" ? "approving" : "rejecting" }));
    try {
      const r = await fetch(`/api/v1/admin/briefs/${briefId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error((d as { detail?: string }).detail || `HTTP ${r.status}`);
      }
      await loadBriefs();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
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
        <Button variant="outline" size="sm" className="border-white/20 text-white/60 hover:text-white w-fit"
          onClick={loadBriefs} disabled={loading}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          Refresh
        </Button>
      </div>

      {/* Generate brief trigger */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-accent/10 w-7 h-7 rounded-lg flex items-center justify-center">
            <Bot className="h-3.5 w-3.5 text-accent" />
          </div>
          <h2 className="text-white font-semibold text-sm">Generate Brief</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={topicId}
            onChange={e => setTopicId(e.target.value)}
            placeholder="Topic UUID (copy from Topics page)"
            className="text-xs bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white/70 placeholder:text-white/30 w-full sm:w-72 focus:outline-none focus:border-accent/50 font-mono"
          />
          <input
            type="text"
            value={targetKw}
            onChange={e => setTargetKw(e.target.value)}
            placeholder="Target keyword"
            className="text-xs bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white/70 placeholder:text-white/30 flex-1 focus:outline-none focus:border-accent/50"
          />
          <Button variant="hero" size="sm" onClick={triggerGenerateBrief} disabled={generating} className="w-full sm:w-auto">
            {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
            {generating ? "Generating…" : "Generate brief"}
          </Button>
        </div>
        {genMsg && (
          <p className={`text-xs mt-2 ${genMsg.startsWith("Dispatched") ? "text-pine" : "text-amber-400"}`}>
            {genMsg}
          </p>
        )}
        <AgentRunsPanel key={runKey} agentType="content_brief" />
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {loading && briefs.length === 0 && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-white/30" />
        </div>
      )}

      {!loading && briefs.length === 0 && (
        <div className="bg-[#14161f] rounded-2xl border border-white/10 p-10 text-center">
          <FileText className="h-8 w-8 text-white/10 mx-auto mb-3" />
          <p className="text-white/30 text-sm">No briefs yet.</p>
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
                expanded={!!expanded[b.id]}
                onToggle={() => setExpanded(p => ({ ...p, [b.id]: !p[b.id] }))}
                actionState={actionMap[b.id] ?? null}
                onApprove={() => patchStatus(b.id, "approved")}
                onReject={() => patchStatus(b.id, "rejected")}
              />
            ))}
          </div>
        </div>
      )}

      {/* All briefs */}
      {!loading && otherBriefs.length > 0 && (
        <div>
          <p className="text-white/30 text-xs uppercase tracking-widest font-semibold mb-3 px-1">
            All briefs
          </p>
          <div className="space-y-3">
            {otherBriefs.map(b => (
              <BriefCard
                key={b.id}
                brief={b}
                expanded={!!expanded[b.id]}
                onToggle={() => setExpanded(p => ({ ...p, [b.id]: !p[b.id] }))}
                actionState={null}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function BriefCard({
  brief, expanded, onToggle, actionState, onApprove, onReject,
}: {
  brief: Brief;
  expanded: boolean;
  onToggle: () => void;
  actionState: "approving" | "rejecting" | null;
  onApprove?: () => void;
  onReject?: () => void;
}) {
  const isReview = brief.status === "review";
  const sb = brief.structured_brief;

  return (
    <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
      {/* Card header */}
      <div className="flex items-start justify-between gap-4 p-5">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2 flex-wrap mb-1.5">
            <h3 className="text-white font-semibold text-sm leading-snug">{brief.title}</h3>
            <span className={`text-[10px] font-medium px-2.5 py-0.5 rounded-full flex-shrink-0 ${STATUS_STYLE[brief.status] ?? ""}`}>
              {brief.status}
            </span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-white/40 mb-2">
            <span>Keyword: <span className="text-white/60">{brief.target_keyword}</span></span>
            {brief.page_type && <span>{brief.page_type}</span>}
            {brief.word_count_target && <span>~{brief.word_count_target.toLocaleString()} words</span>}
          </div>

          {/* UUIDs */}
          <div className="flex flex-wrap gap-3">
            <CopyableId id={brief.id} label="Brief" />
            {brief.topic_opportunity_id && <CopyableId id={brief.topic_opportunity_id} label="Topic" />}
            {brief.keyword_cluster_id && <CopyableId id={brief.keyword_cluster_id} label="Cluster" />}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {brief.status === "approved" && (
            <Link
              href={`/admin/drafts?brief_id=${brief.id}`}
              className="text-[10px] text-accent/70 hover:text-accent transition-colors font-medium"
            >
              Write draft →
            </Link>
          )}
          <button
            onClick={onToggle}
            className="text-white/40 hover:text-white/80 transition-colors"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Expanded: structured brief */}
      {expanded && sb && (
        <div className="border-t border-white/8 px-5 pb-5 pt-4 space-y-4">
          {/* Objective */}
          {sb.page_objective && (
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-1">Objective</p>
              <p className="text-white/60 text-xs leading-relaxed">{sb.page_objective}</p>
            </div>
          )}

          {/* Heading structure */}
          {sb.heading_structure && sb.heading_structure.length > 0 && (
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-2">
                Heading structure ({sb.heading_structure.length} headings)
              </p>
              <div className="space-y-1">
                {sb.heading_structure.slice(0, 10).map((h, i) => (
                  <div key={i} className={`flex items-start gap-2 text-xs ${
                    h.level === "H1" ? "" : h.level === "H2" ? "pl-3" : "pl-6"
                  }`}>
                    <span className="text-white/20 font-mono text-[10px] flex-shrink-0 w-6">{h.level}</span>
                    <span className={HEADING_COLOR[h.level] ?? "text-white/50"}>{h.text}</span>
                  </div>
                ))}
                {sb.heading_structure.length > 10 && (
                  <p className="text-white/25 text-[10px] pl-3">+{sb.heading_structure.length - 10} more headings</p>
                )}
              </div>
            </div>
          )}

          {/* FAQs */}
          {sb.faqs && sb.faqs.length > 0 && (
            <div>
              <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-2">
                FAQs ({sb.faqs.length})
              </p>
              <div className="space-y-1.5">
                {sb.faqs.slice(0, 5).map((f, i) => (
                  <div key={i} className="bg-white/3 rounded-lg px-3 py-2">
                    <p className="text-white/70 text-xs font-medium">{f.question}</p>
                    {f.answer_hint && <p className="text-white/35 text-[10px] mt-0.5">{f.answer_hint}</p>}
                  </div>
                ))}
                {sb.faqs.length > 5 && (
                  <p className="text-white/25 text-[10px] px-3">+{sb.faqs.length - 5} more FAQs</p>
                )}
              </div>
            </div>
          )}

          {/* Key entities + secondary keywords */}
          <div className="flex gap-6 flex-wrap">
            {sb.key_entities && sb.key_entities.length > 0 && (
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-1.5">Key entities</p>
                <div className="flex flex-wrap gap-1">
                  {sb.key_entities.map(e => (
                    <span key={e} className="text-[10px] text-white/50 bg-white/5 border border-white/8 px-2 py-0.5 rounded-full">{e}</span>
                  ))}
                </div>
              </div>
            )}
            {sb.secondary_keywords && sb.secondary_keywords.length > 0 && (
              <div>
                <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-1.5">Secondary keywords</p>
                <div className="flex flex-wrap gap-1">
                  {sb.secondary_keywords.slice(0, 8).map(k => (
                    <span key={k} className="text-[10px] text-blue-400/70 bg-blue-400/8 border border-blue-400/15 px-2 py-0.5 rounded-full">{k}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action bar */}
      {isReview && (
        <div className="flex items-center gap-3 px-5 py-3 border-t border-white/8">
          <Button variant="hero" size="sm" onClick={onApprove} disabled={!!actionState}>
            {actionState === "approving" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
            Approve
          </Button>
          <Button variant="outline" size="sm" className="border-white/20 text-white/60 hover:text-white ml-auto"
            onClick={onReject} disabled={!!actionState}>
            {actionState === "rejecting" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
            Reject
          </Button>
        </div>
      )}
    </div>
  );
}
