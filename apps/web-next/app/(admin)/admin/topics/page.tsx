"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Loader2, RefreshCw, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyableId } from "@/components/admin/CopyableId";
import { AgentRunsPanel } from "@/components/admin/AgentRunsPanel";
import Link from "next/link";

interface Topic {
  id: string;
  title: string;
  slug: string;
  primary_keyword: string;
  source: string | null;
  intent: string | null;
  page_type: string | null;
  trend_score: number | null;
  urgency_score: number | null;
  status: string;
  created_at: string;
}

const STATUS_STYLE: Record<string, string> = {
  new:         "text-white/40 bg-white/5 border border-white/10",
  uncovered:   "text-amber-400 bg-amber-400/10 border border-amber-400/20",
  "in-progress":"text-blue-400 bg-blue-400/10 border border-blue-400/20",
  covered:     "text-white/30 bg-white/5 border border-white/8",
};

const DEFAULT_SEEDS = [
  "kedarkantha winter trek",
  "brahmatal trek guide",
  "best winter treks india",
  "uttarakhand trek permits",
  "valley of flowers best time to visit",
  "monsoon trekking india",
  "hampta pass itinerary",
  "har ki dun trek difficulty",
].join(", ");

export default function TopicDiscovery() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [seeds, setSeeds] = useState(DEFAULT_SEEDS);
  const [running, setRunning] = useState(false);
  const [dispatchMsg, setDispatchMsg] = useState("");
  const [runKey, setRunKey] = useState(0);

  const fetchTopics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const r = await fetch("/api/v1/topics");
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      setTopics(await r.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load topics");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTopics(); }, [fetchTopics]);

  async function triggerDiscovery() {
    const seedList = seeds
      .split(/[,\n]+/)
      .map(s => s.trim())
      .filter(Boolean);
    if (seedList.length === 0) return;

    setRunning(true);
    setDispatchMsg("");
    try {
      const r = await fetch("/api/v1/admin/agents/discover-trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seed_topics: seedList }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error((body as { detail?: string }).detail ?? `HTTP ${r.status}`);
      setDispatchMsg(`Dispatched — run #${(body as { agent_run_id: number }).agent_run_id}`);
      setRunKey(k => k + 1);
    } catch (e) {
      setDispatchMsg(e instanceof Error ? e.message : "Dispatch failed");
    } finally {
      setRunning(false);
    }
  }

  const scoreBar = (score: number | null) => {
    if (score === null) return null;
    const pct = Math.round(score * 100);
    return (
      <div className="flex items-center gap-2">
        <div className="h-1.5 w-10 rounded-full bg-white/10 flex-shrink-0">
          <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-accent text-xs font-medium">{pct}</span>
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Topic Discovery</h1>
          <p className="text-white/50 text-sm">High-opportunity keywords ready for content creation.</p>
        </div>
        <Button variant="outline" size="sm" className="border-white/20 text-white/60 hover:text-white w-fit"
          onClick={fetchTopics} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Trigger panel */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <div className="bg-accent/10 w-7 h-7 rounded-lg flex items-center justify-center">
            <TrendingUp className="h-3.5 w-3.5 text-accent" />
          </div>
          <h2 className="text-white font-semibold text-sm">Discover Trends</h2>
        </div>
        <textarea
          value={seeds}
          onChange={e => setSeeds(e.target.value)}
          rows={3}
          placeholder="Comma-separated seed topics…"
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder:text-white/30 focus:outline-none focus:border-accent/50 resize-none mb-2"
        />
        <div className="flex items-center gap-3">
          <Button variant="hero" size="sm" onClick={triggerDiscovery} disabled={running} className="w-fit">
            {running ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
            {running ? "Dispatching…" : "Run agent"}
          </Button>
          {dispatchMsg && (
            <p className={`text-xs ${dispatchMsg.startsWith("Dispatched") ? "text-pine" : "text-amber-400"}`}>
              {dispatchMsg}
            </p>
          )}
        </div>
        <AgentRunsPanel key={runKey} agentType="trend_discovery" />
      </div>

      {error && (
        <div className="text-amber-400 text-sm bg-amber-400/10 border border-amber-400/20 rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {/* Topics table */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
          <h2 className="text-white font-semibold text-sm">Topics ({topics.length})</h2>
        </div>
        {loading && topics.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-white/40">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
          </div>
        ) : topics.length === 0 ? (
          <div className="text-center py-12 text-white/40 text-sm">
            No topics yet. Run the Discover Trends agent above.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[600px]">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Topic</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden sm:table-cell">Keyword</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden md:table-cell">Trend</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden md:table-cell">Urgency</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Status</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden lg:table-cell">UUID</th>
                  <th className="px-4 py-3 text-white/40 font-medium text-xs hidden md:table-cell" />
                </tr>
              </thead>
              <tbody>
                {topics.map(t => (
                  <tr key={t.id} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="text-white/80 font-medium text-xs leading-snug">{t.title}</p>
                      <p className="text-white/30 text-[10px] mt-0.5">{t.page_type}</p>
                    </td>
                    <td className="px-4 py-3.5 text-white/50 text-xs hidden sm:table-cell">{t.primary_keyword}</td>
                    <td className="px-4 py-3.5 hidden md:table-cell">{scoreBar(t.trend_score)}</td>
                    <td className="px-4 py-3.5 hidden md:table-cell">{scoreBar(t.urgency_score)}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLE[t.status] ?? STATUS_STYLE.new}`}>
                        {t.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <CopyableId id={t.id} />
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell">
                      <Link
                        href={`/admin/briefs?topic_id=${t.id}&kw=${encodeURIComponent(t.primary_keyword)}`}
                        className="text-[10px] text-accent/70 hover:text-accent transition-colors font-medium"
                      >
                        Generate brief →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
