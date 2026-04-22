"use client";

import { useState } from "react";
import { TrendingUp, Search, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const statusStyle: Record<string, string> = {
  uncovered: "text-amber-400 bg-amber-400/10",
  "in-progress": "text-blue-400 bg-blue-400/10",
  covered: "text-white/30 bg-white/5",
};

export default function TopicDiscovery() {
  const [running, setRunning] = useState(false);
  const [runId, setRunId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function triggerDiscovery() {
    setRunning(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/admin/agents/discover-trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seed_topics: [
            "kedarkantha winter trek",
            "brahmatal trek guide",
            "best winter treks india",
            "uttarakhand trek permits",
            "valley of flowers best time to visit",
            "monsoon trekking india",
            "hampta pass itinerary",
            "har ki dun trek difficulty",
          ],
        }),
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
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Topic Discovery</h1>
          <p className="text-white/50 text-sm">High-opportunity keywords ready for content creation.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Button variant="hero" size="sm" onClick={triggerDiscovery} disabled={running}>
            {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {running ? "Running agent…" : "Discover trends"}
          </Button>
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

      <div className="bg-white/5 rounded-2xl border border-white/8 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/8">
          <p className="text-white/40 text-xs">
            Click <span className="text-white/60 font-medium">Discover trends</span> to trigger the
            AI agent. Results are stored in the topics table and will appear after the run completes.
          </p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              {["Keyword", "Volume", "Difficulty", "Opportunity", "Status", ""].map(h => (
                <th key={h} className="text-left px-5 py-3 text-white/40 font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { keyword: "kedarkantha winter trek 2025", volume: "12,400", difficulty: "Low", opportunity: 92, status: "uncovered" },
              { keyword: "hampta pass itinerary", volume: "8,900", difficulty: "Low", opportunity: 88, status: "in-progress" },
              { keyword: "uttarakhand trek permits", volume: "6,200", difficulty: "Medium", opportunity: 74, status: "uncovered" },
              { keyword: "valley of flowers best time", volume: "5,100", difficulty: "Medium", opportunity: 70, status: "covered" },
              { keyword: "brahmatal trek difficulty", volume: "4,800", difficulty: "Low", opportunity: 85, status: "uncovered" },
              { keyword: "monsoon trekking india", volume: "4,500", difficulty: "High", opportunity: 55, status: "covered" },
            ].map(t => (
              <tr key={t.keyword} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                <td className="px-5 py-4 text-white/80 font-medium">{t.keyword}</td>
                <td className="px-5 py-4 text-white/50">{t.volume}</td>
                <td className="px-5 py-4 text-white/50">{t.difficulty}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${t.opportunity}%` }} />
                    </div>
                    <span className="text-accent text-xs font-medium">{t.opportunity}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[t.status]}`}>{t.status}</span>
                </td>
                <td className="px-5 py-4">
                  {t.status === "uncovered" && (
                    <Button variant="outline" size="sm" className="border-white/20 text-white/60 hover:text-white hover:border-white/40 text-xs">
                      Create brief
                    </Button>
                  )}
                  {t.status !== "uncovered" && <ExternalLink className="h-4 w-4 text-white/20" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
