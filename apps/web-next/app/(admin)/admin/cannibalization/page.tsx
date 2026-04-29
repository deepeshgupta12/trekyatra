"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle, Filter, GitMerge, Loader2, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchCannibalizationIssues,
  detectCannibalization,
  resolveCannibalizationIssue,
  triggerConsolidationMerge,
  type CannibalizationIssue,
} from "@/lib/api";

const SEVERITY_STYLE: Record<string, string> = {
  high: "text-red-400 bg-red-400/10 border border-red-400/20",
  medium: "text-amber-400 bg-amber-400/10 border border-amber-400/20",
  low: "text-white/40 bg-white/5 border border-white/10",
};

const STATUS_STYLE: Record<string, string> = {
  open: "text-amber-400 bg-amber-400/10 border border-amber-400/20",
  accepted: "text-pine bg-pine/10 border border-pine/20",
  dismissed: "text-white/30 bg-white/5 border border-white/10",
  resolved: "text-pine bg-pine/10 border border-pine/20",
};

const REC_LABEL: Record<string, string> = {
  merge: "Merge pages",
  redirect: "Add canonical redirect",
  differentiate: "Differentiate content",
};

export default function CannibalizationPage() {
  const [issues, setIssues] = useState<CannibalizationIssue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detecting, setDetecting] = useState(false);
  const [detectResult, setDetectResult] = useState<{ issues_found: number; new_issues: number } | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("open");
  const [busyId, setBusyId] = useState<Record<string, string | null>>({});

  function load() {
    setLoading(true);
    setError(null);
    fetchCannibalizationIssues({
      severity: severityFilter || undefined,
      status: statusFilter || undefined,
      limit: 200,
    })
      .then(setIssues)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [severityFilter, statusFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleDetect() {
    setDetecting(true);
    setDetectResult(null);
    setError(null);
    try {
      const res = await detectCannibalization();
      setDetectResult(res);
      load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Detection failed.");
    } finally {
      setDetecting(false);
    }
  }

  async function handleResolve(id: string, status: "dismissed" | "resolved") {
    setBusyId((prev) => ({ ...prev, [id]: status }));
    try {
      const updated = await resolveCannibalizationIssue(id, status);
      setIssues((prev) => prev.map((i) => (i.id === id ? updated : i)));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to resolve issue.");
    } finally {
      setBusyId((prev) => ({ ...prev, [id]: null }));
    }
  }

  async function handleMerge(id: string) {
    setBusyId((prev) => ({ ...prev, [id]: "merging" }));
    setError(null);
    try {
      await triggerConsolidationMerge(id);
      setIssues((prev) =>
        prev.map((i) => (i.id === id ? { ...i, status: "accepted" as const } : i))
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Merge failed.");
    } finally {
      setBusyId((prev) => ({ ...prev, [id]: null }));
    }
  }

  const openCount = issues.filter((i) => i.status === "open").length;
  const highCount = issues.filter((i) => i.severity === "high").length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Cannibalization</h1>
          <p className="text-white/50 text-sm">
            Keyword overlap between published pages.
            {openCount > 0 && <span className="text-amber-400"> {openCount} open issues.</span>}
            {highCount > 0 && <span className="text-red-400"> {highCount} HIGH severity.</span>}
          </p>
        </div>
        <Button
          variant="hero"
          size="sm"
          className="w-fit"
          disabled={detecting}
          onClick={handleDetect}
        >
          {detecting ? (
            <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Scanning…</>
          ) : (
            <><RefreshCw className="h-3.5 w-3.5" /> Scan for overlap</>
          )}
        </Button>
      </div>

      {/* Detect result banner */}
      {detectResult && (
        <div className="mb-4 px-5 py-3 bg-pine/10 border border-pine/20 rounded-2xl text-pine text-sm">
          Scan complete — {detectResult.issues_found} overlapping pairs found,{" "}
          {detectResult.new_issues} new issues created.
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-4 px-5 py-3 bg-red-400/10 border border-red-400/20 rounded-2xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {/* Severity filter */}
        {(["", "high", "medium", "low"] as const).map((sev) => (
          <button
            key={sev || "all-sev"}
            onClick={() => setSeverityFilter(sev)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              severityFilter === sev
                ? "text-white border-white/40 bg-white/10"
                : "text-white/40 border-white/10 hover:border-white/20 hover:text-white/60"
            }`}
          >
            {sev ? sev.charAt(0).toUpperCase() + sev.slice(1) : "All severity"}
          </button>
        ))}
        <span className="w-px bg-white/10 mx-1" />
        {/* Status filter */}
        {(["open", "accepted", "dismissed", ""] as const).map((st) => (
          <button
            key={st || "all-status"}
            onClick={() => setStatusFilter(st)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              statusFilter === st
                ? "text-white border-white/40 bg-white/10"
                : "text-white/40 border-white/10 hover:border-white/20 hover:text-white/60"
            }`}
          >
            {st ? st.charAt(0).toUpperCase() + st.slice(1) : "All status"}
          </button>
        ))}
      </div>

      {/* States */}
      {loading && <div className="text-white/40 text-sm py-12 text-center">Loading issues…</div>}
      {!loading && !error && issues.length === 0 && (
        <div className="text-white/30 text-sm py-12 text-center">
          No cannibalization issues found. Click "Scan for overlap" to detect conflicts.
        </div>
      )}

      {/* Issue list */}
      <div className="space-y-3">
        {issues.map((issue) => {
          const busy = busyId[issue.id];
          return (
            <div
              key={issue.id}
              className="bg-[#14161f] rounded-2xl border border-white/10 p-5"
            >
              {/* Top row */}
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${SEVERITY_STYLE[issue.severity]}`}>
                      {issue.severity.toUpperCase()}
                    </span>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_STYLE[issue.status]}`}>
                      {issue.status}
                    </span>
                  </div>
                  <p className="text-white font-semibold text-sm">
                    {issue.page_a_title}
                    <span className="text-white/30 font-normal"> vs </span>
                    {issue.page_b_title}
                  </p>
                  <p className="text-white/40 text-xs mt-0.5">
                    /{issue.page_a_slug} · /{issue.page_b_slug}
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <span className="text-white/40 text-xs">
                    Recommendation: <span className="text-white/60">{REC_LABEL[issue.recommendation] ?? issue.recommendation}</span>
                  </span>
                </div>
              </div>

              {/* Shared keywords */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {issue.shared_keywords.map((kw) => (
                  <span
                    key={kw}
                    className="text-xs px-2 py-0.5 rounded-md bg-white/6 border border-white/8 text-white/50"
                  >
                    {kw}
                  </span>
                ))}
              </div>

              {/* Actions — only for open issues */}
              {issue.status === "open" && (
                <div className="flex flex-wrap gap-2 pt-3 border-t border-white/8">
                  {issue.recommendation === "merge" && (
                    <Button
                      variant="hero"
                      size="sm"
                      disabled={!!busy}
                      onClick={() => handleMerge(issue.id)}
                      className="text-xs gap-1.5"
                    >
                      {busy === "merging" ? (
                        <><Loader2 className="h-3 w-3 animate-spin" /> Merging…</>
                      ) : (
                        <><GitMerge className="h-3 w-3" /> Merge pages</>
                      )}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!!busy}
                    onClick={() => handleResolve(issue.id, "dismissed")}
                    className="border-white/20 text-white/60 hover:text-white text-xs gap-1.5"
                  >
                    {busy === "dismissed" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    Dismiss
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!!busy}
                    onClick={() => handleResolve(issue.id, "resolved")}
                    className="border-white/20 text-white/60 hover:text-pine hover:border-pine/40 text-xs gap-1.5"
                  >
                    {busy === "resolved" ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <CheckCircle className="h-3 w-3" />
                    )}
                    Mark resolved
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

