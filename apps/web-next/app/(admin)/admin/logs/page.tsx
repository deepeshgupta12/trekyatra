"use client";

import { useEffect, useState } from "react";
import { Terminal, CheckCircle, XCircle, Clock, Loader2, RefreshCw } from "lucide-react";
import { fetchAgentRuns, AgentRun } from "@/lib/api";
import { Button } from "@/components/ui/button";

const agentTypeLabel: Record<string, string> = {
  trend_discovery: "TrendDiscovery",
  keyword_cluster: "KeywordCluster",
  content_brief: "ContentBrief",
  content_writing: "ContentWriting",
  seo_aeo: "SEO/AEO",
};

const statusConfig: Record<string, { icon: React.ElementType; color: string; badge: string }> = {
  completed: { icon: CheckCircle, color: "text-pine", badge: "text-pine bg-pine/10 border border-pine/20" },
  failed: { icon: XCircle, color: "text-red-400", badge: "text-red-400 bg-red-400/10 border border-red-400/20" },
  running: { icon: Loader2, color: "text-blue-400", badge: "text-blue-400 bg-blue-400/10 border border-blue-400/20" },
  cancelled: { icon: Clock, color: "text-white/30", badge: "text-white/30 bg-white/5 border border-white/10" },
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AgentLogs() {
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(true);

  function load() {
    setLoading(true);
    fetchAgentRuns({ limit: 50 })
      .catch(() => [] as AgentRun[])
      .then((r) => {
        setRuns(r);
        setLoading(false);
      });
  }

  useEffect(() => { load(); }, []);

  const runningCount = runs.filter((r) => r.status === "running").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Agent Logs</h1>
          <p className="text-white/50 text-sm">Activity log for all AI pipeline agents.</p>
        </div>
        <div className="flex items-center gap-3">
          {runningCount > 0 && (
            <span className="flex items-center gap-2 text-xs text-blue-400 bg-blue-400/10 px-3 py-1.5 rounded-full border border-blue-400/20">
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
              {runningCount} running
            </span>
          )}
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="border-white/20 text-white/60 hover:text-white gap-1.5">
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/8 flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-white/30" />
          <span className="text-white/40 text-xs font-mono">agent_runs — last 50</span>
        </div>

        {loading ? (
          <div className="px-5 py-10 text-center text-white/30 text-sm">Loading…</div>
        ) : runs.length === 0 ? (
          <div className="px-5 py-10 text-center text-white/30 text-sm">No agent runs found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[520px]">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-5 py-3 text-white/40 font-medium">ID</th>
                  <th className="text-left px-5 py-3 text-white/40 font-medium">Agent</th>
                  <th className="text-left px-5 py-3 text-white/40 font-medium">Status</th>
                  <th className="text-left px-5 py-3 text-white/40 font-medium hidden sm:table-cell">Started</th>
                  <th className="text-left px-5 py-3 text-white/40 font-medium hidden md:table-cell">Error</th>
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => {
                  const cfg = statusConfig[run.status] ?? statusConfig.cancelled;
                  const Icon = cfg.icon;
                  return (
                    <tr key={run.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-white/30">#{run.id}</td>
                      <td className="px-5 py-3.5 text-white/80 font-medium">
                        {agentTypeLabel[run.agent_type] ?? run.agent_type}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cfg.badge}`}>
                          <Icon className={`h-3 w-3 ${run.status === "running" ? "animate-spin" : ""}`} />
                          {run.status}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-white/40 hidden sm:table-cell">
                        {run.started_at ? relativeTime(run.started_at) : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-red-400/70 font-mono truncate max-w-[200px] hidden md:table-cell">
                        {run.error ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
