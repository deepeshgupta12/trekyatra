"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import {
  LayoutDashboard, Search, Layers, FileText, CheckSquare, Link2,
  DollarSign, BarChart2, Terminal, Settings, ChevronRight, Menu, X,
  GitBranch, Bot, GitMerge, Database, LogOut, Users,
} from "lucide-react";
import { adminLogout } from "@/lib/admin-auth-api";

const NAV_GROUPS = [
  {
    label: "Pipeline",
    items: [
      { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/admin/pipeline", label: "Pipeline View", icon: GitMerge },
      { href: "/admin/topics", label: "Topic Discovery", icon: Search },
      { href: "/admin/clusters", label: "Keyword Clusters", icon: Layers },
      { href: "/admin/briefs", label: "Brief Review", icon: FileText },
      { href: "/admin/drafts", label: "Draft Review", icon: CheckSquare },
      { href: "/admin/fact-check", label: "Fact Check", icon: GitBranch },
    ],
  },
  {
    label: "Growth",
    items: [
      { href: "/admin/linking", label: "Internal Linking", icon: Link2 },
      { href: "/admin/leads", label: "Leads", icon: Users },
      { href: "/admin/monetization", label: "Monetization", icon: DollarSign },
      { href: "/admin/analytics", label: "Analytics", icon: BarChart2 },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/cms", label: "Master CMS", icon: Database },
      { href: "/admin/logs", label: "Agent Logs", icon: Terminal },
      { href: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

function NavContent({ pathname, onClose }: { pathname: string; onClose?: () => void }) {
  return (
    <>
      <div className="p-5 border-b border-white/8 flex items-center justify-between">
        <div>
          <Logo variant="light" />
          <span className="text-[10px] font-medium text-white/30 uppercase tracking-widest mt-1 block">
            Content Admin
          </span>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-white/40 hover:text-white lg:hidden">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="text-[10px] font-semibold text-white/20 uppercase tracking-widest px-3 mb-1.5">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all ${
                      active
                        ? "bg-accent/15 text-accent font-semibold border border-accent/20"
                        : "text-white/50 hover:text-white/90 hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
      <div className="p-4 border-t border-white/8">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-white/4 border border-white/8">
          <Bot className="h-4 w-4 text-blue-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-white/60 text-xs font-medium truncate">AI Pipeline</p>
            <p className="text-white/30 text-[10px]">Idle</p>
          </div>
          <span className="w-2 h-2 rounded-full bg-white/20 flex-shrink-0" />
        </div>
      </div>
    </>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  async function handleSignOut() {
    await adminLogout();
    router.push("/admin/sign-in");
  }

  const currentLabel =
    NAV_GROUPS.flatMap((g) => g.items).find((n) =>
      n.exact ? pathname === n.href : pathname.startsWith(n.href)
    )?.label ?? "Admin";

  return (
    <div className="min-h-screen flex bg-[#0c0e14]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-56 flex-col border-r border-white/8 bg-[#0f1117] fixed top-0 left-0 h-screen z-20">
        <NavContent pathname={pathname} />
      </aside>

      {/* Mobile drawer backdrop */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed top-0 left-0 h-screen w-64 flex flex-col bg-[#0f1117] border-r border-white/8 z-40 transition-transform duration-300 lg:hidden ${
          drawerOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <NavContent pathname={pathname} onClose={() => setDrawerOpen(false)} />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-56">
        {/* Top bar */}
        <header className="h-14 border-b border-white/8 flex items-center px-4 lg:px-6 gap-3 bg-[#0f1117]/90 backdrop-blur sticky top-0 z-10">
          <button
            className="lg:hidden text-white/50 hover:text-white mr-1"
            onClick={() => setDrawerOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-white/30 text-xs hidden lg:block">Admin</span>
          <ChevronRight className="h-3.5 w-3.5 text-white/15 hidden lg:block" />
          <span className="text-white/70 text-sm font-medium">{currentLabel}</span>
          <div className="ml-auto">
            <button
              onClick={handleSignOut}
              className="flex items-center gap-1.5 text-white/30 hover:text-white/70 text-xs transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
