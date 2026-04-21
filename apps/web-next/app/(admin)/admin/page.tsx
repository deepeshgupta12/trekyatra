import { TrendingUp, FileText, DollarSign, Eye, Clock, CheckCircle, AlertCircle } from "lucide-react";
import Link from "next/link";

const KPIs = [
  { label: "Published articles", value: "147", delta: "+12 this month", icon: FileText, color: "text-accent" },
  { label: "Monthly pageviews", value: "84.2K", delta: "+18% MoM", icon: Eye, color: "text-pine" },
  { label: "Affiliate revenue", value: "₹1.4L", delta: "+23% MoM", icon: DollarSign, color: "text-amber-400" },
  { label: "Avg. position", value: "4.2", delta: "↑ 1.1 positions", icon: TrendingUp, color: "text-blue-400" },
];

const QUEUE = [
  { title: "Roopkund Trek: Complete Guide 2025", stage: "Draft Review", status: "needs-review", author: "AI Agent" },
  { title: "Best Monsoon Treks in Maharashtra", stage: "Fact Check", status: "in-progress", author: "AI Agent" },
  { title: "Hampta Pass Itinerary — 5 Days", stage: "Published", status: "live", author: "AI Agent" },
  { title: "Chopta to Tungnath Day Trek", stage: "Brief", status: "pending", author: "AI Agent" },
];

const stageStyle: Record<string, string> = {
  "needs-review": "text-amber-400 bg-amber-400/10",
  "in-progress": "text-blue-400 bg-blue-400/10",
  "live": "text-pine bg-pine/10",
  "pending": "text-white/40 bg-white/5",
};

const stageIcon: Record<string, React.ElementType> = {
  "needs-review": AlertCircle,
  "in-progress": Clock,
  "live": CheckCircle,
  "pending": Clock,
};

export default function AdminDashboard() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-white mb-1">Dashboard</h1>
        <p className="text-white/50 text-sm">TrekYatra content pipeline overview.</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {KPIs.map(({ label, value, delta, icon: Icon, color }) => (
          <div key={label} className="bg-white/5 rounded-2xl border border-white/8 p-5">
            <div className={`${color} mb-3`}><Icon className="h-5 w-5" /></div>
            <p className="text-white font-display text-2xl font-semibold">{value}</p>
            <p className="text-white/50 text-xs mt-0.5">{label}</p>
            <p className="text-white/30 text-xs mt-1">{delta}</p>
          </div>
        ))}
      </div>

      {/* Publish queue */}
      <div className="bg-white/5 rounded-2xl border border-white/8 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h2 className="text-white font-semibold text-sm">Publish Queue</h2>
          <Link href="/admin/drafts" className="text-accent text-xs font-medium">View all →</Link>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              <th className="text-left px-5 py-3 text-white/40 font-medium text-xs">Title</th>
              <th className="text-left px-5 py-3 text-white/40 font-medium text-xs hidden md:table-cell">Stage</th>
              <th className="text-left px-5 py-3 text-white/40 font-medium text-xs">Status</th>
            </tr>
          </thead>
          <tbody>
            {QUEUE.map(item => {
              const Icon = stageIcon[item.status];
              return (
                <tr key={item.title} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                  <td className="px-5 py-4 text-white/80 font-medium">{item.title}</td>
                  <td className="px-5 py-4 text-white/40 hidden md:table-cell">{item.stage}</td>
                  <td className="px-5 py-4">
                    <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full w-fit ${stageStyle[item.status]}`}>
                      <Icon className="h-3 w-3" /> {item.stage}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
