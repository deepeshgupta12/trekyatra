"use client";

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  cancelPipelineRun,
  fetchPipelineRuns,
  resumePipelineRun,
  triggerPipeline,
  type PipelineRun,
  type PipelineStage,
} from "@/lib/api";

// ── constants ────────────────────────────────────────────────────────────────

const ALL_STAGES = [
  "trend_discovery",
  "keyword_cluster",
  "content_brief",
  "content_writing",
  "seo_aeo",
  "publish",
] as const;

const STAGE_LABELS: Record<string, string> = {
  trend_discovery: "Trends",
  keyword_cluster: "Clusters",
  content_brief:   "Brief",
  content_writing: "Draft",
  seo_aeo:         "SEO/AEO",
  publish:         "Publish",
};

const STATUS_STYLE: Record<string, string> = {
  running:                    "text-blue-400  bg-blue-400/10  border border-blue-400/20",
  paused_at_brief_approval:   "text-amber-400 bg-amber-400/10 border border-amber-400/20",
  paused_at_draft_approval:   "text-amber-400 bg-amber-400/10 border border-amber-400/20",
  completed:                  "text-pine      bg-pine/10      border border-pine/20",
  failed:                     "text-red-400   bg-red-400/10   border border-red-400/20",
  cancelled:                  "text-white/40  bg-white/5      border border-white/10",
};

const STAGE_STATUS_STYLE: Record<string, string> = {
  running:   "text-blue-400",
  completed: "text-pine",
  failed:    "text-red-400",
  pending:   "text-white/30",
  skipped:   "text-white/20",
};

// ── helpers ──────────────────────────────────────────────────────────────────

function statusLabel(status: string): string {
  return status === "paused_at_brief_approval" ? "⏸ Brief approval"
    : status === "paused_at_draft_approval"    ? "⏸ Draft approval"
    : status;
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1)   return "just now";
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function stageIcon(stage: PipelineStage) {
  if (stage.status === "completed") return <CheckCircle2 className="h-3.5 w-3.5 text-pine" />;
  if (stage.status === "failed")    return <AlertTriangle className="h-3.5 w-3.5 text-red-400" />;
  if (stage.status === "running")   return <Loader2 className="h-3.5 w-3.5 text-blue-400 animate-spin" />;
  return <div className="h-3.5 w-3.5 rounded-full border border-white/20" />;
}

// ── sub-components ───────────────────────────────────────────────────────────

