"use client";

import { useEffect, useState } from "react";
import { Layers } from "lucide-react";

interface RetentionCell {
  week: number;
  users: number;
  pct: number; // -1 = future (not yet reached)
}

interface CohortRow {
  cohort_week: string;
  total_users: number;
  retention: RetentionCell[];
}

interface CohortData {
  rows: CohortRow[];
  max_weeks: number;
}

function cellColor(pct: number): string {
  if (pct < 0) return "bg-white/3 text-white/20";
  if (pct === 0) return "bg-white/3 text-white/20";
  if (pct >= 60) return "bg-pine/70 text-white";
  if (pct >= 40) return "bg-pine/40 text-white/90";
  if (pct >= 20) return "bg-amber-400/30 text-amber-200";
  return "bg-red-400/20 text-red-300";
}

function formatWeek(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" });
  } catch {
    return iso;
  }
}

interface AttrChannel {
  channel: string;
  first_touch: number;
  last_touch: number;
  touchpoints: number;
  first_touch_pct: number;
  last_touch_pct: number;
  linear_pct: number;
}
interface AttrReport {
  window_days: number;
  total_touchpoints: number;
  channels: AttrChannel[];
}

// P2 — channel attribution (first / last / linear credit), co-located with retention.
function AttributionSection() {
  const [report, setReport] = useState<AttrReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/admin/cdp/attribution?days=90", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setReport(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="mt-8">
      <div className="mb-3">
        <h2 className="font-semibold text-sm text-white">Channel Attribution</h2>
        <p className="text-white/40 text-xs">
          Credit per channel under three models, last 90 days{report ? ` · ${report.total_touchpoints.toLocaleString()} touchpoints` : ""}.
        </p>
      </div>
      <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-white/30 text-sm">Loading…</div>
        ) : !report || report.channels.length === 0 ? (
          <div className="p-8 text-center text-white/40 text-sm">No attribution touchpoints yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Channel</th>
                  <th className="text-right px-4 py-3 text-white/40 font-medium text-xs">First-touch</th>
                  <th className="text-right px-4 py-3 text-white/40 font-medium text-xs">Last-touch</th>
                  <th className="text-right px-4 py-3 text-white/40 font-medium text-xs">Linear</th>
                </tr>
              </thead>
              <tbody>
                {report.channels.map((c) => (
                  <tr key={c.channel} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3 text-white/80 text-xs font-medium">{c.channel}</td>
                    <td className="px-4 py-3 text-right text-white/70 text-xs tabular-nums">{c.first_touch} <span className="text-white/30">({c.first_touch_pct}%)</span></td>
                    <td className="px-4 py-3 text-right text-white/70 text-xs tabular-nums">{c.last_touch} <span className="text-white/30">({c.last_touch_pct}%)</span></td>
                    <td className="px-4 py-3 text-right text-white/70 text-xs tabular-nums">{c.touchpoints} <span className="text-white/30">({c.linear_pct}%)</span></td>
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

export default function CohortsPage() {
  const [data, setData] = useState<CohortData | null>(null);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState("");
  const [behavior, setBehavior] = useState("");
  const [applied, setApplied] = useState({ source: "", behavior: "" });

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (applied.source) params.set("source", applied.source);
    if (applied.behavior) params.set("behavior_event", applied.behavior);
    const qs = params.toString();
    fetch(`/api/v1/admin/cdp/cohorts${qs ? `?${qs}` : ""}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [applied]);

  const weeks = data ? Array.from({ length: data.max_weeks }, (_, i) => i) : [];

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Cohort Retention</h1>
          <p className="text-white/50 text-sm">Weekly retention heatmap — % of cohort active in each subsequent week.</p>
        </div>
      </div>

      {/* Segmentation controls (P2) — acquisition-source + behavior cohorts */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          className="w-full sm:w-52 bg-[#14161f] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
          placeholder="Acquisition source (e.g. google)"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        />
        <input
          className="w-full sm:w-56 bg-[#14161f] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
          placeholder="Behavior event (e.g. trek_viewed)"
          value={behavior}
          onChange={(e) => setBehavior(e.target.value)}
        />
        <button
          onClick={() => setApplied({ source: source.trim(), behavior: behavior.trim() })}
          className="bg-accent text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-accent/90 transition-colors w-full sm:w-auto"
        >
          Apply
        </button>
        {(applied.source || applied.behavior) && (
          <button
            onClick={() => { setSource(""); setBehavior(""); setApplied({ source: "", behavior: "" }); }}
            className="text-white/50 hover:text-white text-sm px-3 py-2 w-full sm:w-auto"
          >
            Clear
          </button>
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-xs text-white/40">Retention:</span>
        {[
          { label: "≥ 60%", cls: "bg-pine/70" },
          { label: "40–60%", cls: "bg-pine/40" },
          { label: "20–40%", cls: "bg-amber-400/30" },
          { label: "< 20%", cls: "bg-red-400/20" },
          { label: "Future", cls: "bg-white/3" },
        ].map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span className={`w-3 h-3 rounded-sm ${l.cls}`} />
            <span className="text-xs text-white/50">{l.label}</span>
          </div>
        ))}
      </div>

      <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
        {loading && (
          <div className="p-10 text-center text-white/30 text-sm">Loading…</div>
        )}

        {!loading && (!data || data.rows.length === 0) && (
          <div className="p-10 text-center">
            <Layers className="h-8 w-8 text-white/20 mx-auto mb-3" />
            <p className="text-white/40 text-sm">No session data yet. Cohorts appear after users start sessions.</p>
          </div>
        )}

        {!loading && data && data.rows.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[700px]">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-white/40 font-medium whitespace-nowrap">Cohort Week</th>
                  <th className="text-right px-3 py-3 text-white/40 font-medium whitespace-nowrap">Users</th>
                  {weeks.map((w) => (
                    <th key={w} className="text-center px-1.5 py-3 text-white/40 font-medium whitespace-nowrap min-w-[52px]">
                      {w === 0 ? "W0" : `W${w}`}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row) => (
                  <tr key={row.cohort_week} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                    <td className="px-4 py-2.5 text-white/70 font-medium whitespace-nowrap">
                      {formatWeek(row.cohort_week)}
                    </td>
                    <td className="px-3 py-2.5 text-white/60 text-right font-semibold whitespace-nowrap">
                      {row.total_users.toLocaleString()}
                    </td>
                    {weeks.map((w) => {
                      const cell = row.retention.find((c) => c.week === w);
                      const pct = cell?.pct ?? -1;
                      const users = cell?.users ?? 0;
                      return (
                        <td key={w} className="px-1 py-2 text-center">
                          <div
                            className={`rounded-md px-1 py-1 text-[11px] font-semibold ${cellColor(pct)} cursor-default`}
                            title={pct >= 0 ? `${users} users (${pct}%)` : "Not yet reached"}
                          >
                            {pct < 0 ? "—" : pct === 0 ? "0%" : `${pct}%`}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-xs text-white/20 mt-3">
        W0 = cohort&apos;s own week (always ~100%). Each subsequent week shows % of original cohort who returned.
        Cells marked "—" are future weeks not yet reached.
      </p>

      <AttributionSection />
    </div>
  );
}
