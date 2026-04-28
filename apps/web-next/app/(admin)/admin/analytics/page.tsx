"use client";

import { useEffect, useState } from "react";
import { Eye, MousePointerClick, Users, FileText, Bot, TrendingUp } from "lucide-react";
import { fetchAnalyticsSummary, AnalyticsSummary } from "@/lib/api";

function StatCard({
  label,
  value,
  icon: Icon,
  iconColor,
  bg,
  loading,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  iconColor: string;
  bg: string;
  loading: boolean;
}) {
  return (
    <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
      <div className={`${bg} w-8 h-8 rounded-lg flex items-center justify-center mb-3`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      {loading ? (
        <div className="h-7 w-16 bg-white/5 rounded animate-pulse mb-1" />
      ) : (
        <p className="text-white font-display text-2xl font-semibold leading-none mb-1">{value}</p>
      )}
      <p className="text-white/50 text-xs">{label}</p>
    </div>
  );
}

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export default function AnalyticsPage() {
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalyticsSummary()
      .catch(() => null)
      .then((s) => {
        setSummary(s);
        setLoading(false);
      });
  }, []);

  const stats = [
    { label: "Pages published", value: summary ? fmt(summary.pages_published_total) : "—", icon: FileText, iconColor: "text-accent", bg: "bg-accent/10" },
    { label: "Leads (30d)", value: summary ? fmt(summary.leads_last_30d) : "—", icon: Users, iconColor: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Affiliate clicks (30d)", value: summary ? fmt(summary.affiliate_clicks_last_30d) : "—", icon: MousePointerClick, iconColor: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Newsletter subscribers", value: summary ? fmt(summary.newsletter_subscribers_total) : "—", icon: TrendingUp, iconColor: "text-pine", bg: "bg-pine/10" },
    { label: "Pipeline runs (30d)", value: summary ? fmt(summary.pipeline_runs_last_30d) : "—", icon: Eye, iconColor: "text-purple-400", bg: "bg-purple-500/10" },
    { label: "Agent runs (30d)", value: summary ? fmt(summary.agent_runs_last_30d) : "—", icon: Bot, iconColor: "text-white/50", bg: "bg-white/5" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Analytics</h1>
          <p className="text-white/50 text-sm">Content pipeline and monetisation metrics.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
        {stats.map((s) => (
          <StatCard key={s.label} {...s} loading={loading} />
        ))}
      </div>

      <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
        <p className="text-white font-semibold text-sm mb-1">Traffic analytics</p>
        <p className="text-white/40 text-xs">
          GA4 and Search Console data is collected via the GA4 measurement ID configured in{" "}
          <code className="font-mono text-white/60">NEXT_PUBLIC_GA4_ID</code>. Raw traffic metrics
          (pageviews, CTR, position) are available in the GA4 / Search Console dashboards directly —
          V1 does not pull them into this panel.
        </p>
      </div>
    </div>
  );
}
