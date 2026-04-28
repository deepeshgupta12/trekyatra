"use client";

import { useEffect, useState } from "react";
import { TrendingUp, FileText, DollarSign, Eye, Clock, Zap, Users, MousePointerClick, Bot, RefreshCw } from "lucide-react";
import Link from "next/link";
import { fetchAnalyticsSummary, fetchAgentRuns, AnalyticsSummary, AgentRun } from "@/lib/api";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

const agentTypeLabel: Record<string, string> = {
  trend_discovery: "TrendDiscovery",
  keyword_cluster: "KeywordCluster",
  content_brief: "ContentBrief",
  content_writing: "ContentWriting",
  seo_aeo: "SEO/AEO",
};

const statusStyle: Record<string, string> = {
  completed: "text-pine bg-pine/10 border border-pine/20",
  failed: "text-red-400 bg-red-400/10 border border-red-400/20",
  running: "text-blue-400 bg-blue-400/10 border border-blue-400/20",
  cancelled: "text-white/30 bg-white/5 border border-white/10",
};

export default function AdminDashboard() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchAnalyticsSummary().catch(() => null),
      fetchAgentRuns({ limit: 6 }).catch(() => [] as AgentRun[]),
    ]).then(([s, r]) => {
      setSummary(s);
      setRuns(r);
    }).finally(() => setLoading(false));
  }, []);

  const kpis = [
    { label: "Pages published", value: summary ? formatNumber(summary.pages_published_total) : "—", icon: FileText, bg: "bg-accent/10", iconColor: "text-accent", href: "/admin/cms" },
    { label: "Leads (30d)", value: summary ? formatNumber(summary.leads_last_30d) : "—", icon: Users, bg: "bg-blue-500/10", iconColor: "text-blue-400", href: "/admin/leads" },
    { label: "Affiliate clicks (30d)", value: summary ? formatNumber(summary.affiliate_clicks_last_30d) : "—", icon: MousePointerClick, bg: "bg-amber-500/10", iconColor: "text-amber-400", href: "/admin/analytics" },
    { label: "Newsletter subs", value: summary ? formatNumber(summary.newsletter_subscribers_total) : "—", icon: TrendingUp, bg: "bg-pine/10", iconColor: "text-pine", href: "/admin/analytics" },
  ];

  const pipelineLinks = [
    { label: "Topics", href: "/admin/topics", color: "text-accent", bg: "bg-accent/10", border: "border-accent/20" },
    { label: "Clusters", href: "/admin/clusters", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
    { label: "Briefs", href: "/admin/briefs", color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
    { label: "Drafts", href: "/admin/drafts", color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
    { label: "CMS", href: "/admin/cms", color: "text-pine", bg: "bg-pine/10", border: "border-pine/20" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Dashboard</h1>
          <p className="text-white/40 text-sm">TrekYatra content pipeline — V1 complete.</p>
        </div>
        <Link
          href="/admin/topics"
          className="flex items-center gap-2 text-xs font-medium bg-accent/10 text-accent border border-accent/20 hover:bg-accent/15 transition-colors px-3 py-2 rounded-xl w-fit"
        >
          <Zap className="h-3.5 w-3.5" />
          Run pipeline
        </Link>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href} className="bg-[#14161f] rounded-2xl border border-white/10 p-5 hover:bg-white/3 transition-colors">
            <div className={`${k.bg} w-8 h-8 rounded-lg flex items-center justify-center mb-3`}>
              <k.icon className={`h-4 w-4 ${k.iconColor}`} />
            </div>
            {loading ? (
              <div className="h-7 w-16 bg-white/5 rounded animate-pulse mb-1" />
            ) : (
              <p className="text-white font-display text-2xl font-semibold leading-none mb-1">{k.value}</p>
            )}
            <p className="text-white/50 text-xs">{k.label}</p>
          </Link>
        ))}
      </div>

      {/* Pipeline quick nav */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
        <h2 className="text-white font-semibold text-sm mb-4">Content Pipeline</h2>
        <div className="flex flex-wrap gap-3">
          {pipelineLinks.map((p) => (
            <Link
              key={p.label}
              href={p.href}
              className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-xl border ${p.color} ${p.bg} ${p.border} hover:opacity-80 transition-opacity`}
            >
              {p.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Recent agent runs */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
          <div className="flex items-center gap-2">
            <Bot className="h-3.5 w-3.5 text-white/30" />
            <h2 className="text-white font-semibold text-sm">Recent Agent Activity</h2>
          </div>
          <Link href="/admin/logs" className="text-accent text-xs font-medium">View all →</Link>
        </div>
        {loading ? (
          <div className="px-5 py-8 text-center text-white/30 text-sm">Loading…</div>
        ) : runs.length === 0 ? (
          <div className="px-5 py-8 text-center text-white/30 text-sm">No agent runs yet.</div>
        ) : (
          <div className="divide-y divide-white/5">
            {runs.map((run) => (
              <div key={run.id} className="flex items-center justify-between px-5 py-3 gap-4">
                <div className="min-w-0">
                  <p className="text-white/80 text-xs font-medium truncate">{agentTypeLabel[run.agent_type] ?? run.agent_type}</p>
                  <p className="text-white/30 text-xs font-mono truncate">#{run.id}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${statusStyle[run.status] ?? statusStyle.cancelled}`}>
                  {run.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Refresh queue", href: "/admin/refresh", icon: RefreshCw },
          { label: "Fact check", href: "/admin/fact-check", icon: Eye },
          { label: "Leads", href: "/admin/leads", icon: Users },
          { label: "Agent logs", href: "/admin/logs", icon: Clock },
        ].map((l) => (
          <Link
            key={l.label}
            href={l.href}
            className="bg-[#14161f] border border-white/10 rounded-2xl p-4 flex items-center gap-2.5 hover:bg-white/3 transition-colors"
          >
            <l.icon className="h-4 w-4 text-white/30 shrink-0" />
            <span className="text-white/60 text-xs font-medium">{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
