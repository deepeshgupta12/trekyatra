"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, TrendingUp } from "lucide-react";

interface TrekAnalyticsRow {
  trek_slug: string;
  trek_name: string;
  views_30d: number;
  plan_cta_clicks: number;
  plan_completions: number;
  save_count: number;
  conversion_rate: number;
}

export default function TrekAnalyticsPage() {
  const [treks, setTreks] = useState<TrekAnalyticsRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/admin/cdp/content/treks", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { treks: TrekAnalyticsRow[]; total: number }) => {
        setTreks(d.treks ?? []);
        setTotal(d.total ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const convColor = (rate: number) => {
    if (rate >= 5) return "text-pine";
    if (rate >= 2) return "text-amber-400";
    return "text-white/50";
  };

  return (
    <div className="min-h-screen bg-[#0c0e14] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-semibold text-white mb-1">Trek Funnel Analytics</h1>
            <p className="text-white/50 text-sm">Trek-level views, plan CTAs, completions, and conversion rates.</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/admin/cdp/content" className="text-sm text-white/40 hover:text-white">
              ← Content Overview
            </Link>
            <span className="text-white/20 text-xs">{total} treks</span>
          </div>
        </div>

        {/* Summary strip */}
        {!loading && treks.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "Total trek views (30d)", value: treks.reduce((s, t) => s + t.views_30d, 0).toLocaleString() },
              { label: "Plan CTA clicks (30d)", value: treks.reduce((s, t) => s + t.plan_cta_clicks, 0).toLocaleString() },
              { label: "Plan completions (30d)", value: treks.reduce((s, t) => s + t.plan_completions, 0).toLocaleString() },
              {
                label: "Avg conversion rate",
                value: `${(treks.reduce((s, t) => s + t.conversion_rate, 0) / treks.length).toFixed(1)}%`,
              },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-[#14161f] rounded-2xl border border-white/10 p-4">
                <p className="text-white/40 text-[10px] uppercase tracking-wider mb-1">{kpi.label}</p>
                <p className="font-display text-xl font-bold text-white">{kpi.value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
          <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/8">
            <TrendingUp className="h-4 w-4 text-accent" />
            <h2 className="text-white font-semibold text-sm">Sorted by conversion rate</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Trek</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Views 30d</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Plan CTAs</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Completions</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Saves</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Conv. Rate</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-white/30 text-sm">Loading…</td></tr>
                )}
                {!loading && treks.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-white/30 text-sm">No trek pages found.</td></tr>
                )}
                {!loading && treks.map((t) => (
                  <tr key={t.trek_slug} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3.5">
                      <a
                        href={`/trek/${t.trek_slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white/80 font-medium text-xs hover:text-accent flex items-center gap-1"
                      >
                        {t.trek_name}
                        <ExternalLink className="h-3 w-3 opacity-50" />
                      </a>
                    </td>
                    <td className="px-4 py-3.5 text-white/70 text-xs">{t.views_30d.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-white/70 text-xs">{t.plan_cta_clicks.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-white/70 text-xs">{t.plan_completions.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-white/50 text-xs">{t.save_count.toLocaleString()}</td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold ${convColor(t.conversion_rate)}`}>
                        {t.conversion_rate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
