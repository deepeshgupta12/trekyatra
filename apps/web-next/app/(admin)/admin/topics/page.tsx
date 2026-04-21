import { TrendingUp, Search, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const TOPICS = [
  { keyword: "kedarkantha winter trek 2025", volume: "12,400", difficulty: "Low", opportunity: 92, status: "uncovered" },
  { keyword: "hampta pass itinerary", volume: "8,900", difficulty: "Low", opportunity: 88, status: "in-progress" },
  { keyword: "uttarakhand trek permits", volume: "6,200", difficulty: "Medium", opportunity: 74, status: "uncovered" },
  { keyword: "valley of flowers best time", volume: "5,100", difficulty: "Medium", opportunity: 70, status: "covered" },
  { keyword: "brahmatal trek difficulty", volume: "4,800", difficulty: "Low", opportunity: 85, status: "uncovered" },
  { keyword: "monsoon trekking india", volume: "4,500", difficulty: "High", opportunity: 55, status: "covered" },
];

const statusStyle: Record<string, string> = {
  uncovered: "text-amber-400 bg-amber-400/10",
  "in-progress": "text-blue-400 bg-blue-400/10",
  covered: "text-white/30 bg-white/5",
};

export default function TopicDiscovery() {
  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Topic Discovery</h1>
          <p className="text-white/50 text-sm">High-opportunity keywords ready for content creation.</p>
        </div>
        <Button variant="hero" size="sm"><Search className="h-4 w-4" /> Refresh topics</Button>
      </div>

      <div className="bg-white/5 rounded-2xl border border-white/8 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/8">
              {["Keyword", "Volume", "Difficulty", "Opportunity", "Status", ""].map(h => (
                <th key={h} className="text-left px-5 py-3 text-white/40 font-medium text-xs">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TOPICS.map(t => (
              <tr key={t.keyword} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                <td className="px-5 py-4 text-white/80 font-medium">{t.keyword}</td>
                <td className="px-5 py-4 text-white/50">{t.volume}</td>
                <td className="px-5 py-4 text-white/50">{t.difficulty}</td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-16 rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-accent" style={{ width: `${t.opportunity}%` }} />
                    </div>
                    <span className="text-accent text-xs font-medium">{t.opportunity}</span>
                  </div>
                </td>
                <td className="px-5 py-4">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[t.status]}`}>{t.status}</span>
                </td>
                <td className="px-5 py-4">
                  {t.status === "uncovered" && (
                    <Button variant="outline" size="sm" className="border-white/20 text-white/60 hover:text-white hover:border-white/40 text-xs">
                      Create brief
                    </Button>
                  )}
                  {t.status !== "uncovered" && <ExternalLink className="h-4 w-4 text-white/20" />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
