import { AdminLayout } from "./AdminPages";
import { TrendingUp, Search, Filter, ArrowUpRight, ArrowDownRight, AlertTriangle, CheckCircle2, Clock, FileText, Eye, ShieldCheck, Link2, DollarSign, BarChart3, ScrollText, Settings as SettingsIcon, Sparkles, Brain, Plug, MoreHorizontal, ChevronRight } from "lucide-react";

const Header = ({ title, sub, action }: { title: string; sub: string; action?: string }) => (
  <div className="mb-8 flex items-end justify-between gap-4 flex-wrap">
    <div>
      <h1 className="font-display text-3xl font-semibold">{title}</h1>
      <p className="text-sm text-muted-foreground mt-1">{sub}</p>
    </div>
    {action && <button className="h-10 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium">{action}</button>}
  </div>
);

const Toolbar = ({ children }: any) => (
  <div className="flex items-center gap-2 mb-5 flex-wrap">
    <div className="relative flex-1 min-w-[240px] max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <input placeholder="Search…" className="w-full h-9 pl-9 pr-3 rounded-lg border border-border bg-card text-sm" />
    </div>
    <button className="h-9 px-3 rounded-lg border border-border bg-card text-sm flex items-center gap-1.5"><Filter className="h-3.5 w-3.5" /> Filter</button>
    {children}
  </div>
);

const Confidence = ({ score }: { score: number }) => {
  const tone = score >= 80 ? "success" : score >= 60 ? "warning" : "destructive";
  return <span className={`text-xs px-2 py-0.5 rounded-full bg-${tone}/15 text-${tone} font-medium`}>{score}%</span>;
};

/* ───────── Topic Discovery ───────── */
export const TopicDiscovery = () => (
  <AdminLayout>
    <Header title="Topic Discovery" sub="Trend opportunities surfaced by the research agents — sorted by potential traffic and difficulty." action="+ New topic" />
    <Toolbar />
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
      {[
        { topic: "Best winter treks December 2026", vol: "12.4K", diff: "Low", trend: "+38%", conf: 92, cluster: "Seasonal · Winter" },
        { topic: "Hampta Pass vs Bhrigu Lake", vol: "3.2K", diff: "Med", trend: "+22%", conf: 88, cluster: "Comparison · Himachal" },
        { topic: "Treks near Pune in monsoon", vol: "8.9K", diff: "Low", trend: "+54%", conf: 84, cluster: "Regional · Sahyadri" },
        { topic: "Kashmir Great Lakes cost 2026", vol: "5.1K", diff: "Med", trend: "+12%", conf: 79, cluster: "Cost · Kashmir" },
        { topic: "Beginner snow treks January", vol: "6.7K", diff: "Low", trend: "+44%", conf: 91, cluster: "Beginner · Winter" },
        { topic: "Permit guide Sandakphu 2026", vol: "2.8K", diff: "Low", trend: "+8%", conf: 76, cluster: "Permit · Sikkim" },
      ].map(t => (
        <div key={t.topic} className="p-5 bg-card border border-border rounded-xl hover:shadow-md transition-shadow">
          <div className="flex items-start justify-between mb-3">
            <Confidence score={t.conf} />
            <span className="text-xs text-success flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {t.trend}</span>
          </div>
          <div className="font-display text-lg font-semibold leading-tight mb-2">{t.topic}</div>
          <div className="text-xs text-muted-foreground mb-4">{t.cluster}</div>
          <div className="grid grid-cols-2 gap-2 text-xs mb-4">
            <div className="p-2 bg-surface-muted rounded"><div className="text-muted-foreground">Volume</div><div className="font-semibold mt-0.5">{t.vol}/mo</div></div>
            <div className="p-2 bg-surface-muted rounded"><div className="text-muted-foreground">Difficulty</div><div className="font-semibold mt-0.5">{t.diff}</div></div>
          </div>
          <button className="w-full h-9 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/15">Promote to brief →</button>
        </div>
      ))}
    </div>
  </AdminLayout>
);

