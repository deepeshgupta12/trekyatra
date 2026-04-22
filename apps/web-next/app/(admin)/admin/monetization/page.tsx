import { DollarSign, TrendingUp, ShoppingBag, ExternalLink } from "lucide-react";

const KPIs = [
  { label: "Affiliate revenue (MTD)", value: "₹1,42,000", delta: "+23%", positive: true },
  { label: "Product sales (MTD)", value: "₹28,500", delta: "+11%", positive: true },
  { label: "Avg. EPC", value: "₹4.20", delta: "-0.30", positive: false },
  { label: "Conversion rate", value: "2.8%", delta: "+0.4pp", positive: true },
];

const PRODUCTS = [
  { name: "Wildcraft Trailblazer Backpack", commission: "8%", clicks: 840, conversions: 22, revenue: "₹18,400", status: "active" },
  { name: "Quechua Forclaz Trek 900", commission: "6%", clicks: 620, conversions: 14, revenue: "₹11,200", status: "active" },
  { name: "Kedarkantha Premium PDF Guide", commission: "100%", clicks: 210, conversions: 31, revenue: "₹6,200", status: "active" },
  { name: "Himachal Permit Ebook Bundle", commission: "100%", clicks: 180, conversions: 25, revenue: "₹5,000", status: "paused" },
];

export default function Monetization() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-white mb-1">Monetization</h1>
        <p className="text-white/50 text-sm">Affiliate and product revenue overview.</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {KPIs.map(k => (
          <div key={k.label} className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
            <DollarSign className="h-4 w-4 text-amber-400 mb-3" />
            <p className="text-white font-display text-2xl font-semibold">{k.value}</p>
            <p className="text-white/40 text-xs mt-0.5">{k.label}</p>
            <p className={`text-xs mt-1 font-medium ${k.positive ? "text-pine" : "text-destructive"}`}>{k.delta}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/8">
          <h2 className="text-white font-semibold text-sm">Top Products</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              {["Product", "Commission", "Clicks", "Conversions", "Revenue", "Status"].map(h => (
                <th key={h} className="text-left px-5 py-3 text-white/40 font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PRODUCTS.map(p => (
              <tr key={p.name} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                <td className="px-5 py-4 text-white/80 font-medium">{p.name}</td>
                <td className="px-5 py-4 text-white/50">{p.commission}</td>
                <td className="px-5 py-4 text-white/50">{p.clicks}</td>
                <td className="px-5 py-4 text-white/50">{p.conversions}</td>
                <td className="px-5 py-4 text-accent font-medium">{p.revenue}</td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.status === "active" ? "text-pine bg-pine/10" : "text-white/30 bg-white/5"}`}>
                    {p.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
