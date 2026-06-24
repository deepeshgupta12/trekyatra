"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchReports } from "@/lib/reports";
import type { ReportPageOut } from "@/lib/reports";
import { ConditionSummaryBanner } from "./ConditionSummaryBanner";
import { TripReportCard } from "./TripReportCard";
import { AddReportForm } from "./AddReportForm";

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
      // non-fatal — section just shows empty state
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [slug]);

  // Load on mount if no initial data
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
    // Reload page 1 after a short delay to reflect new report count
    setTimeout(() => void load(1), 500);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold leading-tight mb-1">
            Trail Conditions
          </h2>
          <p className="text-sm text-foreground/50">
            Crowdsourced reports from hikers who&apos;ve done this trek
          </p>
        </div>
        {data && data.condition_summary.total_reports > 0 && (
          <span className="text-sm text-foreground/40 hidden sm:block">
            {data.condition_summary.total_reports} report{data.condition_summary.total_reports !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-foreground/5 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && data && (
        <>
          <ConditionSummaryBanner summary={data.condition_summary} />

          {data.items.length === 0 && (
            <p className="text-sm text-foreground/40 py-4">
              No approved reports yet for this trek.
            </p>
          )}

          <div>
            {data.items.map((report) => (
              <TripReportCard key={report.id} report={report} />
            ))}
          </div>

          {data.has_more && (
            <button
              onClick={handleLoadMore}
              disabled={loadingMore}
              className="mt-4 text-sm text-accent hover:underline disabled:opacity-50"
            >
              {loadingMore ? "Loading…" : "Load more reports"}
            </button>
          )}
        </>
      )}

      {/* Add report CTA */}
      <div className="mt-8 pt-6 border-t border-foreground/8">
        {submitted && !showForm ? (
          <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-5 py-4 text-sm text-emerald-600 dark:text-emerald-400">
            ✓ Your report is under review. It will appear once approved (usually within 24h).
          </div>
        ) : showForm ? (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground">Add a trip report</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-sm text-foreground/40 hover:text-foreground"
              >
                Cancel
              </button>
            </div>
            <AddReportForm trekSlug={slug} onSuccess={handleSubmitSuccess} />
          </div>
        ) : user ? (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
          >
            <span className="w-6 h-6 rounded-full bg-accent/15 flex items-center justify-center text-accent font-bold text-base leading-none">+</span>
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