/* ───────── Keyword Clusters ───────── */
export const KeywordClusters = () => (
  <AdminLayout>
    <Header title="Keyword Clusters" sub="Topic map and cannibalization view across the content graph." />
    <Toolbar />
    <div className="space-y-3">
      {[
        { name: "Himachal · Multi-day", kws: 47, pages: 12, gaps: 8, health: "good" },
        { name: "Sahyadri · Monsoon", kws: 31, pages: 9, gaps: 4, health: "good" },
        { name: "Comparison · Beginner Himalayan", kws: 18, pages: 3, gaps: 11, health: "warn" },
        { name: "Permit guides · Uttarakhand", kws: 22, pages: 6, gaps: 2, health: "good" },
        { name: "Cost guides · Premium tier", kws: 14, pages: 2, gaps: 9, health: "warn" },
        { name: "Gear · Sleeping bags", kws: 26, pages: 1, gaps: 14, health: "danger" },
      ].map(c => (
        <div key={c.name} className="p-5 bg-card border border-border rounded-xl flex items-center gap-5">
          <Brain className="h-8 w-8 text-accent flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-display text-lg font-semibold">{c.name}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{c.kws} keywords · {c.pages} pages indexed</div>
          </div>
          <div className="hidden md:flex gap-6 text-sm">
            <div><div className="text-xs text-muted-foreground">Gaps</div><div className="font-semibold">{c.gaps}</div></div>
            <div><div className="text-xs text-muted-foreground">Cannibal risk</div><div className={`font-semibold text-${c.health === 'good' ? 'success' : c.health === 'warn' ? 'warning' : 'destructive'}`}>{c.health === 'good' ? 'Low' : c.health === 'warn' ? 'Medium' : 'High'}</div></div>
          </div>
          <button className="h-9 px-4 rounded-lg border border-border text-sm">Open</button>
        </div>
      ))}
    </div>
  </AdminLayout>
);

