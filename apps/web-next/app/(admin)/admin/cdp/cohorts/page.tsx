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

export default function CohortsPage() {
  const [data, setData] = useState<CohortData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/admin/cdp/cohorts", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const weeks = data ? Array.from({ length: data.max_weeks }, (_, i) => i) : [];

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Cohort Retention</h1>
          <p className="text-white/50 text-sm">Weekly retention heatmap — % of cohort active in each subsequent week.</p>
        </div>
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
    </div>
  );
}
