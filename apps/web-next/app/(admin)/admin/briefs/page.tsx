import { FileText, Clock, CheckCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const BRIEFS = [
  {
    title: "Roopkund Trek: Complete Guide 2025",
    cluster: "High Altitude Treks",
    target_kw: "roopkund trek",
    word_count: 2800,
    status: "ready",
    created: "2 hours ago",
  },
  {
    title: "Chopta to Tungnath Day Trek",
    cluster: "Uttarakhand Treks",
    target_kw: "tungnath trek",
    word_count: 1800,
    status: "ready",
    created: "4 hours ago",
  },
  {
    title: "Monsoon Trekking Safety Tips",
    cluster: "Monsoon Trekking India",
    target_kw: "trekking in monsoon india",
    word_count: 2200,
    status: "generating",
    created: "10 min ago",
  },
];

const statusStyle: Record<string, string> = {
  ready: "text-pine bg-pine/10",
  generating: "text-blue-400 bg-blue-400/10",
};

export default function BriefReview() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-white mb-1">Brief Review</h1>
        <p className="text-white/50 text-sm">AI-generated content briefs awaiting approval.</p>
      </div>

      <div className="space-y-4">
        {BRIEFS.map(b => (
          <div key={b.title} className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h3 className="text-white font-semibold mb-1">{b.title}</h3>
                <div className="flex flex-wrap gap-3 text-xs text-white/40">
                  <span>Cluster: {b.cluster}</span>
                  <span>Target: <span className="text-white/60">{b.target_kw}</span></span>
                  <span>~{b.word_count.toLocaleString()} words</span>
                  <span>Created {b.created}</span>
                </div>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${statusStyle[b.status]}`}>
                {b.status === "ready" ? "Ready" : "Generating…"}
              </span>
            </div>
            {b.status === "ready" && (
              <div className="flex items-center gap-3 pt-3 border-t border-white/8">
                <Button variant="hero" size="sm">Approve &amp; draft <ArrowRight className="h-3.5 w-3.5" /></Button>
                <Button variant="outline" size="sm" className="border-white/20 text-white/60 hover:text-white">Edit brief</Button>
                <Button variant="outline" size="sm" className="border-white/20 text-white/60 hover:text-white ml-auto">Reject</Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
