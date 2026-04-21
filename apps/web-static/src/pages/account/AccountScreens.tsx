import { SiteLayout } from "@/components/layout/SiteLayout";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { TrekCard } from "@/components/trek/TrekCard";
import { treks } from "@/data/treks";
import { Bookmark, GitCompare, Download, Settings, Mail, LogOut, Mountain, Search, Filter, X, FileText, Calendar, ChevronRight, Trash2, Clock, CheckCircle2 } from "lucide-react";

const tabs = [
  { icon: Mountain, label: "Overview", to: "/account" },
  { icon: Bookmark, label: "Saved treks", to: "/account/saved" },
  { icon: GitCompare, label: "Compare workspace", to: "/account/compare" },
  { icon: Download, label: "Downloads", to: "/account/downloads" },
  { icon: Mail, label: "Enquiries", to: "/account/enquiries" },
  { icon: Settings, label: "Settings", to: "/account/settings" },
];

const Shell = ({ active, title, sub, children }: any) => (
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
              <Link key={t.to} to={t.to} className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm ${active === t.to ? 'bg-primary/10 text-primary font-medium' : 'hover:bg-muted'}`}>
                <t.icon className="h-4 w-4" /> {t.label}
              </Link>
            ))}
            <button className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-muted text-sm text-muted-foreground">
              <LogOut className="h-4 w-4" /> Sign out
            </button>
          </nav>
        </aside>
        <div>
          <h1 className="font-display text-4xl font-semibold mb-2">{title}</h1>
          <p className="text-muted-foreground mb-8">{sub}</p>
          {children}
        </div>
      </div>
    </section>
  </SiteLayout>
);

export const SavedTreks = () => (
  <Shell active="/account/saved" title="Saved treks" sub="Your shortlist — keep the ones that excite you, drop the ones that don't.">
    <div className="flex items-center gap-2 mb-6 flex-wrap">
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input placeholder="Search saved" className="w-full h-10 pl-9 pr-3 rounded-xl border border-border bg-card text-sm" />
      </div>
      <button className="h-10 px-3 rounded-xl border border-border bg-card text-sm flex items-center gap-1.5"><Filter className="h-3.5 w-3.5" /> Region</button>
      <button className="h-10 px-3 rounded-xl border border-border bg-card text-sm">Difficulty</button>
      <button className="h-10 px-3 rounded-xl border border-border bg-card text-sm">Season</button>
    </div>
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
      {treks.map(t => <TrekCard key={t.slug} trek={t} />)}
    </div>
  </Shell>
);

export const CompareWorkspace = () => (
  <Shell active="/account/compare" title="Compare workspace" sub="Build your shortlist side-by-side. Up to 4 treks at a time.">
    <div className="grid md:grid-cols-3 gap-4 mb-6">
      {treks.slice(0, 2).map(t => (
        <div key={t.slug} className="p-5 bg-card border border-border rounded-2xl relative">
          <button className="absolute top-3 right-3 h-7 w-7 rounded-full bg-muted flex items-center justify-center"><X className="h-3.5 w-3.5" /></button>
          <img src={t.image} alt="" className="h-32 w-full object-cover rounded-lg mb-3" />
          <div className="font-display text-lg font-semibold">{t.name}</div>
          <div className="text-xs text-muted-foreground">{t.region}</div>
          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
            <div><div className="text-muted-foreground">Days</div><div className="font-semibold">{t.duration}</div></div>
            <div><div className="text-muted-foreground">Altitude</div><div className="font-semibold">{t.altitude}</div></div>
          </div>
        </div>
      ))}
      <button className="border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-accent hover:text-accent transition-colors min-h-[280px]">
        <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center"><Bookmark className="h-5 w-5" /></div>
        Add a trek
      </button>
    </div>
    <Link to="/compare"><Button variant="hero" size="lg">Open full comparison <ChevronRight className="h-4 w-4" /></Button></Link>
  </Shell>
);

export const Downloads = () => (
  <Shell active="/account/downloads" title="Downloads" sub="Every resource, planner, and checklist you've saved.">
    <div className="space-y-3">
      {[
        { t: "Himalayan Packing System", d: "PDF · 24 pages · 2.4 MB", date: "Jan 18, 2026" },
        { t: "First Trek Training Plan", d: "PDF · 18 pages · 1.8 MB", date: "Jan 12, 2026" },
        { t: "Trekking Cost Calculator", d: "Notion template", date: "Dec 28, 2025" },
      ].map(d => (
        <div key={d.t} className="p-5 bg-card border border-border rounded-2xl flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center"><FileText className="h-5 w-5 text-accent" /></div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-lg font-semibold">{d.t}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{d.d} · saved {d.date}</div>
          </div>
          <Button variant="outline" size="sm"><Download className="h-3.5 w-3.5" /> Download</Button>
        </div>
      ))}
    </div>
  </Shell>
);

export const Enquiries = () => (
  <Shell active="/account/enquiries" title="Enquiry history" sub="Your planning conversations and trek consultations.">
    <div className="space-y-4">
      {[
        { trek: "Hampta Pass · June 2026", status: "In progress", color: "warning", date: "Jan 14, 2026", note: "Operator shortlisted. Awaiting your group size confirmation." },
        { trek: "Kashmir Great Lakes · July 2026", status: "Quote sent", color: "accent", date: "Jan 8, 2026", note: "3 operators quoted. Range ₹16K-₹24K per person." },
        { trek: "Rajmachi · Weekend", status: "Closed", color: "success", date: "Dec 20, 2025", note: "Trek completed. Feedback shared." },
      ].map(e => (
        <div key={e.trek} className="p-5 bg-card border border-border rounded-2xl">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="font-display text-lg font-semibold">{e.trek}</div>
              <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5"><Calendar className="h-3 w-3" /> Submitted {e.date}</div>
            </div>
            <span className={`text-xs px-2.5 py-1 rounded-full bg-${e.color}/15 text-${e.color}`}>{e.status}</span>
          </div>
          <div className="text-sm text-foreground/80 mt-3 p-3 bg-surface-muted rounded-lg">{e.note}</div>
        </div>
      ))}
    </div>
  </Shell>
);

export const AccountSettings = () => (
  <Shell active="/account/settings" title="Account settings" sub="Manage your profile, preferences, and notifications.">
    <div className="space-y-6 max-w-2xl">
      {[
        { h: "Profile", fields: [["Full name","Aarav Sharma"],["Email","aarav@trail.in"],["Mobile","+91 98765 43210"]] },
        { h: "Trekking preferences", fields: [["Home city","Bangalore"],["Fitness level","Intermediate"],["Preferred regions","Himachal, Uttarakhand"]] },
      ].map(s => (
        <div key={s.h} className="p-6 bg-card border border-border rounded-2xl">
          <h3 className="font-display text-xl font-semibold mb-4">{s.h}</h3>
          <div className="space-y-3">
            {s.fields.map(([l, v]) => (
              <div key={l}>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">{l}</label>
                <input defaultValue={v} className="w-full h-11 px-4 rounded-xl border border-border bg-surface mt-1.5 text-sm" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="p-6 bg-card border border-border rounded-2xl">
        <h3 className="font-display text-xl font-semibold mb-4">Notifications</h3>
        <div className="space-y-3">
          {["Monthly newsletter","Permit & safety alerts for saved treks","New comparison guides","Gear deal alerts"].map(n => (
            <label key={n} className="flex items-center justify-between p-3 hover:bg-muted rounded-lg cursor-pointer">
              <span className="text-sm">{n}</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-accent" />
            </label>
          ))}
        </div>
      </div>
      <Button variant="hero" size="lg">Save changes</Button>
    </div>
  </Shell>
);
