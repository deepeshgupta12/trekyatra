"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";

interface AgentRun {
  id: number;
  agent_type: string;
  status: string;
  started_at: string | null;
  completed_at: string | null;
}

const RUN_STATUS_STYLE: Record<string, string> = {
  running:   "text-blue-400 bg-blue-400/10 border border-blue-400/20",
  completed: "text-pine bg-pine/10 border border-pine/20",
  failed:    "text-red-400 bg-red-400/10 border border-red-400/20",
  pending:   "text-white/40 bg-white/5 border border-white/10",
};

function duration(started: string | null, completed: string | null): string {
  if (!started) return "—";
  const end = completed ? new Date(completed) : new Date();
  const secs = Math.round((end.getTime() - new Date(started).getTime()) / 1000);
  if (secs < 60) return `${secs}s`;
  return `${Math.floor(secs / 60)}m ${secs % 60}s`;
}

export function AgentRunsPanel({ agentType }: { agentType: string }) {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRuns = useCallback(async () => {
    try {
      const r = await fetch(`/api/v1/admin/agent-runs?agent_type=${agentType}&limit=5`);
      if (r.ok) setRuns(await r.json());
    } finally {
      setLoading(false);
    }
  }, [agentType]);

  useEffect(() => {
    fetchRuns();
  }, [fetchRuns]);

  // Poll every 5s if any run is still running
  useEffect(() => {
    const hasRunning = runs.some(r => r.status === "running");
    if (!hasRunning) return;
    const t = setInterval(fetchRuns, 5000);
    return () => clearInterval(t);
  }, [runs, fetchRuns]);

  if (loading) return null;
  if (runs.length === 0) return null;

  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold">Recent runs</p>
      {runs.map(run => (
        <div key={run.id} className="flex items-center gap-2 text-xs">
          <span className="text-white/40 font-mono w-10 text-right flex-shrink-0">#{run.id}</span>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium flex-shrink-0 flex items-center gap-1 ${RUN_STATUS_STYLE[run.status] ?? RUN_STATUS_STYLE.pending}`}>
            {run.status === "running" && <Loader2 className="h-2.5 w-2.5 animate-spin" />}
            {run.status}
          </span>
          <span className="text-white/25 font-mono flex-shrink-0">{duration(run.started_at, run.completed_at)}</span>
        </div>
      ))}
    </div>
  );
}
