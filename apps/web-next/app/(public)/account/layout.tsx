"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, BarChart2, Download, MessageSquare, Settings, LayoutDashboard } from "lucide-react";

const NAV = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/account/saved", label: "Saved Treks", icon: Bookmark },
  { href: "/account/compare", label: "Compare Lists", icon: BarChart2 },
  { href: "/account/downloads", label: "Downloads", icon: Download },
  { href: "/account/enquiries", label: "Enquiries", icon: MessageSquare },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="container-wide py-10 lg:py-16">
      <div className="flex gap-8 lg:gap-12 items-start">
        {/* Sidebar */}
        <aside className="hidden lg:block w-56 flex-shrink-0 sticky top-24">
          <nav className="space-y-1">
            {NAV.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    active ? "bg-accent/10 text-accent" : "text-foreground/70 hover:text-foreground hover:bg-surface"
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  {label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile tab bar */}
        <div className="lg:hidden w-full mb-6 overflow-x-auto scrollbar-hide">
          <div className="flex gap-1 min-w-max">
            {NAV.map(({ href, label, icon: Icon, exact }) => {
              const active = exact ? pathname === href : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium border transition-all whitespace-nowrap ${
                    active ? "bg-accent text-white border-accent" : "bg-surface border-border text-foreground/70"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Main */}
        <main className="flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}
