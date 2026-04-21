import { Link2, ArrowRight, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const SUGGESTIONS = [
  {
    from_article: "Kedarkantha Winter Trek Complete Guide",
    anchor: "packing essentials",
    to_article: "Trek Packing Checklist — Complete Guide",
    to_url: "/packing",
    relevance: 94,
    applied: false,
  },
  {
    from_article: "Hampta Pass Itinerary",
    anchor: "Himachal Pradesh permit",
    to_article: "How to Get Trekking Permits in Himachal Pradesh",
    to_url: "/permits",
    relevance: 91,
    applied: false,
  },
  {
    from_article: "Valley of Flowers Trek Guide",
    anchor: "monsoon safety tips",
    to_article: "Trekking Safety in Monsoon — What to Know",
    to_url: "/safety",
    relevance: 87,
    applied: true,
  },
  {
    from_article: "Brahmatal Trek — Winter Guide",
    anchor: "compare with Kedarkantha",
    to_article: "Kedarkantha vs Brahmatal — Head-to-Head",
    to_url: "/compare",
    relevance: 96,
    applied: false,
  },
];

export default function InternalLinking() {
  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Internal Linking</h1>
          <p className="text-white/50 text-sm">AI-suggested contextual links across your content.</p>
        </div>
        <Button variant="outline" size="sm" className="border-white/20 text-white/60 hover:text-white">
          Apply all pending
        </Button>
      </div>

      <div className="space-y-3">
        {SUGGESTIONS.map((s, i) => (
          <div key={i} className={`bg-white/5 rounded-2xl border p-5 ${s.applied ? "border-white/5 opacity-50" : "border-white/8"}`}>
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="flex-1 min-w-0">
                <p className="text-white/40 text-xs mb-1 truncate">{s.from_article}</p>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-white text-sm font-medium">&#8220;{s.anchor}&#8221;</span>
                  <ArrowRight className="h-3.5 w-3.5 text-white/30" />
                  <span className="text-accent text-sm">{s.to_article}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-accent font-semibold text-sm">{s.relevance}%</p>
                <p className="text-white/30 text-xs">relevance</p>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-white/8">
              {s.applied ? (
                <span className="flex items-center gap-1.5 text-xs text-pine"><CheckCircle className="h-3.5 w-3.5" /> Applied</span>
              ) : (
                <>
                  <Button variant="hero" size="sm" className="text-xs">Apply link</Button>
                  <Button variant="outline" size="sm" className="border-white/20 text-white/60 hover:text-white text-xs">Dismiss</Button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
