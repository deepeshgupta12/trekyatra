"use client";

import { useEffect, useState } from "react";
import { MessageSquare, RefreshCw, Filter, User, UserX } from "lucide-react";
import { fetchAiInteractionLogs, type AIInteractionLogEntry } from "@/lib/api";

const SOURCES = ["all", "web", "mobile", "chatgpt", "claude"];
const TOOLS = [
  "all",
  "search_treks",
  "recommend_treks",
  "compare_treks",
  "ask_trek_question",
  "create_trek_plan_lead",
  "get_trek_details",
  "get_trek_content",
  "translate_trek_content",
];

const SOURCE_STYLES: Record<string, string> = {
  web:     "text-blue-400 bg-blue-400/10 border border-blue-400/20",
  mobile:  "text-emerald-400 bg-emerald-400/10 border border-emerald-400/20",
  chatgpt: "text-amber-400 bg-amber-400/10 border border-amber-400/20",
  claude:  "text-purple-400 bg-purple-500/10 border border-purple-400/20",
};

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function TrekSageLogsPage() {
  const [logs, setLogs] = useState<AIInteractionLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("all");
  const [tool, setTool] = useState("all");
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAiInteractionLogs(
        200,
        source !== "all" ? source : undefined,
        tool !== "all" ? tool : undefined,
      );
      setLogs(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load logs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [source, tool]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">TrekSage Logs</h1>
          <p className="text-white/50 text-sm">AI interaction log across web, mobile, ChatGPT, and Claude connectors.</p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-1.5 text-sm border border-white/20 text-white/60 hover:text-white px-3 py-2 rounded-xl hover:bg-white/5 transition-colors w-fit"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh
        </button>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="bg-[#14161f] rounded-2xl border border-white/10 p-4">
          <p className="text-white/40 text-xs font-medium uppercase tracking-wide mb-1">Known Users</p>
          <p className="text-white font-display text-2xl font-semibold">{logs.filter((l) => !l.is_anonymous).length}</p>
        </div>
        <div className="bg-[#14161f] rounded-2xl border border-white/10 p-4">
          <p className="text-white/40 text-xs font-medium uppercase tracking-wide mb-1">Anonymous</p>
          <p className="text-white font-display text-2xl font-semibold">{logs.filter((l) => l.is_anonymous).length}</p>
        </div>
        {(["web", "mobile", "chatgpt", "claude"] as const).map((src) => {
          const count = logs.filter((l) => l.source === src).length;
          return (
            <div key={src} className="bg-[#14161f] rounded-2xl border border-white/10 p-4">
              <p className="text-white/40 text-xs font-medium uppercase tracking-wide mb-1">{src}</p>
              <p className="text-white font-display text-2xl font-semibold">{count}</p>
            </div>
          );
        })}
      </div>

      {/* ── Filters ── */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden mb-4">
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/8 flex-wrap">
          <Filter className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
          <div className="flex items-center gap-2">
            <label className="text-white/40 text-xs">Source:</label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="text-xs bg-white/5 border border-white/10 text-white/70 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-accent/40"
            >
              {SOURCES.map((s) => <option key={s} value={s}>{s === "all" ? "All sources" : s}</option>)}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-white/40 text-xs">Tool:</label>
            <select
              value={tool}
              onChange={(e) => setTool(e.target.value)}
              className="text-xs bg-white/5 border border-white/10 text-white/70 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-accent/40"
            >
              {TOOLS.map((t) => <option key={t} value={t}>{t === "all" ? "All tools" : t}</option>)}
            </select>
          </div>
          <p className="ml-auto text-white/30 text-xs">{logs.length} entries</p>
        </div>

        {/* ── Table ── */}
        {error ? (
          <div className="px-5 py-8 text-center text-red-400 text-sm">{error}</div>
        ) : loading ? (
          <div className="px-5 py-8 text-center text-white/30 text-sm">Loading…</div>
        ) : logs.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <MessageSquare className="h-8 w-8 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No interactions logged yet</p>
            <p className="text-white/25 text-xs mt-1">Logs appear here when users interact with TrekSage or the MCP tools</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[780px]">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Time</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">User</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Source</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Tool</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Query</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden md:table-cell">Treks</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3 text-white/40 text-xs whitespace-nowrap">{fmt(log.created_at)}</td>
                    <td className="px-4 py-3">
                      {log.is_anonymous ? (
                        <span className="inline-flex items-center gap-1 text-[10px] text-white/30">
                          <UserX className="h-3 w-3" /> Anonymous
                        </span>
                      ) : (
                        <div>
                          <p className="text-xs text-white/70 font-medium leading-tight">{log.user_name ?? "—"}</p>
                          <p className="text-[10px] text-white/35 font-mono">{log.user_email}</p>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${SOURCE_STYLES[log.source] ?? "text-white/40 bg-white/5 border border-white/10"}`}>
                        {log.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white/60 text-xs font-mono">{log.tool_name}</td>
                    <td className="px-4 py-3 text-white/70 text-xs max-w-[220px] truncate" title={log.query_summary ?? ""}>
                      {log.query_summary ?? <span className="text-white/25">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      {log.trek_slugs && log.trek_slugs.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {log.trek_slugs.slice(0, 3).map((slug) => (
                            <span key={slug} className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-white/5 text-white/40 border border-white/8">
                              {slug}
                            </span>
                          ))}
                          {log.trek_slugs.length > 3 && (
                            <span className="text-[9px] text-white/25">+{log.trek_slugs.length - 3}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-white/25">—</span>
                      )}
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
