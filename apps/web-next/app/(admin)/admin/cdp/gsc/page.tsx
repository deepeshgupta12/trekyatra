"use client";

import { useEffect, useState } from "react";

interface GscRow {
  page_url: string;
  query: string;
  date: string;
  clicks: number;
  impressions: number;
  ctr: number | null;
  position: number | null;
}

export default function CdpGscPage() {
  const [rows, setRows] = useState<GscRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), page_size: "100" });
    if (dateFrom) params.set("date_from", dateFrom);
    if (dateTo) params.set("date_to", dateTo);
    fetch(`/api/v1/admin/cdp/gsc?${params}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setRows(d.rows ?? []); setTotal(d.total ?? 0); setLoading(false); })
      .catch(() => setLoading(false));
  }, [page, dateFrom, dateTo]);

  const totalPages = Math.ceil(total / 100);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">GSC Performance</h1>
          <p className="text-white/50 text-sm">Google Search Console — queries, clicks, impressions, position.</p>
        </div>
        <p className="text-white/30 text-xs">{total.toLocaleString()} rows</p>
      </div>

      {/* Date filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div>
          <label className="text-white/30 text-xs block mb-1">From</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            className="bg-[#14161f] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
          />
        </div>
        <div>
          <label className="text-white/30 text-xs block mb-1">To</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            className="bg-[#14161f] border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
          />
        </div>
      </div>

      <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Query</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden md:table-cell">Page</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Date</th>
                <th className="text-right px-4 py-3 text-white/40 font-medium text-xs">Clicks</th>
                <th className="text-right px-4 py-3 text-white/40 font-medium text-xs hidden sm:table-cell">Impr.</th>
                <th className="text-right px-4 py-3 text-white/40 font-medium text-xs hidden sm:table-cell">CTR</th>
                <th className="text-right px-4 py-3 text-white/40 font-medium text-xs">Pos.</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-white/30 text-sm">Loading…</td></tr>
              ) : rows.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-white/30 text-sm">
                  No GSC data. Requires GSC_SERVICE_ACCOUNT_JSON to be configured.
                </td></tr>
              ) : rows.map((r, i) => (
                <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3 text-white/80 text-xs max-w-[200px] truncate">{r.query}</td>
                  <td className="px-4 py-3 text-white/40 text-xs max-w-[160px] truncate hidden md:table-cell">{r.page_url}</td>
                  <td className="px-4 py-3 text-white/50 text-xs">{r.date}</td>
                  <td className="px-4 py-3 text-white/80 text-xs text-right">{r.clicks}</td>
                  <td className="px-4 py-3 text-white/50 text-xs text-right hidden sm:table-cell">{r.impressions.toLocaleString()}</td>
                  <td className="px-4 py-3 text-white/50 text-xs text-right hidden sm:table-cell">
                    {r.ctr !== null ? `${(r.ctr * 100).toFixed(1)}%` : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-right">
                    <span className={r.position !== null && r.position <= 10 ? "text-pine" : "text-white/50"}>
                      {r.position !== null ? r.position.toFixed(1) : "—"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="text-white/50 hover:text-white disabled:opacity-30 text-sm transition-colors">← Previous</button>
          <span className="text-white/30 text-xs">Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="text-white/50 hover:text-white disabled:opacity-30 text-sm transition-colors">Next →</button>
        </div>
      )}
    </div>
  );
}
