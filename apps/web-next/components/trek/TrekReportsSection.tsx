"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchReports } from "@/lib/reports";
import type { ReportPageOut } from "@/lib/reports";
import { ConditionSummaryBanner } from "./ConditionSummaryBanner";
import { TripReportCard } from "./TripReportCard";
import { AddReportForm } from "./AddReportForm";
import { CloudSun, Plus } from "lucide-react";

interface Props {
  slug: string;
  initialData?: ReportPageOut;
}

export function TrekReportsSection({ slug, initialData }: Props) {
  const { user } = useAuth();
  const [data, setData] = useState<ReportPageOut | null>(initialData ?? null);
  const [loading, setLoading] = useState(!initialData);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const load = useCallback(async (p = 1) => {
    try {
      const result = await fetchReports(slug, p);
      setData((prev) =>
        p === 1
          ? result
          : prev
          ? { ...result, items: [...prev.items, ...result.items] }
          : result,
      );
      setPage(p);
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [slug]);

  useState(() => {
    if (!initialData) { void load(1); }
  });

  async function handleLoadMore() {
    setLoadingMore(true);
    await load(page + 1);
  }

  function handleSubmitSuccess() {
    setShowForm(false);
    setSubmitted(true);
    setTimeout(() => void load(1), 500);
  }

  const totalReports = data?.condition_summary.total_reports ?? 0;

  return (
    <div className="rounded-2xl border border-foreground/8 bg-foreground/[0.02] overflow-hidden">
      {/* Section header */}
      <div className="flex items-start justify-between px-6 py-5 border-b border-foreground/8">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-sky-500/10 flex items-center justify-center shrink-0">
            <CloudSun className="h-4 w-4 text-sky-500" />
          </div>
          <div>
            <h2 className="font-display text-xl font-semibold leading-tight">Trail Conditions</h2>
            <p className="text-sm text-foreground/50 mt-0.5">
              Crowdsourced reports from trekkers who&apos;ve done this route
            </p>
          </div>
        </div>
        {totalReports > 0 && (
          <span className="text-xs text-foreground/40 font-medium mt-1 hidden sm:block shrink-0">
            {totalReports} report{totalReports !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-4">
        {loading && (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-foreground/5 animate-pulse" />
            ))}
          </div>
        )}

        {!loading && data && (
          <>
            <ConditionSummaryBanner summary={data.condition_summary} />

            {data.items.length === 0 && !submitted && (
              <div className="rounded-xl border border-dashed border-foreground/15 py-8 px-5 text-center">
                <p className="text-sm font-medium text-foreground/50 mb-1">No trail reports yet</p>
                <p className="text-xs text-foreground/35">Be the first to share your experience on this trek.</p>
              </div>
            )}

            <div className="space-y-3">
              {data.items.map((report) => (
                <TripReportCard key={report.id} report={report} />
              ))}
            </div>

            {data.has_more && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="text-sm text-accent hover:underline disabled:opacity-50"
              >
                {loadingMore ? "Loading…" : "Load more reports"}
              </button>
            )}
          </>
        )}

        {/* Add report */}
        {submitted && !showForm ? (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-5 py-4 text-sm text-emerald-600 dark:text-emerald-400">
            ✓ Your report is under review. It will appear once approved (usually within 24h).
          </div>
        ) : showForm ? (
          <div className="rounded-xl border border-foreground/10 bg-background p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground text-sm">Add a trip report</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-xs text-foreground/40 hover:text-foreground"
              >
                Cancel
              </button>
            </div>
            <AddReportForm trekSlug={slug} onSuccess={handleSubmitSuccess} />
          </div>
        ) : user ? (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors group"
          >
            <span className="w-6 h-6 rounded-full bg-accent/10 group-hover:bg-accent/20 flex items-center justify-center transition-colors">
              <Plus className="h-3 w-3 text-accent" />
            </span>
            Add your report
          </button>
        ) : (
          <p className="text-sm text-foreground/50">
            <a href="/auth/sign-in" className="text-accent hover:underline">Sign in</a> to add a trip report
          </p>
        )}
      </div>
    </div>
  );
}
