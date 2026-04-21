import { Link } from "react-router-dom";
import { Logo } from "@/components/brand/Logo";
import { LayoutDashboard, Compass, Brain, FileText, Eye, ShieldCheck, Link2, DollarSign, BarChart3, ScrollText, Settings, Search, Bell, TrendingUp, AlertCircle, CheckCircle2, Clock } from "lucide-react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", to: "/admin" },
  { icon: Compass, label: "Topic Discovery", to: "/admin/topics" },
  { icon: Brain, label: "Keyword Clusters", to: "/admin/clusters" },
  { icon: FileText, label: "Brief Review", to: "/admin/briefs" },
  { icon: Eye, label: "Draft Review", to: "/admin/drafts" },
  { icon: ShieldCheck, label: "Fact Check", to: "/admin/fact-check" },
  { icon: Link2, label: "Internal Linking", to: "/admin/linking" },
  { icon: DollarSign, label: "Monetization", to: "/admin/monetization" },
  { icon: BarChart3, label: "Analytics", to: "/admin/analytics" },
  { icon: ScrollText, label: "Agent Logs", to: "/admin/logs" },
  { icon: Settings, label: "Settings", to: "/admin/settings" },
];

export const AdminLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex bg-background">
    <aside className="w-64 bg-sidebar text-sidebar-foreground flex-shrink-0 flex flex-col">
      <div className="p-5 border-b border-sidebar-border">
        <Logo variant="light" />
        <div className="mt-3 text-[10px] uppercase tracking-widest text-sidebar-accent-foreground/60">Orchestration Layer</div>
      </div>
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map(n => (
          <Link key={n.to} to={n.to} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:bg-sidebar-accent transition-colors">
            <n.icon className="h-4 w-4 text-sidebar-primary" />
            {n.label}
          </Link>
        ))}
      </nav>
      <div className="p-5 border-t border-sidebar-border text-xs text-sidebar-foreground/60">
        <div className="flex items-center gap-2"><div className="h-2 w-2 rounded-full bg-success" /> System healthy</div>
      </div>
    </aside>
    <div className="flex-1 flex flex-col">
      <header className="h-14 bg-card border-b border-border flex items-center px-6 gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input placeholder="Search topics, briefs, drafts…" className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-surface text-sm" />
        </div>
        <button className="h-9 w-9 rounded-lg hover:bg-muted flex items-center justify-center"><Bell className="h-4 w-4" /></button>
        <div className="h-9 w-9 rounded-full bg-gradient-saffron" />
      </header>
      <div className="flex-1 overflow-y-auto p-8">{children}</div>
    </div>
  </div>
);

export const AdminDashboard = () => (
  <AdminLayout>
    <div className="mb-8">
      <h1 className="font-display text-3xl font-semibold">Orchestration Dashboard</h1>
      <p className="text-sm text-muted-foreground mt-1">Live snapshot of content pipeline, freshness, monetization, and system health.</p>
    </div>

    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {[
        { label: "Topics in pipeline", value: "47", trend: "+12 this week", color: "text-accent", icon: Compass },
        { label: "Awaiting fact-check", value: "8", trend: "3 high priority", color: "text-warning", icon: AlertCircle },
        { label: "Published this month", value: "23", trend: "+18% vs last", color: "text-success", icon: CheckCircle2 },
        { label: "Refresh alerts", value: "14", trend: "5 stale > 90 days", color: "text-destructive", icon: Clock },
      ].map(k => (
        <div key={k.label} className="p-5 bg-card border border-border rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs uppercase tracking-widest text-muted-foreground">{k.label}</div>
            <k.icon className={`h-4 w-4 ${k.color}`} />
          </div>
          <div className="font-display text-3xl font-semibold">{k.value}</div>
          <div className="text-xs text-muted-foreground mt-1">{k.trend}</div>
        </div>
      ))}
    </div>

    <div className="grid lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 p-6 bg-card border border-border rounded-xl">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-display text-xl font-semibold">Publish queue</h3>
          <span className="text-xs text-muted-foreground">Last sync 2 min ago</span>
        </div>
        <div className="space-y-3">
          {[
            ["Best treks in May 2026", "Brief review", "P1", "warning"],
            ["Hampta Pass packing list refresh", "Draft review", "P2", "accent"],
            ["Kedarkantha vs Brahmatal — comparison", "Fact-check", "P1", "destructive"],
            ["Karnataka monsoon treks roundup", "Internal linking", "P3", "muted-foreground"],
            ["Kashmir Great Lakes — cost update", "Ready", "P2", "success"],
          ].map(([title, stage, p, color]) => (
            <div key={title as string} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted">
              <div>
                <div className="font-medium text-sm">{title}</div>
                <div className="text-xs text-muted-foreground">{stage}</div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full bg-${color}/15 text-${color}`}>{p}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="p-6 bg-gradient-pine text-surface rounded-xl">
        <div className="text-xs uppercase tracking-widest text-accent-glow mb-3">This month</div>
        <div className="font-display text-4xl font-semibold mb-1">₹2.4L</div>
        <div className="text-sm text-surface/70 mb-6">Total revenue (affiliate + leads + products)</div>
        <div className="space-y-3 text-sm">
          {[["Affiliate","₹1.1L","+22%"],["Leads","₹84K","+8%"],["Products","₹46K","+34%"]].map(([k,v,t]) => (
            <div key={k} className="flex justify-between items-center">
              <span className="text-surface/80">{k}</span>
              <span><span className="font-semibold mr-2">{v}</span><span className="text-success text-xs">{t}</span></span>
            </div>
          ))}
        </div>
      </div>
    </div>

    <div className="mt-5 p-6 bg-card border border-border rounded-xl">
      <h3 className="font-display text-xl font-semibold mb-5">Workflow health</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[["Topic agent","Healthy","success"],["Brief agent","Healthy","success"],["Draft agent","Slow","warning"],["Fact-check","Healthy","success"]].map(([n, s, c]) => (
          <div key={n as string} className="p-4 bg-surface-muted rounded-lg">
            <div className="text-sm font-medium">{n}</div>
            <div className={`text-xs text-${c} mt-1 flex items-center gap-1.5`}>
              <div className={`h-1.5 w-1.5 rounded-full bg-${c}`} /> {s}
            </div>
          </div>
        ))}
      </div>
    </div>
  </AdminLayout>
);
