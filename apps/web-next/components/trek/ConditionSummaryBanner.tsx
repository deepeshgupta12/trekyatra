"use client";

import type { ConditionSummary } from "@/lib/reports";

interface Props {
  summary: ConditionSummary;
}

const conditionColor: Record<string, string> = {
  open: "text-emerald-500",
  caution: "text-amber-500",
  closed: "text-red-500",
  unknown: "text-foreground/40",
};

export function ConditionSummaryBanner({ summary }: Props) {
  if (summary.total_reports === 0) {
    return (
      <p className="text-sm text-foreground/50 italic">
        No trail condition reports yet. Be the first to share your experience.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-foreground/10 bg-foreground/[0.03] px-5 py-4 mb-6">
      <div className="flex flex-wrap gap-4 items-center mb-2">
        {summary.open_pct > 0 && (
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className={conditionColor.open}>{summary.open_pct}% Open</span>
          </span>
        )}
        {summary.caution_pct > 0 && (
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            <span className={conditionColor.caution}>{summary.caution_pct}% Caution</span>
          </span>
        )}
        {summary.closed_pct > 0 && (
          <span className="flex items-center gap-1.5 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            <span className={conditionColor.closed}>{summary.closed_pct}% Closed</span>
          </span>
        )}
      </div>
      <p className="text-xs text-foreground/40">
        Based on {summary.total_reports} recent report{summary.total_reports !== 1 ? "s" : ""}
        {summary.last_report_date && ` · Last updated ${new Date(summary.last_report_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}`}
      </p>
    </div>
  );
}
