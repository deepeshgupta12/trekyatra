"use client";

import { useEffect, useState } from "react";
import { RefreshCw, AlertCircle, CheckCircle, Clock, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  StalePage,
  RefreshLog,
  fetchStalePages,
  fetchRefreshLogs,
  triggerRefresh,
} from "@/lib/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const resultStyle: Record<string, string> = {
  pending:   "text-white/40  bg-white/5      border border-white/10",
  refreshed: "text-pine      bg-pine/10      border border-pine/20",
  flagged:   "text-amber-400 bg-amber-400/10 border border-amber-400/20",
  failed:    "text-red-400   bg-red-400/10   border border-red-400/20",
};

function ResultBadge({ result }: { result: string }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${resultStyle[result] ?? resultStyle.pending}`}>
      {result}
    </span>
  );
}

function staleness(page: StalePage): string {
  if (!page.last_refreshed_at) return "Never refreshed";
  const ms = Date.now() - new Date(page.last_refreshed_at).getTime();
  const days = Math.floor(ms / 86_400_000);
  const over = days - page.freshness_interval_days;
  return over > 0 ? `${over}d overdue` : `${days}d since last refresh`;
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function RefreshPage() {
  const [stale, setStale] = useState<StalePage[]>([]);
  const [logs, setLogs] = useState<RefreshLog[]>([]);
  const [loadingStale, setLoadingStale] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [triggeringId, setTriggeringId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState(false);

  async function load() {
    setLoadingStale(true);
    setLoadingLogs(true);
    try {
      const [s, l] = await Promise.all([fetchStalePages(), fetchRefreshLogs({ limit: 50 })]);
      setStale(s);
      setLogs(l);
    } catch {
      // silent — tables show empty state
    } finally {
      setLoadingStale(false);
      setLoadingLogs(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleTrigger(pageId: string) {
    setTriggeringId(pageId);
    setFeedback(null);
    setFeedbackError(false);
    try {
      const res = await triggerRefresh([pageId]);
      setFeedback(`Queued ${res.queued} page(s) for refresh.`);
      await load();
    } catch (err: unknown) {
      setFeedback(err instanceof Error ? err.message : "Trigger failed");
      setFeedbackError(true);
    } finally {
      setTriggeringId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Content Refresh</h1>
          <p className="text-white/50 text-sm">
            Pages past their freshness interval are listed here. Trigger a refresh to re-run SEO/AEO optimisation.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <Button variant="outline" size="sm" className="border-white/20 text-white/60 hover:text-white w-fit" onClick={load}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Reload
          </Button>
          {feedback && (
            <p className={`text-xs ${feedbackError ? "text-red-400" : "text-pine"}`}>{feedback}</p>
          )}
        </div>
      </div>

      {/* Stale pages table */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
          <h2 className="text-white font-semibold text-sm">Stale Pages</h2>
          <span className="text-white/40 text-xs">{stale.length} page{stale.length !== 1 ? "s" : ""} need refresh</span>
        </div>

        {loadingStale ? (
          <div className="px-5 py-8 text-center text-white/30 text-sm">Loading…</div>
        ) : stale.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <CheckCircle className="h-8 w-8 text-pine mx-auto mb-2" />
            <p className="text-white/50 text-sm">All pages are within their freshness interval.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Page</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden sm:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Staleness</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden md:table-cell">Last Refreshed</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Action</th>
                </tr>
              </thead>
              <tbody>
                {stale.map((page) => (
                  <tr key={page.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3.5">
                      <span className="text-white/80 font-medium text-xs">{page.title}</span>
                      <span className="block text-white/30 text-xs font-mono">{page.slug}</span>
                    </td>
                    <td className="px-4 py-3.5 hidden sm:table-cell">
                      <span className="text-white/50 text-xs">{page.page_type}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-amber-400 text-xs font-medium">{staleness(page)}</span>
                    </td>
                    <td className="px-4 py-3.5 hidden md:table-cell text-white/40 text-xs">
                      {formatDate(page.last_refreshed_at)}
                    </td>
                    <td className="px-4 py-3.5">
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-white/20 text-white/60 hover:text-white text-xs h-7 px-2.5"
                        disabled={triggeringId === page.id}
                        onClick={() => handleTrigger(page.id)}
                      >
                        {triggeringId === page.id ? (
                          <RefreshCw className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <RefreshCw className="h-3 w-3 mr-1" />
                        )}
                        {triggeringId === page.id ? "Queuing…" : "Refresh"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Refresh log history */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
          <h2 className="text-white font-semibold text-sm">Refresh Log</h2>
          <span className="text-white/40 text-xs">{logs.length} entries</span>
        </div>

        {loadingLogs ? (
          <div className="px-5 py-8 text-center text-white/30 text-sm">Loading…</div>
        ) : logs.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <Clock className="h-8 w-8 text-white/20 mx-auto mb-2" />
            <p className="text-white/50 text-sm">No refresh history yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Triggered</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden sm:table-cell">By</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Result</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden md:table-cell">Completed</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden lg:table-cell">Notes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3.5 text-white/50 text-xs">{formatDate(log.trigger_at)}</td>
                    <td className="px-4 py-3.5 text-white/40 text-xs hidden sm:table-cell capitalize">{log.triggered_by}</td>
                    <td className="px-4 py-3.5"><ResultBadge result={log.result} /></td>
                    <td className="px-4 py-3.5 text-white/40 text-xs hidden md:table-cell">{formatDate(log.completed_at)}</td>
                    <td className="px-4 py-3.5 text-white/30 text-xs hidden lg:table-cell max-w-[280px] truncate">
                      {log.notes ?? "—"}
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
