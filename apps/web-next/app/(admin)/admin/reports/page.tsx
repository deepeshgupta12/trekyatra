"use client";

import { useState, useEffect, useCallback } from "react";
import { fetchModerationQueue, moderateReport } from "@/lib/reports";
import type { ReportOut } from "@/lib/reports";

const STATUS_TABS = ["pending", "approved", "rejected"] as const;
type StatusTab = (typeof STATUS_TABS)[number];

const conditionBadge: Record<string, string> = {
  open: "text-emerald-400 bg-emerald-400/10 border border-emerald-400/20",
  caution: "text-amber-400 bg-amber-400/10 border border-amber-400/20",
  closed: "text-red-400 bg-red-400/10 border border-red-400/20",
  unknown: "text-white/40 bg-white/5 border border-white/10",
};

const statusBadge: Record<string, string> = {
  pending: "text-amber-400 bg-amber-400/10 border border-amber-400/20",
  approved: "text-pine bg-pine/10 border border-pine/20",
  rejected: "text-red-400 bg-red-400/10 border border-red-400/20",
};

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState<StatusTab>("pending");
  const [reports, setReports] = useState<ReportOut[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionState, setActionState] = useState<Record<string, "loading" | "done" | null>>({});
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [showRejectInput, setShowRejectInput] = useState<Record<string, boolean>>({});

  const load = useCallback(async (status: StatusTab) => {
    setLoading(true);
    try {
      const data = await fetchModerationQueue(status, 1);
      setReports(data.items);
      setTotal(data.total);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(activeTab); }, [activeTab, load]);

  async function handleModerate(reportId: string, action: "approve" | "reject") {
    setActionState((s) => ({ ...s, [reportId]: "loading" }));
    try {
      await moderateReport(reportId, action, rejectReason[reportId]);
      setActionState((s) => ({ ...s, [reportId]: "done" }));
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      setTotal((t) => t - 1);
    } catch {
      setActionState((s) => ({ ...s, [reportId]: null }));
    }
  }

  const tabCounts: Record<StatusTab, number | null> = {
    pending: activeTab === "pending" ? total : null,
    approved: activeTab === "approved" ? total : null,
    rejected: activeTab === "rejected" ? total : null,
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Trip Reports</h1>
          <p className="text-white/50 text-sm">Moderate user-submitted trail condition reports.</p>
        </div>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mb-6 bg-white/5 rounded-xl p-1 w-fit">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize transition-colors ${
              activeTab === tab
                ? "bg-white/10 text-white"
                : "text-white/40 hover:text-white/70"
            }`}
          >
            {tab}
            {tabCounts[tab] !== null && (
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab ? "bg-accent/30 text-accent" : "bg-white/10 text-white/40"}`}>
                {tabCounts[tab]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Report list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 bg-[#14161f] rounded-2xl border border-white/10 animate-pulse" />
          ))}
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-[#14161f] rounded-2xl border border-white/10 p-8 text-center">
          <p className="text-white/40 text-sm">No {activeTab} reports.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reports.map((report) => (
            <div key={report.id} className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-white font-medium text-sm">{report.trek_slug}</span>
                <span className="text-white/30">·</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${conditionBadge[report.condition] ?? conditionBadge.unknown}`}>
                  {report.condition}
                </span>
                <span className="text-white/30">·</span>
                <span className="text-xs text-white/40">
                  {new Date(report.trek_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
                {report.media.length > 0 && (
                  <>
                    <span className="text-white/30">·</span>
                    <span className="text-xs text-white/40">{report.media.length} photo{report.media.length !== 1 ? "s" : ""}</span>
                  </>
                )}
                <span className={`ml-auto text-xs font-medium px-2 py-0.5 rounded-full capitalize ${statusBadge[report.status] ?? ""}`}>
                  {report.status}
                </span>
              </div>
              {report.title && (
                <p className="text-white/80 font-semibold text-sm mb-1">{report.title}</p>
              )}
              <p className="text-white/60 text-sm line-clamp-3">{report.body}</p>

              {/* Photos row */}
              {report.media.length > 0 && (
                <div className="flex gap-2 mt-3">
                  {report.media.map((m) => (
                    <a key={m.id} href={m.url} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-lg overflow-hidden border border-white/10 hover:border-accent/40 transition-colors shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={m.url} alt="" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              )}

              {/* Actions — only for pending */}
              {activeTab === "pending" && actionState[report.id] !== "done" && (
                <div className="mt-4 pt-4 border-t border-white/8 flex flex-col sm:flex-row gap-3 items-start">
                  {showRejectInput[report.id] ? (
                    <div className="flex flex-col gap-2 w-full">
                      <input
                        type="text"
                        placeholder="Reason for rejection (optional)"
                        value={rejectReason[report.id] ?? ""}
                        onChange={(e) => setRejectReason((r) => ({ ...r, [report.id]: e.target.value }))}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-1 focus:ring-accent"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleModerate(report.id, "reject")}
                          disabled={actionState[report.id] === "loading"}
                          className="px-4 py-1.5 rounded-lg bg-red-400/10 border border-red-400/20 text-red-400 text-sm font-medium hover:bg-red-400/20 disabled:opacity-50"
                        >
                          {actionState[report.id] === "loading" ? "Rejecting…" : "Confirm reject"}
                        </button>
                        <button
                          onClick={() => setShowRejectInput((s) => ({ ...s, [report.id]: false }))}
                          className="px-3 py-1.5 rounded-lg text-white/40 text-sm hover:text-white/70"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <button
                        onClick={() => handleModerate(report.id, "approve")}
                        disabled={actionState[report.id] === "loading"}
                        className="px-4 py-1.5 rounded-lg bg-pine/10 border border-pine/20 text-pine text-sm font-medium hover:bg-pine/20 disabled:opacity-50"
                      >
                        {actionState[report.id] === "loading" ? "Approving…" : "Approve"}
                      </button>
                      <button
                        onClick={() => setShowRejectInput((s) => ({ ...s, [report.id]: true }))}
                        className="px-4 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 text-sm font-medium hover:text-white/80"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
