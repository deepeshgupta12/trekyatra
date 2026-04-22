"use client";

import { useState } from "react";
import { Layers, ChevronDown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const CLUSTERS = [
  {
    name: "Winter Himalayan Treks",
    pillar: "kedarkantha-winter-trek",
    keywords: 34,
    coverage: 62,
    keywords_list: ["kedarkantha winter trek", "kedarkantha difficulty", "kedarkantha from delhi", "kedarkantha snow trek", "+30 more"],
  },
  {
    name: "Monsoon Trekking India",
    pillar: "monsoon-trekking-guide",
    keywords: 28,
    coverage: 40,
    keywords_list: ["monsoon trek india", "trekking in july india", "valley of flowers monsoon", "+25 more"],
  },
  {
    name: "Uttarakhand Permits",
    pillar: "uttarakhand-trek-permits",
    keywords: 19,
    coverage: 15,
    keywords_list: ["uttarakhand forest permit", "forest permit online", "kedarkantha permit 2025", "+16 more"],
  },
  {
    name: "Trek Gear & Packing",
    pillar: "trek-packing-checklist",
    keywords: 41,
    coverage: 78,
    keywords_list: ["trekking packing list india", "trekking shoes india", "sleeping bag trek", "+38 more"],
  },
];

export default function KeywordClusters() {
  const [running, setRunning] = useState(false);
  const [runId, setRunId] = useState<number | null>(null);
  const [topicIds, setTopicIds] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function triggerClustering() {
    const ids = topicIds
      .split(/[\s,]+/)
      .map(s => s.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      setError("Paste at least one topic UUID from the Topics page");
      return;
    }

    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/admin/agents/cluster-keywords", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic_ids: ids }),
      });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      const data = await res.json();
      setRunId(data.agent_run_id);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Keyword Clusters</h1>
          <p className="text-white/50 text-sm">Topical authority map — pillar + supporting content.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={topicIds}
              onChange={e => setTopicIds(e.target.value)}
              placeholder="Paste topic UUIDs (comma-separated)"
              className="text-xs bg-white/5 border border-white/20 rounded-lg px-3 py-2 text-white/70 placeholder-white/30 w-72 focus:outline-none focus:border-white/40"
            />
            <Button
              variant="outline"
              size="sm"
              className="border-white/20 text-white/60 hover:text-white"
              onClick={triggerClustering}
              disabled={running}
            >
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Layers className="h-4 w-4" />}
              {running ? "Clustering…" : "Cluster topics"}
            </Button>
          </div>
          {runId && (
            <p className="text-xs text-green-400">
              Agent run #{runId} dispatched — poll{" "}
              <a
                href={`/api/v1/admin/agent-runs/${runId}`}
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                /admin/agent-runs/{runId}
              </a>{" "}
              for results
            </p>
          )}
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
      </div>

      <div className="space-y-4">
        {CLUSTERS.map(c => (
          <div key={c.name} className="bg-white/5 rounded-2xl border border-white/8 p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-white font-semibold">{c.name}</h3>
                <p className="text-white/40 text-xs mt-0.5">Pillar: <span className="text-white/60">{c.pillar}</span></p>
              </div>
              <div className="text-right">
                <p className="text-accent font-semibold text-sm">{c.coverage}%</p>
                <p className="text-white/40 text-xs">coverage</p>
              </div>
            </div>
            <div className="h-1.5 w-full rounded-full bg-white/10 mb-4">
              <div className="h-full rounded-full bg-accent/70" style={{ width: `${c.coverage}%` }} />
            </div>
            <div className="flex flex-wrap gap-2">
              {c.keywords_list.map(kw => (
                <span key={kw} className="text-xs text-white/50 bg-white/5 px-3 py-1 rounded-full">{kw}</span>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/8">
              <span className="text-white/40 text-xs">{c.keywords} keywords in cluster</span>
              <Button variant="outline" size="sm" className="border-white/20 text-white/60 hover:text-white text-xs">
                View gaps <ChevronDown className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
