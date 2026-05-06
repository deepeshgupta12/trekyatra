"use client";

import { Star } from "lucide-react";
import type { OperatorReview } from "@/lib/api";

interface Props {
  reviews: OperatorReview[];
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`h-3.5 w-3.5 ${n <= rating ? "text-amber-400 fill-amber-400" : "text-white/20"}`}
        />
      ))}
    </div>
  );
}

export default function OperatorReviewList({ reviews }: Props) {
  if (reviews.length === 0) {
    return (
      <p className="text-white/40 text-sm py-4">No reviews yet. Be the first to review.</p>
    );
  }
  return (
    <div className="space-y-4">
      {reviews.map((r) => (
        <div key={r.id} className="bg-[#14161f] rounded-xl border border-white/10 p-4">
          <div className="flex items-center justify-between mb-2">
            <StarDisplay rating={r.rating} />
            <span className="text-xs text-white/30">
              {new Date(r.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
          {r.body && <p className="text-sm text-white/70">{r.body}</p>}
        </div>
      ))}
    </div>
  );
}
