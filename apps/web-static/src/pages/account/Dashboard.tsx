import { SiteLayout } from "@/components/layout/SiteLayout";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrekCard } from "@/components/trek/TrekCard";
import { treks } from "@/data/treks";
import { Bookmark, GitCompare, Download, Settings, Mail, LogOut, Mountain } from "lucide-react";

export const Dashboard = () => {
  const tabs = [
    { icon: Mountain, label: "Overview", to: "/account" },
    { icon: Bookmark, label: "Saved treks", to: "/account/saved" },
    { icon: GitCompare, label: "Compare workspace", to: "/account/compare" },
    { icon: Download, label: "Downloads", to: "/account/downloads" },
    { icon: Mail, label: "Enquiries", to: "/account/enquiries" },
    { icon: Settings, label: "Settings", to: "/account/settings" },
  ];
  return (
    <SiteLayout>
      <section className="py-12">
        <div className="container-wide grid lg:grid-cols-[260px_1fr] gap-10">
          <aside>
            <div className="p-5 bg-card border border-border rounded-2xl mb-3">
              <div className="h-12 w-12 rounded-full bg-gradient-saffron mb-3" />
              <div className="font-display text-lg font-semibold">Aarav Sharma</div>
              <div className="text-xs text-muted-foreground">aarav@trail.in</div>
            </div>
            <nav className="space-y-1">
              {tabs.map(t => (
                <Link key={t.to} to={t.to} className="flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-muted text-sm">
                  <t.icon className="h-4 w-4 text-accent" /> {t.label}
                </Link>
              ))}
              <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-muted text-sm text-muted-foreground">
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            </nav>
          </aside>
          <div>
            <h1 className="font-display text-4xl font-semibold mb-2">Welcome back, Aarav</h1>
            <p className="text-muted-foreground mb-8">Your trekking workspace — saved trails, comparisons, downloads and planning.</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
              {[["8","Saved treks"],["2","Comparisons"],["3","Downloads"],["1","Active enquiry"]].map(([v,l]) => (
                <div key={l} className="p-5 bg-card border border-border rounded-2xl">
                  <div className="font-display text-3xl font-semibold text-accent">{v}</div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{l}</div>
                </div>
              ))}
            </div>
            <h2 className="font-display text-2xl font-semibold mb-4">Recently saved</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
              {treks.slice(0, 3).map(t => <TrekCard key={t.slug} trek={t} />)}
            </div>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
};
