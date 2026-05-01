"use client";

import { useEffect, useState } from "react";
import {
  BarChart2, TrendingDown, RefreshCw, Settings, ChevronDown, ChevronUp, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  ClusterRevenueRow,
  DecayingPageRow,
  ExecutiveSummaryResponse,
  PageTypeRevenueRow,
  RevenueConfig,
  aggregateRevenue,
  fetchDecayingPages,
  fetchExecutiveSummaries,
  fetchRevenueByCluster,
  fetchRevenueByPageType,
  fetchRevenueConfig,
  patchRevenueConfig,
  triggerExecutiveSummary,
} from "@/lib/api";

function fmt(n: number) {
  return `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export default function RevenuePage() {
  const [clusters, setClusters] = useState<ClusterRevenueRow[]>([]);
  const [pageTypes, setPageTypes] = useState<PageTypeRevenueRow[]>([]);
  const [decaying, setDecaying] = useState<DecayingPageRow[]>([]);
  const [config, setConfig] = useState<RevenueConfig[]>([]);
  const [summaries, setSummaries] = useState<ExecutiveSummaryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [aggregating, setAggregating] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [editConfig, setEditConfig] = useState<Record<string, string>>({});
  const [expandedSummary, setExpandedSummary] = useState<string | null>(null);

  async function loadAll() {
    setLoading(true);
    try {
      const [c, pt, d, cfg, s] = await Promise.all([
        fetchRevenueByCluster().catch(() => []),
        fetchRevenueByPageType().catch(() => []),
        fetchDecayingPages().catch(() => []),
        fetchRevenueConfig().catch(() => []),
        fetchExecutiveSummaries().catch(() => []),
      ]);
      setClusters(c);
      setPageTypes(pt);
      setDecaying(d);
      setConfig(cfg);
      setSummaries(s);
      const init: Record<string, string> = {};
      cfg.forEach((r) => { init[r.key] = String(r.value_float); });
      setEditConfig(init);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadAll(); }, []);

  async function handleAggregate() {
    setAggregating(true);
    setMsg(null);
    try {
      const res = await aggregateRevenue(7);
      setMsg(`Aggregated ${res.aggregated} row(s) for ${res.period_start} – ${res.period_end}.`);
      await loadAll();
    } catch {
      setMsg("Aggregation failed — check backend logs.");
    } finally {
      setAggregating(false);
    }
  }

  async function handleGenerateSummary() {
    setGenerating(true);
    setMsg(null);
    try {
      await triggerExecutiveSummary();
      setMsg("Executive summary queued. Refresh in a moment.");
    } catch {
      setMsg("Summary generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveConfig(key: string) {
    const val = parseFloat(editConfig[key] ?? "0");
    try {
      const updated = await patchRevenueConfig(key, val);
      setConfig((prev) => prev.map((r) => (r.key === key ? updated : r)));
      setMsg(`Config "${key}" updated to ${val}.`);
    } catch {
      setMsg(`Failed to update "${key}".`);
    }
  }

  const totalRevenue = clusters.reduce((s, r) => s + r.total_revenue_inr, 0);
  const totalClicks = clusters.reduce((s, r) => s + r.total_clicks, 0);
  const totalLeads = clusters.reduce((s, r) => s + r.total_leads, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Revenue & Attribution</h1>
          <p className="text-white/50 text-sm">Cluster-level revenue, page-type RPM, decay detection, and executive summaries.</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="border-white/20 text-white/60 hover:text-white" onClick={handleAggregate} disabled={aggregating}>
              <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${aggregating ? "animate-spin" : ""}`} />
              {aggregating ? "Aggregating…" : "Aggregate (7d)"}
            </Button>
            <Button variant="hero" size="sm" className="w-fit" onClick={handleGenerateSummary} disabled={generating}>
              {generating ? "Queuing…" : "Generate Summary"}
            </Button>
          </div>
          {msg && <p className="text-xs text-white/50">{msg}</p>}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {[
          { icon: BarChart2, label: "Total Est. Revenue", value: fmt(totalRevenue) },
          { icon: BarChart2, label: "Affiliate Clicks", value: totalClicks.toLocaleString() },
          { icon: BarChart2, label: "Lead Conversions", value: totalLeads.toLocaleString() },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
            <div className="bg-accent/10 w-8 h-8 rounded-lg flex items-center justify-center mb-3">
              <Icon className="h-4 w-4 text-accent" />
            </div>
            <p className="text-white font-display text-2xl font-semibold leading-none mb-1">{value}</p>
            <p className="text-white/50 text-xs">{label}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-white/40 text-sm py-12 text-center">Loading revenue data…</div>
      ) : (
        <>
          {/* Revenue by cluster */}
          <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
              <h2 className="text-white font-semibold text-sm">Revenue by Cluster</h2>
            </div>
            {clusters.length === 0 ? (
              <p className="px-5 py-8 text-white/40 text-sm text-center">No cluster revenue data yet. Run Aggregate first.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="border-b border-white/8">
                      <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Cluster</th>
                      <th className="text-right px-4 py-3 text-white/40 font-medium text-xs">Revenue</th>
                      <th className="text-right px-4 py-3 text-white/40 font-medium text-xs hidden sm:table-cell">Clicks</th>
                      <th className="text-right px-4 py-3 text-white/40 font-medium text-xs hidden sm:table-cell">Leads</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clusters.map((r, i) => (
                      <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                        <td className="px-4 py-3.5 text-white/80 text-sm font-medium">{r.cluster_name ?? "—"}</td>
                        <td className="px-4 py-3.5 text-pine text-sm text-right font-mono">{fmt(r.total_revenue_inr)}</td>
                        <td className="px-4 py-3.5 text-white/50 text-xs text-right hidden sm:table-cell">{r.total_clicks}</td>
                        <td className="px-4 py-3.5 text-white/50 text-xs text-right hidden sm:table-cell">{r.total_leads}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Revenue by page type */}
          <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
              <h2 className="text-white font-semibold text-sm">Revenue by Page Type</h2>
            </div>
            {pageTypes.length === 0 ? (
              <p className="px-5 py-8 text-white/40 text-sm text-center">No page-type data yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[400px]">
                  <thead>
                    <tr className="border-b border-white/8">
                      <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Page Type</th>
                      <th className="text-right px-4 py-3 text-white/40 font-medium text-xs">Revenue</th>
                      <th className="text-right px-4 py-3 text-white/40 font-medium text-xs hidden sm:table-cell">Clicks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageTypes.map((r, i) => (
                      <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                        <td className="px-4 py-3.5 text-white/80 text-sm capitalize">{r.page_type ?? "unknown"}</td>
                        <td className="px-4 py-3.5 text-pine text-sm text-right font-mono">{fmt(r.total_revenue_inr)}</td>
                        <td className="px-4 py-3.5 text-white/50 text-xs text-right hidden sm:table-cell">{r.total_clicks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Decaying pages */}
          {decaying.length > 0 && (
            <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
              <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/8">
                <TrendingDown className="h-4 w-4 text-amber-400" />
                <h2 className="text-white font-semibold text-sm">Decaying Pages</h2>
                <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2 py-0.5 rounded-full">{decaying.length}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[440px]">
                  <thead>
                    <tr className="border-b border-white/8">
                      <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Page Type</th>
                      <th className="text-right px-4 py-3 text-white/40 font-medium text-xs">Last 7d</th>
                      <th className="text-right px-4 py-3 text-white/40 font-medium text-xs hidden sm:table-cell">Prev 7d</th>
                      <th className="text-right px-4 py-3 text-white/40 font-medium text-xs">Drop</th>
                    </tr>
                  </thead>
                  <tbody>
                    {decaying.map((r, i) => (
                      <tr key={i} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                        <td className="px-4 py-3.5 text-white/80 text-sm capitalize">{r.page_type ?? "page"}</td>
                        <td className="px-4 py-3.5 text-white/60 text-xs text-right">{r.affiliate_clicks_last_7}</td>
                        <td className="px-4 py-3.5 text-white/40 text-xs text-right hidden sm:table-cell">{r.affiliate_clicks_prev_7}</td>
                        <td className="px-4 py-3.5 text-right">
                          <span className="text-amber-400 font-medium text-xs">{r.decay_pct}%</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Config */}
          <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/8">
              <Settings className="h-4 w-4 text-white/40" />
              <h2 className="text-white font-semibold text-sm">Revenue Config</h2>
            </div>
            <div className="divide-y divide-white/5">
              {config.map((r) => (
                <div key={r.key} className="flex items-center gap-4 px-5 py-3.5">
                  <p className="text-white/70 text-sm font-mono flex-1">{r.key}</p>
                  <input
                    type="number"
                    step="0.1"
                    value={editConfig[r.key] ?? r.value_float}
                    onChange={(e) => setEditConfig((prev) => ({ ...prev, [r.key]: e.target.value }))}
                    className="w-24 h-8 px-2 rounded-lg border border-white/15 bg-white/5 text-white text-sm text-right focus:border-accent outline-none"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white/60 hover:text-white text-xs"
                    onClick={() => handleSaveConfig(r.key)}
                  >
                    Save
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Executive summaries */}
          <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/8">
              <FileText className="h-4 w-4 text-white/40" />
              <h2 className="text-white font-semibold text-sm">Executive Summaries</h2>
            </div>
            {summaries.length === 0 ? (
              <p className="px-5 py-8 text-white/40 text-sm text-center">No summaries yet. Click "Generate Summary" to create one.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {summaries.map((s) => (
                  <div key={s.id}>
                    <button
                      className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-white/3 transition-colors text-left"
                      onClick={() => setExpandedSummary(expandedSummary === s.id ? null : s.id)}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-white/70 text-sm font-medium">{s.week_label}</span>
                        {s.sent_at && (
                          <span className="text-xs text-pine bg-pine/10 border border-pine/20 px-2 py-0.5 rounded-full">Sent</span>
                        )}
                      </div>
                      {expandedSummary === s.id ? (
                        <ChevronUp className="h-4 w-4 text-white/30" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-white/30" />
                      )}
                    </button>
                    {expandedSummary === s.id && (
                      <div className="px-5 pb-5 border-t border-white/5">
                        <pre className="text-white/60 text-xs font-mono whitespace-pre-wrap mt-3 leading-relaxed">{s.content_md}</pre>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
