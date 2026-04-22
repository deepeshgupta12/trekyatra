import { CheckSquare, AlertTriangle, CheckCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const CLAIMS = [
  {
    article: "Kedarkantha Winter Trek Complete Guide",
    claim: "Kedarkantha summit is at 12,500 feet (3,810 m)",
    verdict: "verified",
    source: "Survey of India, 2022",
    confidence: 97,
  },
  {
    article: "Hampta Pass Itinerary — 5 Days",
    claim: "Hampta Pass altitude is 14,100 feet",
    verdict: "flagged",
    source: "Multiple sources conflict (14,038–14,100 ft)",
    confidence: 61,
  },
  {
    article: "Best Monsoon Treks in Maharashtra",
    claim: "Harishchandragad fort is 1,422 m above sea level",
    verdict: "verified",
    source: "Maharashtra Tourism, 2023",
    confidence: 94,
  },
  {
    article: "Hampta Pass Itinerary — 5 Days",
    claim: "The trek is best done in July–September",
    verdict: "pending",
    source: null,
    confidence: null,
  },
];

const verdictConfig = {
  verified: { icon: CheckCircle, color: "text-pine", bg: "bg-pine/10", label: "Verified" },
  flagged: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-400/10", label: "Flagged" },
  pending: { icon: CheckSquare, color: "text-white/40", bg: "bg-white/5", label: "Pending" },
};

export default function FactCheck() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-white mb-1">Fact Check</h1>
        <p className="text-white/50 text-sm">AI-verified claims from published and pending drafts.</p>
      </div>

      <div className="space-y-3">
        {CLAIMS.map((c, i) => {
          const { icon: Icon, color, bg, label } = verdictConfig[c.verdict as keyof typeof verdictConfig];
          return (
            <div key={i} className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
              <div className="flex items-start justify-between gap-4 mb-2">
                <p className="text-white font-medium">&#8220;{c.claim}&#8221;</p>
                <span className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${color} ${bg}`}>
                  <Icon className="h-3 w-3" /> {label}
                </span>
              </div>
              <p className="text-white/40 text-xs mb-3">Article: {c.article}</p>
              {c.source && (
                <p className="text-white/50 text-xs">Source: <span className="text-white/70">{c.source}</span></p>
              )}
              {c.confidence !== null && (
                <div className="flex items-center gap-2 mt-3">
                  <div className="h-1 w-24 rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-accent/70" style={{ width: `${c.confidence}%` }} />
                  </div>
                  <span className="text-white/40 text-xs">{c.confidence}% confidence</span>
                </div>
              )}
              {c.verdict === "flagged" && (
                <div className="flex gap-2 mt-4 pt-3 border-t border-white/8">
                  <Button variant="outline" size="sm" className="border-white/20 text-white/60 hover:text-white text-xs">Override &amp; verify</Button>
                  <Button variant="outline" size="sm" className="border-white/20 text-white/60 hover:text-white text-xs">Flag for editor</Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
