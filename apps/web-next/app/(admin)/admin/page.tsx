import { TrendingUp, FileText, DollarSign, Eye, Clock, CheckCircle, AlertCircle, ArrowRight, Search, Layers, Bot, Zap } from "lucide-react";
import Link from "next/link";

const KPIs = [
  { label: "Published articles", value: "147", delta: "+12 this month", icon: FileText, bg: "bg-accent/10", iconColor: "text-accent" },
  { label: "Monthly pageviews", value: "84.2K", delta: "+18% MoM", icon: Eye, bg: "bg-blue-500/10", iconColor: "text-blue-400" },
  { label: "Affiliate revenue", value: "₹1.4L", delta: "+23% MoM", icon: DollarSign, bg: "bg-amber-500/10", iconColor: "text-amber-400" },
  { label: "Avg. position", value: "4.2", delta: "↑ 1.1 positions", icon: TrendingUp, bg: "bg-pine/10", iconColor: "text-pine" },
];

const PIPELINE_STAGES = [
  { label: "Trends", icon: Search, href: "/admin/topics", count: 8, color: "text-accent", bg: "bg-accent/10", border: "border-accent/20" },
  { label: "Clusters", icon: Layers, href: "/admin/clusters", count: 4, color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" },
  { label: "Briefs", icon: FileText, href: "/admin/briefs", count: 3, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
  { label: "Drafts", icon: Clock, href: "/admin/drafts", count: 2, color: "text-amber-400", bg: "bg-amber-500/10", border: "border-amber-500/20" },
  { label: "Live", icon: CheckCircle, href: "/admin/drafts", count: 147, color: "text-pine", bg: "bg-pine/10", border: "border-pine/20" },
];

const QUEUE = [
  { title: "Roopkund Trek: Complete Guide 2025", stage: "Draft Review", status: "needs-review" },
  { title: "Best Monsoon Treks in Maharashtra", stage: "Fact Check", status: "in-progress" },
  { title: "Hampta Pass Itinerary — 5 Days", stage: "Published", status: "live" },
  { title: "Chopta to Tungnath Day Trek", stage: "Brief", status: "pending" },
];

const RECENT_AGENTS = [
  { agent: "TrendDiscovery", action: "Scored 8 new topic opportunities", time: "14 min ago", status: "success" },
  { agent: "KeywordCluster", action: "Rebuilt 4 clusters from topic IDs", time: "1h ago", status: "success" },
  { agent: "ContentWriter", action: "Draft generated — Roopkund Guide", time: "2h ago", status: "success" },
  { agent: "FactChecker", action: "Flagged claim in Hampta Pass article", time: "3h ago", status: "warning" },
];

const stageStyle: Record<string, string> = {
  "needs-review": "text-amber-400 bg-amber-400/10 border border-amber-400/20",
  "in-progress": "text-blue-400 bg-blue-400/10 border border-blue-400/20",
  "live": "text-pine bg-pine/10 border border-pine/20",
  "pending": "text-white/40 bg-white/5 border border-white/10",
};

const agentStatusStyle: Record<string, string> = {
  success: "bg-pine w-1.5 h-1.5 rounded-full",
  warning: "bg-amber-400 w-1.5 h-1.5 rounded-full",
  error: "bg-red-400 w-1.5 h-1.5 rounded-full",
};

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Dashboard</h1>
          <p className="text-white/40 text-sm">TrekYatra content pipeline — V1 in progress.</p>
        </div>
        <Link
          href="/admin/topics"
          className="flex items-center gap-2 text-xs font-medium bg-accent/10 text-accent border border-accent/20 hover:bg-accent/15 transition-colors px-3 py-2 rounded-xl"
        >
          <Zap className="h-3.5 w-3.5" />
          Run agents
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {KPIs.map(({ label, value, delta, icon: Icon, bg, iconColor }) => (
          <div key={label} className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
            <div className={`${bg} w-8 h-8 rounded-lg flex items-center justify-center mb-3`}>
              <Icon className={`h-4 w-4 ${iconColor}`} />
            </div>
            <p className="text-white font-display text-2xl font-semibold leading-none mb-1">{value}</p>
            <p className="text-white/50 text-xs">{label}</p>
            <p className="text-white/25 text-xs mt-1">{delta}</p>
          </div>
        ))}
      </div>

      {/* Content pipeline */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-white font-semibold text-sm">Content Pipeline</h2>
            <p className="text-white/30 text-xs mt-0.5">Items at each stage right now</p>
          </div>
          <Bot className="h-4 w-4 text-white/20" />
        </div>
        <div className="flex items-center gap-1">
          {PIPELINE_STAGES.map((stage, i) => {
            const Icon = stage.icon;
            return (
              <div key={stage.label} className="flex items-center gap-1 flex-1">
                <Link
                  href={stage.href}
                  className={`flex-1 flex flex-col items-center gap-2 rounded-xl border p-3 text-center hover:brightness-110 transition-all ${stage.bg} ${stage.border}`}
                >
                  <Icon className={`h-4 w-4 ${stage.color}`} />
                  <span className={`text-xs font-semibold ${stage.color}`}>{stage.count}</span>
                  <span className="text-white/40 text-[10px]">{stage.label}</span>
                </Link>
                {i < PIPELINE_STAGES.length - 1 && (
                  <ArrowRight className="h-3.5 w-3.5 text-white/15 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Publish queue */}
        <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
            <h2 className="text-white font-semibold text-sm">Publish Queue</h2>
            <Link href="/admin/drafts" className="text-accent text-xs font-medium hover:text-accent/80">
              View all →
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {QUEUE.map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-white/3 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-sm font-medium truncate">{item.title}</p>
                  <p className="text-white/30 text-xs mt-0.5">{item.stage}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${stageStyle[item.status]}`}>
                  {item.stage}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent agent activity */}
        <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
            <h2 className="text-white font-semibold text-sm">Agent Activity</h2>
            <Link href="/admin/logs" className="text-accent text-xs font-medium hover:text-accent/80">
              View logs →
            </Link>
          </div>
          <div className="divide-y divide-white/5">
            {RECENT_AGENTS.map((run, i) => (
              <div key={i} className="flex items-start gap-3 px-5 py-3.5 hover:bg-white/3 transition-colors">
                <span className={`mt-1.5 flex-shrink-0 ${agentStatusStyle[run.status]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-white/80 text-sm font-medium">{run.action}</p>
                  <p className="text-white/30 text-xs mt-0.5">
                    <span className="text-accent/60">[{run.agent}]</span> · {run.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