function StageTrack({ run }: { run: PipelineRun }) {
  const stageMap = new Map(run.stages.map(s => [s.stage_name, s]));
  const startIdx = ALL_STAGES.indexOf(run.start_stage as typeof ALL_STAGES[number]);
  const endIdx   = ALL_STAGES.indexOf(run.end_stage   as typeof ALL_STAGES[number]);
  const relevant = ALL_STAGES.slice(
    startIdx >= 0 ? startIdx : 0,
    endIdx   >= 0 ? endIdx + 1 : ALL_STAGES.length,
  );

  return (
    <div className="flex items-center gap-1 flex-wrap mt-2">
      {relevant.map((name, i) => {
        const stage = stageMap.get(name);
        const isCurrent = run.current_stage === name;
        return (
          <div key={name} className="flex items-center gap-1">
            {i > 0 && <div className="w-4 h-px bg-white/10" />}
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium border
                ${isCurrent ? "border-blue-400/40 bg-blue-400/10" : "border-white/8 bg-white/3"}
                ${stage ? STAGE_STATUS_STYLE[stage.status] : "text-white/25"}`}
              title={stage?.error_detail ?? undefined}
            >
              {stage ? stageIcon(stage) : <div className="h-3.5 w-3.5 rounded-full border border-white/10" />}
              {STAGE_LABELS[name] ?? name}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RunCard({
  run,
  onResume,
  onCancel,
  busy,
}: {
  run: PipelineRun;
  onResume: (id: string) => void;
  onCancel: (id: string) => void;
  busy: string | null;
}) {
  const isPaused  = run.status.startsWith("paused_at_");
  const isActive  = run.status === "running" || isPaused;
  const output    = run.output_json ? (() => { try { return JSON.parse(run.output_json); } catch { return {}; } })() : {};
  const isBusy    = busy === run.id;

  return (
    <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
      {/* header row */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[run.status] ?? STATUS_STYLE.cancelled}`}>
              {statusLabel(run.status)}
            </span>
            <span className="text-white/30 text-xs">{run.pipeline_type}</span>
            <span className="text-white/20 text-xs">{relativeTime(run.created_at)}</span>
          </div>
          <p className="text-white/40 text-xs mt-1 font-mono">
            {run.start_stage} → {run.end_stage}
          </p>
        </div>

        {/* actions */}
        <div className="flex gap-2 flex-shrink-0">
          {isPaused && (
            <Button
              variant="hero"
              size="sm"
              className="text-xs"
              disabled={isBusy}
              onClick={() => onResume(run.id)}
            >
              {isBusy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
              Resume
            </Button>
          )}
          {isActive && (
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 text-white/50 hover:text-white text-xs"
              disabled={isBusy}
              onClick={() => onCancel(run.id)}
            >
              <X className="h-3 w-3" /> Cancel
            </Button>
          )}
        </div>
      </div>

      {/* approval gate notice */}
      {isPaused && (
        <div className="mt-3 px-3 py-2 rounded-xl bg-amber-400/8 border border-amber-400/20 text-amber-400 text-xs flex items-start gap-2">
          <Pause className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <span>
            {run.status === "paused_at_brief_approval"
              ? "Waiting for brief approval — go to Briefs, approve the brief, then resume."
              : "Waiting for draft approval — go to Drafts, approve the draft, then resume."}
          </span>
        </div>
      )}

      {/* error detail */}
      {run.error_detail && (
        <div className="mt-3 px-3 py-2 rounded-xl bg-red-400/8 border border-red-400/20 text-red-400 text-xs font-mono">
          {run.error_detail}
        </div>
      )}

      {/* stage track */}
      <StageTrack run={run} />

      {/* output summary */}
      {Object.keys(output).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {output.topic_ids?.length   > 0 && <Chip label={`${output.topic_ids.length} topics`}   color="text-purple-400 bg-purple-400/10" />}
          {output.cluster_ids?.length > 0 && <Chip label={`${output.cluster_ids.length} clusters`} color="text-blue-400 bg-blue-400/10" />}
          {output.brief_id            && <Chip label="Brief created"   color="text-amber-400 bg-amber-400/10" />}
          {output.draft_id            && <Chip label="Draft created"   color="text-white/60 bg-white/5" />}
          {output.published_url       && <Chip label={output.published_url} color="text-pine bg-pine/10" />}
        </div>
      )}
    </div>
  );
}

function Chip({ label, color }: { label: string; color: string }) {
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${color}`}>{label}</span>
  );
}

// ── trigger form ──────────────────────────────────────────────────────────────

const START_OPTIONS = [
  { value: "trend_discovery", label: "Full (Trends → Publish)" },
  { value: "content_brief",   label: "From brief (requires topic_id in context)" },
  { value: "content_writing", label: "From writing (needs brief_id)" },
  { value: "seo_aeo",         label: "From SEO (needs draft_id)" },
  { value: "publish",         label: "Publish only (needs draft_id)" },
];

const END_MAP: Record<string, string> = {
  trend_discovery: "publish",
  content_brief:   "content_brief",
  content_writing: "publish",
  seo_aeo:         "publish",
  publish:         "publish",
};

function TriggerForm({ onTriggered }: { onTriggered: () => void }) {
  const [open, setOpen]           = useState(false);
  const [startStage, setStart]    = useState("trend_discovery");
  const [seedTopics, setTopics]   = useState("");
  const [briefId, setBriefId]     = useState("");
  const [draftId, setDraftId]     = useState("");
  const [busy, setBusy]           = useState(false);
  const [error, setError]         = useState("");

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await triggerPipeline({
        start_stage:  startStage,
        end_stage:    END_MAP[startStage] ?? "publish",
        seed_topics:  seedTopics ? seedTopics.split(",").map(s => s.trim()).filter(Boolean) : undefined,
        brief_id:     briefId || undefined,
        draft_id:     draftId || undefined,
      });
      setOpen(false);
      setTopics("");
      setBriefId("");
      setDraftId("");
      onTriggered();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to trigger");
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <Button variant="hero" size="sm" className="w-fit" onClick={() => setOpen(true)}>
        <Zap className="h-3.5 w-3.5" /> Run pipeline
      </Button>
    );
  }

  return (
    <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5 w-full sm:w-[420px]">
      <h2 className="text-white font-semibold text-sm mb-4">Trigger pipeline run</h2>
      <div className="space-y-3">
        <div>
          <label className="text-white/40 text-xs block mb-1">Start stage</label>
          <select
            value={startStage}
            onChange={e => setStart(e.target.value)}
            className="w-full bg-[#0c0e14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80 focus:outline-none"
          >
            {START_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        {(startStage === "trend_discovery" || startStage === "content_brief") && (
          <div>
            <label className="text-white/40 text-xs block mb-1">Seed topics (comma-separated)</label>
            <input
              value={seedTopics}
              onChange={e => setTopics(e.target.value)}
              placeholder="kedarkantha trek, triund trek guide"
              className="w-full bg-[#0c0e14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:outline-none"
            />
          </div>
        )}
        {startStage === "content_writing" && (
          <div>
            <label className="text-white/40 text-xs block mb-1">Brief UUID</label>
            <input
              value={briefId}
              onChange={e => setBriefId(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              className="w-full bg-[#0c0e14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:outline-none font-mono"
            />
          </div>
        )}
        {(startStage === "seo_aeo" || startStage === "publish") && (
          <div>
            <label className="text-white/40 text-xs block mb-1">Draft UUID</label>
            <input
              value={draftId}
              onChange={e => setDraftId(e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              className="w-full bg-[#0c0e14] border border-white/10 rounded-xl px-3 py-2 text-sm text-white/80 placeholder:text-white/20 focus:outline-none font-mono"
            />
          </div>
        )}
        {error && <p className="text-red-400 text-xs">{error}</p>}
        <div className="flex gap-2 pt-1">
          <Button variant="hero" size="sm" className="flex-1" onClick={submit} disabled={busy}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
            {busy ? "Triggering…" : "Run"}
          </Button>
          <Button variant="outline" size="sm" className="border-white/20 text-white/50 hover:text-white" onClick={() => setOpen(false)}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── main page ─────────────────────────────────────────────────────────────────

export default function PipelinePage() {
  const [runs, setRuns]     = useState<PipelineRun[]>([]);
  const [loading, setLoad]  = useState(true);
  const [error, setError]   = useState("");
  const [busy, setBusy]     = useState<string | null>(null);
  const [msg, setMsg]       = useState("");

  const load = useCallback(async () => {
    setLoad(true);
    setError("");
    try {
      setRuns(await fetchPipelineRuns(30));
    } catch {
      setError("Failed to load pipeline runs.");
    } finally {
      setLoad(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // auto-refresh while any run is active
  useEffect(() => {
    const hasActive = runs.some(r => r.status === "running");
    if (!hasActive) return;
    const id = setTimeout(load, 5000);
    return () => clearTimeout(id);
  }, [runs, load]);

  async function handleResume(runId: string) {
    setBusy(runId);
    setMsg("");
    try {
      await resumePipelineRun(runId);
      setMsg("Pipeline resumed.");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Resume failed.");
    } finally {
      setBusy(null);
    }
  }

  async function handleCancel(runId: string) {
    setBusy(runId);
    setMsg("");
    try {
      await cancelPipelineRun(runId);
      setMsg("Pipeline cancelled.");
      await load();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : "Cancel failed.");
    } finally {
      setBusy(null);
    }
  }

  const active    = runs.filter(r => r.status === "running");
  const paused    = runs.filter(r => r.status.startsWith("paused_at_"));
  const completed = runs.filter(r => r.status === "completed");
  const failed    = runs.filter(r => r.status === "failed" || r.status === "cancelled");

  return (
    <div>
      {/* header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Pipeline Orchestrator</h1>
          <p className="text-white/50 text-sm">Trend → Cluster → Brief → Draft → SEO → Publish</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex gap-2 items-center">
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 text-white/50 hover:text-white"
              onClick={load}
              disabled={loading}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
          {msg && <p className="text-xs text-pine">{msg}</p>}
        </div>
      </div>

      {/* trigger form */}
      <div className="mb-6">
        <TriggerForm onTriggered={load} />
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Active",    count: active.length,    color: "text-blue-400" },
          { label: "Awaiting",  count: paused.length,    color: "text-amber-400" },
          { label: "Completed", count: completed.length, color: "text-pine" },
          { label: "Failed",    count: failed.length,    color: "text-red-400" },
        ].map(({ label, count, color }) => (
          <div key={label} className="bg-[#14161f] rounded-xl border border-white/10 p-4 text-center">
            <p className={`font-display text-2xl font-semibold ${color}`}>{count}</p>
            <p className="text-white/40 text-xs mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {error && (
        <div className="text-amber-400 text-sm bg-amber-400/10 border border-amber-400/20 rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {loading && runs.length === 0 && (
        <div className="flex items-center justify-center py-16 text-white/30">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading runs…
        </div>
      )}

      {/* active + paused runs */}
      {(active.length > 0 || paused.length > 0) && (
        <section className="mb-6">
          <h2 className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" /> In progress
          </h2>
          <div className="space-y-3">
            {[...active, ...paused].map(run => (
              <RunCard key={run.id} run={run} onResume={handleResume} onCancel={handleCancel} busy={busy} />
            ))}
          </div>
        </section>
      )}

      {/* completed */}
      {completed.length > 0 && (
        <section className="mb-6">
          <h2 className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-3.5 w-3.5" /> Completed
          </h2>
          <div className="space-y-3">
            {completed.map(run => (
              <RunCard key={run.id} run={run} onResume={handleResume} onCancel={handleCancel} busy={busy} />
            ))}
          </div>
        </section>
      )}

      {/* failed / cancelled */}
      {failed.length > 0 && (
        <section>
          <h2 className="text-white/50 text-xs font-semibold uppercase tracking-widest mb-3 flex items-center gap-2">
            <AlertTriangle className="h-3.5 w-3.5" /> Failed / Cancelled
          </h2>
          <div className="space-y-3">
            {failed.map(run => (
              <RunCard key={run.id} run={run} onResume={handleResume} onCancel={handleCancel} busy={busy} />
            ))}
          </div>
        </section>
      )}

      {!loading && runs.length === 0 && (
        <div className="text-center py-16 text-white/30 text-sm">
          No pipeline runs yet. Click "Run pipeline" to start.
        </div>
      )}
    </div>
  );
}
