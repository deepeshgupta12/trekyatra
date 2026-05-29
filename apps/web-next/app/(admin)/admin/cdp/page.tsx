"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import {
  Users, TrendingUp, Activity, Search, BarChart2, Layers,
  GitMerge, Zap, AlertTriangle, Info, Eye, Webhook, FileBarChart,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface SparkPoint { label: string; value: number }
interface KpiTile {
  key: string; label: string; value: number; delta: number;
  delta_pct: number; trend: "up" | "down" | "flat"; sparkline: SparkPoint[];
}
interface AlertItem { id: string; severity: string; title: string; body: string }
interface FeedEvent {
  id: string; anonymous_id: string; event_category: string;
  event_name: string; page_url?: string; created_at: string; is_internal: boolean;
}

// ── Sparkline SVG ─────────────────────────────────────────────────────────────

function Sparkline({ data }: { data: SparkPoint[] }) {
  if (!data || data.length < 2) return <div className="w-28 h-10 bg-white/5 rounded" />;
  const vals = data.map((p) => p.value);
  const min = Math.min(...vals);
  const max = Math.max(...vals);
  const range = max - min || 1;
  const W = 112, H = 36, PAD = 2;
  const step = (W - PAD * 2) / (vals.length - 1);
  const pts = vals
    .map((v, i) => {
      const x = PAD + i * step;
      const y = H - PAD - ((v - min) / range) * (H - PAD * 2);
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <polyline
        points={pts}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        className="text-accent"
      />
    </svg>
  );
}

// ── Category badge colour ──────────────────────────────────────────────────────

function CategoryBadge({ cat }: { cat: string }) {
  const map: Record<string, string> = {
    navigation: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    engagement: "text-accent bg-accent/10 border-accent/20",
    conversion: "text-pine bg-pine/10 border-pine/20",
    system: "text-purple-400 bg-purple-400/10 border-purple-400/20",
  };
  return (
    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${map[cat] ?? "text-white/40 bg-white/5 border-white/10"}`}>
      {cat}
    </span>
  );
}

// ── Nav cards ─────────────────────────────────────────────────────────────────

const NAV_CARDS = [
  { href: "/admin/cdp/users", label: "Users", description: "Browse all tracked users and their profiles", icon: Users, color: "text-blue-400" },
  { href: "/admin/cdp/events", label: "Event Explorer", description: "Filter, search, and export analytics events", icon: Activity, color: "text-pine" },
  { href: "/admin/cdp/funnels", label: "Funnels", description: "Conversion funnel analysis with templates", icon: GitMerge, color: "text-accent" },
  { href: "/admin/cdp/cohorts", label: "Cohorts", description: "Configurable retention heatmap", icon: Layers, color: "text-purple-400" },
  { href: "/admin/cdp/segments", label: "Segments", description: "Default + custom audience segments", icon: TrendingUp, color: "text-amber-400" },
  { href: "/admin/cdp/segments/builder", label: "Segment Builder", description: "Build custom rule-based segments", icon: BarChart2, color: "text-accent" },
  { href: "/admin/cdp/content", label: "Content Analytics", description: "Per-page views, scroll depth, leads", icon: FileBarChart, color: "text-blue-400" },
  { href: "/admin/cdp/webhooks", label: "Webhooks", description: "Campaign trigger webhook rules", icon: Webhook, color: "text-pine" },
  { href: "/admin/cdp/gsc", label: "GSC Performance", description: "Google Search Console intelligence", icon: Search, color: "text-blue-400" },
  { href: "/admin/cdp/activity", label: "User Activity", description: "Email lookup → event timeline", icon: Eye, color: "text-purple-400" },
];

// ── Page ──────────────────────────────────────────────────────────────────────

export default function CdpDashboardPage() {
  const [tiles, setTiles] = useState<KpiTile[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [feed, setFeed] = useState<FeedEvent[]>([]);
  const [loadingKpis, setLoadingKpis] = useState(true);
  const [excludeInternal, setExcludeInternal] = useState(true);

  const fetchFeed = useCallback(() => {
    fetch(`/api/v1/admin/cdp/realtime-feed?exclude_internal=${excludeInternal}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setFeed(d.events ?? []))
      .catch(() => {});
  }, [excludeInternal]);

  useEffect(() => {
    fetch("/api/v1/admin/cdp/kpis", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setTiles(d.tiles ?? []); setLoadingKpis(false); })
      .catch(() => setLoadingKpis(false));
    fetch("/api/v1/admin/cdp/alerts", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setAlerts(d.alerts ?? []))
      .catch(() => {});
    fetchFeed();
  }, [fetchFeed]);

  // Auto-refresh feed every 10s
  useEffect(() => {
    const id = setInterval(fetchFeed, 10000);
    return () => clearInterval(id);
  }, [fetchFeed]);

  const trendIcon = (trend: string) =>
    trend === "up" ? "▲" : trend === "down" ? "▼" : "→";
  const trendColor = (trend: string) =>
    trend === "up" ? "text-pine" : trend === "down" ? "text-red-400" : "text-white/40";

  const alertIcon = (severity: string) => {
    if (severity === "critical") return <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />;
    if (severity === "warning") return <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />;
    return <Info className="h-4 w-4 text-blue-400 shrink-0" />;
  };

  return (
    <div className="min-h-screen bg-[#0c0e14] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-8">
          <div>
            <h1 className="font-display text-2xl font-semibold text-white mb-1">CDP Analytics</h1>
            <p className="text-white/50 text-sm">Executive dashboard — real-time event intelligence.</p>
          </div>
          <label className="flex items-center gap-2 text-xs text-white/50 cursor-pointer">
            <input
              type="checkbox"
              checked={excludeInternal}
              onChange={(e) => setExcludeInternal(e.target.checked)}
              className="accent-accent"
            />
            Exclude internal traffic
          </label>
        </div>

        {/* Alert Rail */}
        {alerts.length > 0 && (
          <div className="mb-6 flex flex-col gap-2">
            {alerts.map((a) => (
              <div
                key={a.id}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                  a.severity === "critical"
                    ? "bg-red-400/10 border-red-400/20 text-red-300"
                    : a.severity === "warning"
                    ? "bg-amber-400/10 border-amber-400/20 text-amber-300"
                    : "bg-blue-400/10 border-blue-400/20 text-blue-300"
                }`}
              >
                {alertIcon(a.severity)}
                <div>
                  <p className="font-semibold">{a.title}</p>
                  <p className="text-xs opacity-80 mt-0.5">{a.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* KPI tiles + real-time feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">

          {/* KPI grid — 2 columns on left */}
          <div className="lg:col-span-2">
            {loadingKpis ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="bg-[#14161f] rounded-2xl border border-white/10 p-4 h-28 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {tiles.map((tile) => (
                  <div key={tile.key} className="bg-[#14161f] rounded-2xl border border-white/10 p-4 flex flex-col gap-2">
                    <p className="text-white/40 text-[10px] font-medium uppercase tracking-wider leading-tight">{tile.label}</p>
                    <p className="font-display text-2xl font-bold text-white leading-none">{tile.value.toLocaleString()}</p>
                    <div className={`text-[11px] font-medium flex items-center gap-1 ${trendColor(tile.trend)}`}>
                      <span>{trendIcon(tile.trend)}</span>
                      <span>{tile.delta_pct > 0 ? "+" : ""}{tile.delta_pct}%</span>
                    </div>
                    <div className="mt-auto opacity-60">
                      <Sparkline data={tile.sparkline} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Real-time feed */}
          <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-pine animate-pulse" />
                <h2 className="text-white font-semibold text-sm">Live Event Feed</h2>
              </div>
              <span className="text-white/30 text-[10px]">auto-refreshes 10s</span>
            </div>
            <div className="overflow-y-auto flex-1 max-h-80">
              {feed.length === 0 ? (
                <p className="text-white/30 text-xs text-center py-8">No recent events.</p>
              ) : (
                feed.slice(0, 50).map((ev) => (
                  <div key={ev.id} className="flex flex-col gap-0.5 px-4 py-2 border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CategoryBadge cat={ev.event_category} />
                      <span className="text-white/80 text-xs font-medium">{ev.event_name}</span>
                    </div>
                    {ev.page_url && (
                      <p className="text-white/30 text-[10px] truncate">{ev.page_url}</p>
                    )}
                    <p className="text-white/20 text-[10px]">
                      {new Date(ev.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Nav cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {NAV_CARDS.map((card) => (
            <Link key={card.href} href={card.href}>
              <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5 hover:border-white/20 hover:bg-[#1a1d2a] transition-all cursor-pointer h-full">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 bg-white/5`}>
                  <card.icon className={`h-4 w-4 ${card.color}`} />
                </div>
                <p className="font-semibold text-white text-sm mb-1">{card.label}</p>
                <p className="text-white/40 text-xs">{card.description}</p>
              </div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
