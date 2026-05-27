"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, TrendingUp, Activity, Search, BarChart2, Layers, GitMerge } from "lucide-react";

interface CdpOverview {
  total_users: number;
  total_events_today: number;
  active_sessions_now: number;
  signups_this_week: number;
  plan_wizard_started: number;
  plan_wizard_completed: number;
}

const NAV_CARDS = [
  { href: "/admin/cdp/users", label: "Users", description: "Browse all tracked users and their profiles", icon: Users, color: "text-blue-400" },
  { href: "/admin/cdp/events", label: "Event Stream", description: "Live feed of all analytics events", icon: Activity, color: "text-pine" },
  { href: "/admin/cdp/funnels", label: "Funnels", description: "Conversion funnel analysis", icon: GitMerge, color: "text-accent" },
  { href: "/admin/cdp/cohorts", label: "Cohorts", description: "Weekly retention cohort analysis", icon: Layers, color: "text-purple-400" },
  { href: "/admin/cdp/segments", label: "Segments", description: "User segments and audience builder", icon: TrendingUp, color: "text-amber-400" },
  { href: "/admin/cdp/gsc", label: "GSC Performance", description: "Google Search Console data", icon: Search, color: "text-blue-400" },
];

export default function CdpDashboardPage() {
  const [overview, setOverview] = useState<CdpOverview | null>(null);

  useEffect(() => {
    // Derive overview from publicly-available admin endpoints
    fetch("/api/v1/admin/cdp/users?page=1&page_size=1", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setOverview((prev) => ({ ...(prev ?? {} as CdpOverview), total_users: d.total ?? 0 })))
      .catch(() => {});
    fetch("/api/v1/admin/cdp/events/stream?page=1&page_size=1", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setOverview((prev) => ({ ...(prev ?? {} as CdpOverview), total_events_today: d.total ?? 0 })))
      .catch(() => {});
    fetch("/api/v1/admin/cdp/segments", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const newSignups = d.segments?.find((s: { name: string; user_count: number }) => s.name === "New Signups (7d)");
        const planStarters = d.segments?.find((s: { name: string; user_count: number }) => s.name === "Plan Starters");
        setOverview((prev) => ({
          ...(prev ?? {} as CdpOverview),
          signups_this_week: newSignups?.user_count ?? 0,
          plan_wizard_started: planStarters?.user_count ?? 0,
        }));
      })
      .catch(() => {});
  }, []);

  const kpis = [
    { label: "Total Users", value: overview?.total_users ?? "—", icon: Users, color: "text-blue-400" },
    { label: "Total Events", value: overview?.total_events_today ?? "—", icon: Activity, color: "text-pine" },
    { label: "New Signups (7d)", value: overview?.signups_this_week ?? "—", icon: TrendingUp, color: "text-accent" },
    { label: "Plan Starters", value: overview?.plan_wizard_started ?? "—", icon: BarChart2, color: "text-purple-400" },
  ];

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">CDP Analytics</h1>
          <p className="text-white/50 text-sm">Customer Data Platform — unified user behaviour, funnels, cohorts, and GSC.</p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
            <div className={`${kpi.color} bg-current/10 w-8 h-8 rounded-lg flex items-center justify-center mb-3`}>
              <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
            </div>
            <p className="text-white font-display text-2xl font-semibold leading-none mb-1">{kpi.value.toLocaleString()}</p>
            <p className="text-white/50 text-xs">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Nav cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {NAV_CARDS.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="bg-[#14161f] rounded-2xl border border-white/10 p-5 hover:border-white/20 hover:bg-[#1a1d2a] transition-all group"
          >
            <div className={`${card.color} w-8 h-8 rounded-lg bg-current/10 flex items-center justify-center mb-3`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
            <p className="text-white font-semibold text-sm mb-1 group-hover:text-accent transition-colors">{card.label}</p>
            <p className="text-white/40 text-xs">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