/* ───────── Brief Review ───────── */
export const BriefReview = () => (
  <AdminLayout>
    <Header title="Brief Review" sub="Inspect structured content briefs before they enter draft generation." />
    <div className="grid lg:grid-cols-[1fr_2fr] gap-6">
      <div className="space-y-2">
        {["Best treks in May 2026","Hampta Pass packing refresh","Brahmatal vs Kedarkantha","Karnataka monsoon roundup","Kashmir Great Lakes cost"].map((t, i) => (
          <div key={t} className={`p-4 rounded-xl border cursor-pointer ${i === 0 ? 'bg-card border-accent' : 'bg-card border-border hover:border-accent/50'}`}>
            <div className="text-sm font-medium leading-tight">{t}</div>
            <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
              <span>Brief v2 · 8 sections</span>
              <Confidence score={86 - i * 5} />
            </div>
          </div>
        ))}
      </div>
      <div className="p-6 bg-card border border-border rounded-xl">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="text-xs uppercase tracking-widest text-accent mb-1">Brief · v2</div>
            <h2 className="font-display text-2xl font-semibold">Best treks in May 2026</h2>
            <div className="text-xs text-muted-foreground mt-1">Generated 4h ago · Pillar: Seasonal · Target: 2,400 words</div>
          </div>
          <div className="flex gap-2">
            <button className="h-9 px-3 rounded-lg border border-border text-sm">Reject</button>
            <button className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Approve → Draft</button>
          </div>
        </div>
        <div className="space-y-4">
          {[
            { h: "H2 · Why May is the sweet spot", body: "Snow recedes from Himalayan trails, valleys bloom, weather stable. Internal links to /seasons/summer." },
            { h: "H2 · 8 best treks by region", body: "Himachal (Bhrigu Lake, Hampta), Uttarakhand (Valley of Flowers prep, Kuari Pass), Kashmir (Great Lakes prep)." },
            { h: "H2 · Beginner picks", body: "Bhrigu Lake, Dayara Bugyal — link to /beginner." },
            { h: "H2 · What to pack for May treks", body: "Layering is still critical. Link to /packing." },
          ].map(s => (
            <div key={s.h} className="p-4 bg-surface-muted rounded-lg">
              <div className="font-medium text-sm mb-1">{s.h}</div>
              <div className="text-sm text-muted-foreground">{s.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </AdminLayout>
);

/* ───────── Draft Review ───────── */
export const DraftReview = () => (
  <AdminLayout>
    <Header title="Draft Review" sub="AI-generated drafts with confidence scores. Inspect, edit, or send to fact-check." />
    <div className="grid lg:grid-cols-[1fr_2fr] gap-6">
      <div className="space-y-2">
        {[
          { t: "Hampta Pass packing refresh", c: 92, w: "Sneha" },
          { t: "Brahmatal vs Kedarkantha", c: 78, w: "Aarav" },
          { t: "Karnataka monsoon roundup", c: 84, w: "Sneha" },
          { t: "Kashmir Great Lakes cost", c: 65, w: "Vikram" },
        ].map((d, i) => (
          <div key={d.t} className={`p-4 rounded-xl border cursor-pointer ${i === 1 ? 'bg-card border-accent' : 'bg-card border-border hover:border-accent/50'}`}>
            <div className="text-sm font-medium leading-tight mb-2">{d.t}</div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Reviewer: {d.w}</span>
              <Confidence score={d.c} />
            </div>
          </div>
        ))}
      </div>
      <div className="p-6 bg-card border border-border rounded-xl">
        <div className="flex items-start justify-between mb-5">
          <div>
            <div className="text-xs uppercase tracking-widest text-accent mb-1">Draft v3 · Confidence 78%</div>
            <h2 className="font-display text-2xl font-semibold">Brahmatal vs Kedarkantha — which is right for you?</h2>
          </div>
          <div className="flex gap-2">
            <button className="h-9 px-3 rounded-lg border border-border text-sm">Send back</button>
            <button className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Send to fact-check</button>
          </div>
        </div>
        <div className="prose prose-sm max-w-none mb-5">
          <p className="text-foreground/85 leading-relaxed">Both Brahmatal and Kedarkantha sit in the Garhwal Himalayas at around 3,800–3,810m. They're often pitched as the "first Himalayan snow trek" — and rightly so. But the experience diverges fast once you're on the trail.</p>
          <p className="text-foreground/85 leading-relaxed">Kedarkantha is the more popular of the two, with a wider trail, more operators, and a slightly easier summit push…</p>
        </div>
        <div className="p-4 bg-warning/10 border border-warning/30 rounded-lg flex items-start gap-3">
          <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <div className="font-medium mb-1">3 claims need fact-check</div>
            <div className="text-muted-foreground text-xs">Altitude figures, operator counts, and the "first Himalayan snow trek" framing flagged.</div>
          </div>
        </div>
      </div>
    </div>
  </AdminLayout>
);

/* ───────── Fact Check ───────── */
export const FactCheck = () => (
  <AdminLayout>
    <Header title="Fact-Check Review" sub="Flagged claims and the evidence the system found. Verify, correct, or escalate." />
    <Toolbar />
    <div className="space-y-4">
      {[
        { claim: "Kedarkantha summit is 3,810m", page: "Brahmatal vs Kedarkantha", sources: 3, conf: 88, status: "verified" },
        { claim: "Hampta Pass permits cost ₹500 per person", page: "Hampta Pass packing refresh", sources: 1, conf: 42, status: "low" },
        { claim: "Valley of Flowers opens June 1", page: "VoF guide", sources: 4, conf: 95, status: "verified" },
        { claim: "60+ operators run Kedarkantha each season", page: "Brahmatal vs Kedarkantha", sources: 0, conf: 28, status: "danger" },
      ].map(f => (
        <div key={f.claim} className="p-5 bg-card border border-border rounded-xl">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <div className="text-xs uppercase tracking-widest text-muted-foreground mb-1">{f.page}</div>
              <div className="font-medium">"{f.claim}"</div>
            </div>
            <Confidence score={f.conf} />
          </div>
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground flex items-center gap-3">
              <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> {f.sources} source{f.sources !== 1 && 's'} found</span>
              <span className={`px-2 py-0.5 rounded-full bg-${f.status === 'verified' ? 'success' : f.status === 'low' ? 'warning' : 'destructive'}/15 text-${f.status === 'verified' ? 'success' : f.status === 'low' ? 'warning' : 'destructive'}`}>
                {f.status === 'verified' ? 'Verified' : f.status === 'low' ? 'Low confidence' : 'Needs human'}
              </span>
            </div>
            <div className="flex gap-2">
              <button className="h-8 px-3 rounded-lg border border-border text-xs">Evidence</button>
              <button className="h-8 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium">Approve</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </AdminLayout>
);

/* ───────── Internal Linking ───────── */
export const InternalLinking = () => (
  <AdminLayout>
    <Header title="Internal Linking" sub="Suggested links from new content to existing pages, plus orphan content alerts." />
    <div className="grid lg:grid-cols-3 gap-5 mb-6">
      {[["247", "Total recommendations"],["18", "Orphan pages"],["94%", "Coverage"]].map(([v, l]) => (
        <div key={l} className="p-5 bg-card border border-border rounded-xl">
          <div className="font-display text-3xl font-semibold">{v}</div>
          <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{l}</div>
        </div>
      ))}
    </div>
    <h3 className="font-display text-xl font-semibold mb-4">Pending recommendations</h3>
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {[
        { from: "Hampta Pass guide", anchor: "monsoon trekking gear", to: "/gear/monsoon", score: 94 },
        { from: "Brahmatal guide", anchor: "Kedarkantha alternative", to: "/trek/kedarkantha", score: 91 },
        { from: "Best winter treks", anchor: "snow trek packing list", to: "/packing", score: 88 },
        { from: "Plan My Trek page", anchor: "Himachal regional guide", to: "/regions/himachal", score: 82 },
        { from: "Gear · sleeping bags", anchor: "high-altitude trek prep", to: "/safety", score: 78 },
      ].map((r, i) => (
        <div key={i} className="p-4 border-b border-border last:border-0 flex items-center gap-4 hover:bg-muted">
          <Link2 className="h-4 w-4 text-accent flex-shrink-0" />
          <div className="flex-1 min-w-0 text-sm">
            <span className="font-medium">{r.from}</span>
            <span className="text-muted-foreground"> → "{r.anchor}" → </span>
            <span className="text-accent">{r.to}</span>
          </div>
          <Confidence score={r.score} />
          <button className="h-8 px-3 rounded-lg bg-primary/10 text-primary text-xs font-medium">Apply</button>
        </div>
      ))}
    </div>
  </AdminLayout>
);

/* ───────── Monetization ───────── */
export const Monetization = () => (
  <AdminLayout>
    <Header title="Monetization" sub="Revenue performance by page type, content cluster, and channel." />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {[
        { l: "Revenue MTD", v: "₹2.4L", t: "+22%", up: true },
        { l: "Affiliate clicks", v: "8,431", t: "+18%", up: true },
        { l: "Lead conversions", v: "127", t: "+9%", up: true },
        { l: "Product orders", v: "84", t: "-4%", up: false },
      ].map(k => (
        <div key={k.l} className="p-5 bg-card border border-border rounded-xl">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{k.l}</div>
          <div className="font-display text-3xl font-semibold mt-2">{k.v}</div>
          <div className={`text-xs mt-1 flex items-center gap-1 ${k.up ? 'text-success' : 'text-destructive'}`}>
            {k.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />} {k.t} vs last month
          </div>
        </div>
      ))}
    </div>
    <div className="grid lg:grid-cols-2 gap-5">
      <div className="p-6 bg-card border border-border rounded-xl">
        <h3 className="font-display text-lg font-semibold mb-4">Revenue by page type</h3>
        <div className="space-y-3">
          {[["Trek detail","₹98K",62],["Gear reviews","₹54K",34],["Comparison","₹42K",27],["Packing","₹28K",18],["Cost guides","₹18K",12]].map(([n,v,p]) => (
            <div key={n as string}>
              <div className="flex justify-between text-sm mb-1"><span>{n}</span><span className="font-semibold">{v}</span></div>
              <div className="h-2 bg-surface-muted rounded-full overflow-hidden"><div className="h-full bg-gradient-saffron" style={{ width: `${p}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-6 bg-card border border-border rounded-xl">
        <h3 className="font-display text-lg font-semibold mb-4">Top earning content</h3>
        <div className="space-y-3">
          {[["Hampta Pass complete guide","₹18.4K"],["Best winter treks roundup","₹14.2K"],["Sleeping bag review","₹11.8K"],["Kedarkantha vs Brahmatal","₹9.7K"],["Beginner gear essentials","₹8.1K"]].map(([t, v]) => (
            <div key={t as string} className="flex items-center justify-between p-3 hover:bg-muted rounded-lg">
              <div className="text-sm font-medium">{t}</div>
              <div className="text-sm font-semibold text-accent">{v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </AdminLayout>
);

/* ───────── Analytics ───────── */
export const Analytics = () => (
  <AdminLayout>
    <Header title="Analytics" sub="Traffic, ranking movement, leads, freshness — across the content graph." action="Export CSV" />
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {[["1.24M","Sessions / 30d","+18%"],["3:42","Avg time on page","+8%"],["42%","Returning visitors","+3%"],["86","Pages stale > 90d","-12%"]].map(([v,l,t]) => (
        <div key={l} className="p-5 bg-card border border-border rounded-xl">
          <div className="text-xs uppercase tracking-widest text-muted-foreground">{l}</div>
          <div className="font-display text-3xl font-semibold mt-2">{v}</div>
          <div className="text-xs text-success mt-1">{t}</div>
        </div>
      ))}
    </div>
    <div className="p-6 bg-card border border-border rounded-xl mb-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-display text-lg font-semibold">Sessions trend</h3>
        <div className="flex gap-1.5 text-xs">
          {["7d","30d","90d","12m"].map((p, i) => <button key={p} className={`px-3 py-1 rounded-md ${i === 1 ? 'bg-primary text-primary-foreground' : 'bg-surface-muted'}`}>{p}</button>)}
        </div>
      </div>
      <div className="h-48 flex items-end gap-1.5">
        {[42,38,52,48,61,58,72,68,84,79,92,88,96,91,103,99,112,108,121,118,128,124,134,131,142,138,148,144,156,151].map((h, i) => (
          <div key={i} className="flex-1 bg-gradient-to-t from-primary/70 to-accent rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
    <div className="grid lg:grid-cols-2 gap-5">
      <div className="p-6 bg-card border border-border rounded-xl">
        <h3 className="font-display text-lg font-semibold mb-4">Top pages this week</h3>
        <div className="space-y-2 text-sm">
          {[["/trek/hampta-pass","48.2K","↑3"],["/explore","38.4K","↑1"],["/regions/himachal","31.7K","↑5"],["/seasons/winter","28.9K","↓2"],["/compare","21.3K","↑8"]].map(([p,s,r]) => (
            <div key={p as string} className="flex items-center justify-between p-2 hover:bg-muted rounded-lg">
              <span className="font-mono text-xs">{p}</span>
              <div className="flex gap-3 items-center">
                <span>{s}</span>
                <span className="text-xs text-success">{r}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="p-6 bg-card border border-border rounded-xl">
        <h3 className="font-display text-lg font-semibold mb-4">Ranking movement</h3>
        <div className="space-y-2 text-sm">
          {[["best winter treks india","#3","↑5"],["hampta pass guide","#1","→"],["kedarkantha vs brahmatal","#2","↑7"],["monsoon treks maharashtra","#4","↑12"],["valley of flowers permit","#6","↓2"]].map(([k,r,m]) => (
            <div key={k as string} className="flex items-center justify-between p-2 hover:bg-muted rounded-lg">
              <span className="text-xs">{k}</span>
              <div className="flex gap-3 items-center">
                <span className="font-semibold">{r}</span>
                <span className={`text-xs ${(m as string).includes('↑') ? 'text-success' : (m as string).includes('↓') ? 'text-destructive' : 'text-muted-foreground'}`}>{m}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  </AdminLayout>
);

/* ───────── Agent Logs ───────── */
export const AgentLogs = () => (
  <AdminLayout>
    <Header title="Agent Logs" sub="Workflow traceability across all autonomous agents in the orchestration layer." />
    <Toolbar />
    <div className="bg-card border border-border rounded-xl overflow-hidden font-mono text-xs">
      {[
        { t: "14:42:08", agent: "topic-agent", ev: "Discovered 12 new opportunities (cluster: winter)", lvl: "info" },
        { t: "14:38:51", agent: "brief-agent", ev: "Generated brief v2 for 'Best treks in May 2026' · conf 86%", lvl: "info" },
        { t: "14:31:12", agent: "draft-agent", ev: "Draft v3 produced for 'Brahmatal vs Kedarkantha' · 2,431 words", lvl: "info" },
        { t: "14:28:44", agent: "fact-check", ev: "3 claims flagged below 70% confidence threshold", lvl: "warn" },
        { t: "14:21:09", agent: "linking-agent", ev: "Applied 14 internal link recommendations", lvl: "info" },
        { t: "14:18:33", agent: "freshness-agent", ev: "5 pages marked stale (>90 days)", lvl: "warn" },
        { t: "14:12:56", agent: "draft-agent", ev: "Retry 2/3 for 'Karnataka monsoon roundup' — rate limit", lvl: "error" },
        { t: "14:08:01", agent: "publish-agent", ev: "Pushed 3 posts to WordPress · IDs 4821-4823", lvl: "info" },
      ].map((l, i) => (
        <div key={i} className="px-4 py-2.5 border-b border-border last:border-0 flex items-start gap-4 hover:bg-muted">
          <span className="text-muted-foreground">{l.t}</span>
          <span className={`px-2 py-0.5 rounded uppercase text-[10px] tracking-wider ${l.lvl === 'info' ? 'bg-accent/15 text-accent' : l.lvl === 'warn' ? 'bg-warning/15 text-warning' : 'bg-destructive/15 text-destructive'}`}>{l.lvl}</span>
          <span className="text-muted-foreground min-w-[120px]">{l.agent}</span>
          <span className="flex-1">{l.ev}</span>
        </div>
      ))}
    </div>
  </AdminLayout>
);

/* ───────── Settings ───────── */
export const AdminSettings = () => (
  <AdminLayout>
    <Header title="Settings & Integrations" sub="Proprietary system integrations only. WordPress CMS settings live in WordPress." />
    <div className="grid md:grid-cols-2 gap-5">
      {[
        { name: "WordPress API", desc: "Headless CMS publishing endpoint", status: "Connected", icon: Plug },
        { name: "Search Console", desc: "Ranking + impressions sync", status: "Connected", icon: Plug },
        { name: "GA4 stream", desc: "Sessions, conversions, events", status: "Connected", icon: Plug },
        { name: "OpenAI API", desc: "Draft + brief generation", status: "Connected", icon: Sparkles },
        { name: "Affiliate aggregator", desc: "Click + revenue tracking", status: "Connected", icon: DollarSign },
        { name: "Slack alerts", desc: "Workflow + freshness alerts", status: "Disconnected", icon: Plug },
      ].map(s => (
        <div key={s.name} className="p-5 bg-card border border-border rounded-xl">
          <div className="flex items-start justify-between mb-3">
            <s.icon className="h-6 w-6 text-accent" />
            <span className={`text-xs px-2 py-0.5 rounded-full ${s.status === 'Connected' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>{s.status}</span>
          </div>
          <div className="font-display text-lg font-semibold mb-1">{s.name}</div>
          <div className="text-xs text-muted-foreground mb-4">{s.desc}</div>
          <button className="h-9 w-full rounded-lg border border-border text-sm">Configure</button>
        </div>
      ))}
    </div>
  </AdminLayout>
);
