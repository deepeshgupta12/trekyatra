import { CheckSquare, Eye, Edit, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const DRAFTS = [
  {
    title: "Hampta Pass Itinerary — 5 Days",
    words: 3100,
    readability: 68,
    seo_score: 82,
    issues: 2,
    status: "needs-review",
  },
  {
    title: "Best Monsoon Treks in Maharashtra",
    words: 2400,
    readability: 72,
    seo_score: 75,
    issues: 5,
    status: "needs-review",
  },
  {
    title: "Kedarkantha Winter Trek Complete Guide",
    words: 3800,
    readability: 78,
    seo_score: 91,
    issues: 0,
    status: "approved",
  },
];

const statusStyle: Record<string, string> = {
  "needs-review": "text-amber-400 bg-amber-400/10",
  approved: "text-pine bg-pine/10",
};

export default function DraftReview() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl font-semibold text-white mb-1">Draft Review</h1>
        <p className="text-white/50 text-sm">AI-written drafts ready for editorial review.</p>
      </div>

      <div className="space-y-4">
        {DRAFTS.map(d => (
          <div key={d.title} className="bg-white/5 rounded-2xl border border-white/8 p-5">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h3 className="text-white font-semibold">{d.title}</h3>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${statusStyle[d.status]}`}>
                {d.status === "approved" ? "Approved" : "Needs review"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <p className="text-white/40 text-xs mb-1">Words</p>
                <p className="text-white font-semibold">{d.words.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-white/40 text-xs mb-1">Readability</p>
                <p className="text-white font-semibold">{d.readability}/100</p>
              </div>
              <div>
                <p className="text-white/40 text-xs mb-1">SEO Score</p>
                <p className="text-accent font-semibold">{d.seo_score}/100</p>
              </div>
            </div>
            {d.issues > 0 && (
              <div className="flex items-center gap-2 text-amber-400 text-xs mb-4">
                <AlertCircle className="h-3.5 w-3.5" /> {d.issues} issue{d.issues > 1 ? "s" : ""} flagged
              </div>
            )}
            <div className="flex items-center gap-3 pt-3 border-t border-white/8">
              <Button variant="outline" size="sm" className="border-white/20 text-white/60 hover:text-white">
                <Eye className="h-3.5 w-3.5" /> Preview
              </Button>
              <Button variant="outline" size="sm" className="border-white/20 text-white/60 hover:text-white">
                <Edit className="h-3.5 w-3.5" /> Edit
              </Button>
              {d.status !== "approved" && (
                <Button variant="hero" size="sm" className="ml-auto">Approve</Button>
              )}
              {d.status === "approved" && (
                <Button variant="hero" size="sm" className="ml-auto">Publish</Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
