"use client";

import { useEffect, useState } from "react";

interface CohortRow {
  cohort_week: string;
  total_users: number;
  retained_week1: number | null;
  retained_week2: number | null;
  retained_week4: number | null;
}

function retentionPct(retained: number | null, total: number): string {
  if (retained === null || total === 0) return "—";
  return `${Math.round((retained / total) * 100)}%`;
}

function retentionColor(retained: number | null, total: number): string {
  if (retained === null || total === 0) return "text-white/20";
  const pct = (retained / total) * 100;
  if (pct >= 40) return "text-pine";
  if (pct >= 20) return "text-amber-400";
  return "text-red-400";
}

export default function CdpCohortsPage() {
  const [rows, setRows] = useState<CohortRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/admin/cdp/cohorts", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setRows(d.rows ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-white mb-1">Cohort Retention</h1>
        <p className="text-white/50 text-sm">Weekly user cohorts — how many come back after 1, 2, and 4 weeks.</p>
      </div>

      <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[480px]">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Cohort week</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Users</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Week 1</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Week 2</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Week 4</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-white/30 text-sm">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-white/30 text-sm">No cohort data yet — needs 4+ weeks of data.</td></tr>
              ) : rows.map((r) => (
                <tr key={r.cohort_week} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3.5 text-white/80 text-xs font-medium">{r.cohort_week}</td>
                  <td className="px-4 py-3.5 text-white/80 text-xs">{r.total_users.toLocaleString()}</td>
                  <td className={`px-4 py-3.5 text-xs font-medium ${retentionColor(r.retained_week1, r.total_users)}`}>
                    {retentionPct(r.retained_week1, r.total_users)}
                  </td>
                  <td className={`px-4 py-3.5 text-xs font-medium ${retentionColor(r.retained_week2, r.total_users)}`}>
                    {retentionPct(r.retained_week2, r.total_users)}
                  </td>
                  <td className={`px-4 py-3.5 text-xs font-medium ${retentionColor(r.retained_week4, r.total_users)}`}>
                    {retentionPct(r.retained_week4, r.total_users)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
