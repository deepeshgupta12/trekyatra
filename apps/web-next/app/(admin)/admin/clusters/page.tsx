"use client";

import { useState, useEffect, useCallback } from "react";
import { Layers, Loader2, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyableId } from "@/components/admin/CopyableId";
import { AgentRunsPanel } from "@/components/admin/AgentRunsPanel";

interface Cluster {
  id: string;
  name: string;
  primary_keyword: string;
  supporting_keywords: string[] | null;
  intent: string | null;
  pillar_title: string | null;
  status: string;
  notes: string | null;
  created_at: string;
}

const INTENT_STYLE: Record<string, string> = {
  informational: "text-blue-400 bg-blue-400/10 border border-blue-400/20",
  commercial:    "text-purple-400 bg-purple-500/10 border border-purple-400/20",
  transactional: "text-pine bg-pine/10 border border-pine/20",
  navigational:  "text-white/40 bg-white/5 border border-white/10",
};

export default function KeywordClusters() {
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [topicIds, setTopicIds] = useState("");
  const [running, setRunning] = useState(false);
  const [dispatchMsg, setDispatchMsg] = useState("");
  const [runKey, setRunKey] = useState(0);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const fetchClusters = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/v1/clusters");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setClusters(await r.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load clusters");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchClusters(); }, [fetchClusters]);

  async function triggerClustering() {
    const ids = topicIds
      .split(/[\s,\n]+/)
      .map(s => s.trim())
      .filter(Boolean);
    if (ids.length === 0) {
      setDispatchMsg("Paste at least one topic UUID");
      return;
    }
    setRunning(true);
    setDispatchMsg("");
    try {
      const r = await fetch("/api/v1/admin/agents/cluster-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic_ids: ids }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error((body as { detail?: string }).detail ?? `HTTP ${r.status}`);
      setDispatchMsg(`Dispatched — run #${(body as { agent_run_id: number }).agent_run_id}`);
      setRunKey(k => k + 1);
      setTopicIds("");
    } catch (e) {
      setDispatchMsg(e instanceof Error ? e.message : "Dispatch failed");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Keyword Clusters</h1>
          <p className="text-white/50 text-sm">Topical authority map — pillar + supporting content.</p>
        </div>
        <Button variant="outline" size="sm" className="border-white/20 text-white/60 hover:text-white w-fit"
          onClick={fetchClusters} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Trigger panel */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-accent/10 w-7 h-7 rounded-lg flex items-center justify-center">
            <Layers className="h-3.5 w-3.5 text-accent" />
          </div>
          <h2 className="text-white font-semibold text-sm">Cluster Keywords</h2>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={topicIds}
            onChange={e => setTopicIds(e.target.value)}
            placeholder="Paste topic UUIDs (comma-separated)"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-accent/50"
          />
          <Button variant="hero" size="sm" onClick={triggerClustering} disabled={running} className="w-full sm:w-auto">
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Layers className="h-3.5 w-3.5" />}
            {running ? "Dispatching…" : "Cluster topics"}
          </Button>
        </div>
        {dispatchMsg && (
          <p className={`text-xs mt-2 ${dispatchMsg.startsWith("Dispatched") ? "text-pine" : "text-amber-400"}`}>
            {dispatchMsg}
          </p>
        )}
        <AgentRunsPanel key={runKey} agentType="keyword_cluster" />
      </div>

      {error && (
        <div className="text-amber-400 text-sm bg-amber-400/10 border border-amber-400/20 rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {/* Clusters */}
      {loading && clusters.length === 0 ? (
        <div className="flex items-center justify-center py-16 text-white/40">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
        </div>
      ) : clusters.length === 0 ? (
        <div className="text-center py-16 text-white/40 text-sm">
          No clusters yet. Run the Cluster Keywords agent above.
        </div>
      ) : (
        <div className="space-y-3">
          {clusters.map(c => {
            const kws = c.supporting_keywords ?? [];
            const isExpanded = expanded[c.id];
            const shownKws = isExpanded ? kws : kws.slice(0, 6);

            return (
              <div key={c.id} className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
                <div className="flex items-start justify-between gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="text-white font-semibold text-sm">{c.name}</h3>
                      {c.intent && (
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${INTENT_STYLE[c.intent] ?? INTENT_STYLE.informational}`}>
                          {c.intent}
                        </span>
                      )}
                    </div>
                    <p className="text-white/40 text-xs">
                      Primary: <span className="text-white/60">{c.primary_keyword}</span>
                    </p>
                    {c.pillar_title && (
                      <p className="text-white/30 text-[10px] mt-0.5 truncate">Pillar: {c.pillar_title}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <CopyableId id={c.id} />
                    {kws.length > 6 && (
                      <button
                        onClick={() => setExpanded(prev => ({ ...prev, [c.id]: !prev[c.id] }))}
                        className="text-white/40 hover:text-white/70 transition-colors"
                      >
                        {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    )}
                  </div>
                </div>

                {kws.length > 0 && (
                  <div className="px-5 pb-4">
                    <p className="text-[10px] text-white/30 uppercase tracking-widest font-semibold mb-2">
                      Supporting keywords ({kws.length})
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {shownKws.map(kw => (
                        <span key={kw} className="text-[10px] text-white/50 bg-white/5 border border-white/8 px-2.5 py-1 rounded-full">
                          {kw}
                        </span>
                      ))}
                      {!isExpanded && kws.length > 6 && (
                        <button
                          onClick={() => setExpanded(prev => ({ ...prev, [c.id]: true }))}
                          className="text-[10px] text-accent/70 hover:text-accent transition-colors px-2"
                        >
                          +{kws.length - 6} more
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
