import { BarChart2, TrendingUp, Eye, Clock, MousePointerClick } from "lucide-react";

const TOP_PAGES = [
  { page: "/trek/kedarkantha-winter-trek", views: 18400, avg_time: "5m 12s", ctr: 3.2 },
  { page: "/packing", views: 9200, avg_time: "3m 48s", ctr: 6.1 },
  { page: "/trek/valley-of-flowers", views: 8100, avg_time: "4m 30s", ctr: 2.8 },
  { page: "/compare", views: 6800, avg_time: "6m 02s", ctr: 4.5 },
  { page: "/regions/uttarakhand", views: 5400, avg_time: "2m 55s", ctr: 1.9 },
];

const METRICS = [
  { label: "Total pageviews", value: "84,200", icon: Eye, delta: "+18%" },
  { label: "Avg. session time", value: "4m 06s", icon: Clock, delta: "+0:22" },
  { label: "Organic CTR", value: "3.4%", icon: MousePointerClick, delta: "+0.6pp" },
  { label: "Avg. position", value: "4.2", icon: TrendingUp, delta: "↑1.1" },
];

export default function Analytics() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-white mb-1">Analytics</h1>
        <p className="text-white/50 text-sm">Search Console and GA4 performance overview.</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {METRICS.map(m => (
          <div key={m.label} className="bg-white/5 rounded-2xl border border-white/8 p-5">
            <m.icon className="h-4 w-4 text-accent mb-3" />
            <p className="text-white font-display text-2xl font-semibold">{m.value}</p>
            <p className="text-white/40 text-xs mt-0.5">{m.label}</p>
            <p className="text-pine text-xs mt-1 font-medium">{m.delta}</p>
          </div>
        ))}
      </div>

      {/* Sparkline placeholder */}
      <div className="bg-white/5 rounded-2xl border border-white/8 p-5 mb-6">
        <p className="text-white/40 text-xs mb-4">Pageviews — last 30 days</p>
        <div className="flex items-end gap-1 h-20">
          {[40, 55, 48, 62, 58, 70, 65, 80, 75, 88, 72, 90, 85, 95, 88, 100, 92, 98, 85, 110, 105, 120, 112, 130, 118, 140, 135, 150, 142, 160].map((h, i) => (
            <div key={i} className="flex-1 bg-accent/60 rounded-sm" style={{ height: `${h / 1.6}%` }} />
          ))}
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/8 overflow-hidden">
        <div className="px-5 py-4 border-b border-white/8">
          <h2 className="text-white font-semibold text-sm">Top Pages</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              {["Page", "Views", "Avg. time", "CTR"].map(h => (
                <th key={h} className="text-left px-5 py-3 text-white/40 font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TOP_PAGES.map(p => (
              <tr key={p.page} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                <td className="px-5 py-4 text-accent font-mono text-xs">{p.page}</td>
                <td className="px-5 py-4 text-white/70">{p.views.toLocaleString()}</td>
                <td className="px-5 py-4 text-white/50">{p.avg_time}</td>
                <td className="px-5 py-4 text-white/50">{p.ctr}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
