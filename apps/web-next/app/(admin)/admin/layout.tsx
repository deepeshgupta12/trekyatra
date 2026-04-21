"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/brand/Logo";
import {
  LayoutDashboard, Search, Layers, FileText, CheckSquare, Link2,
  DollarSign, BarChart2, Terminal, Settings, ChevronRight,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/topics", label: "Topic Discovery", icon: Search },
  { href: "/admin/clusters", label: "Keyword Clusters", icon: Layers },
  { href: "/admin/briefs", label: "Brief Review", icon: FileText },
  { href: "/admin/drafts", label: "Draft Review", icon: CheckSquare },
  { href: "/admin/fact-check", label: "Fact Check", icon: CheckSquare },
  { href: "/admin/linking", label: "Internal Linking", icon: Link2 },
  { href: "/admin/monetization", label: "Monetization", icon: DollarSign },
  { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
  { href: "/admin/logs", label: "Agent Logs", icon: Terminal },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen flex bg-[#0f1117]">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-60 flex-col border-r border-white/8 bg-[#0f1117] sticky top-0 h-screen">
        <div className="p-5 border-b border-white/8">
          <Logo variant="light" />
          <span className="text-[10px] font-medium text-white/40 uppercase tracking-widest mt-1 block">Admin</span>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto scrollbar-hide">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? "bg-accent/20 text-accent font-medium"
                    : "text-white/50 hover:text-white/90 hover:bg-white/5"
                }`}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="h-14 border-b border-white/8 flex items-center px-6 gap-3 bg-[#0f1117] sticky top-0 z-10">
          <span className="text-white/40 text-sm hidden lg:block">
            {NAV.find(n => n.exact ? pathname === n.href : pathname.startsWith(n.href))?.label ?? "Admin"}
          </span>
          <ChevronRight className="h-3.5 w-3.5 text-white/20 hidden lg:block" />
          <span className="text-white/80 text-sm font-medium ml-auto text-xs bg-white/10 px-3 py-1 rounded-full">
            Agent: Idle
          </span>
        </header>
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
