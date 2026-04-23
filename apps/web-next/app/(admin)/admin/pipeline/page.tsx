"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2, RefreshCw, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CopyableId } from "@/components/admin/CopyableId";
import Link from "next/link";

interface Topic {
  id: string;
  title: string;
  primary_keyword: string;
  status: string;
}

interface Cluster {
  id: string;
  name: string;
  primary_keyword: string;
}

interface Brief {
  id: string;
  title: string;
  target_keyword: string;
  status: string;
  topic_opportunity_id: string | null;
  keyword_cluster_id: string | null;
}

interface Draft {
  id: string;
  title: string;
  status: string;
  brief_id: string;
  confidence_score: number | null;
}

interface PipelineRow {
  briefId: string;
  briefTitle: string;
  briefStatus: string;
  briefKeyword: string;
  topicTitle: string | null;
  topicId: string | null;
  clusterName: string | null;
  clusterId: string | null;
  draftId: string | null;
  draftTitle: string | null;
  draftStatus: string | null;
  confidence: number | null;
}

const BRIEF_STAGE: Record<string, number> = {
  draft: 1, review: 2, approved: 3, scheduled: 4, rejected: -1,
};

const DRAFT_STATUS_STYLE: Record<string, string> = {
  draft:           "text-white/40 bg-white/5 border border-white/10",
  requires_review: "text-amber-400 bg-amber-400/10 border border-amber-400/20",
  review:          "text-blue-400 bg-blue-400/10 border border-blue-400/20",
  approved:        "text-pine bg-pine/10 border border-pine/20",
  published:       "text-pine bg-pine/10 border border-pine/20",
};

const BRIEF_STATUS_STYLE: Record<string, string> = {
  draft:     "text-white/40 bg-white/5 border border-white/10",
  review:    "text-amber-400 bg-amber-400/10 border border-amber-400/20",
  approved:  "text-pine bg-pine/10 border border-pine/20",
  scheduled: "text-blue-400 bg-blue-400/10 border border-blue-400/20",
  rejected:  "text-red-400 bg-red-400/10 border border-red-400/20",
};

// Summarise pipeline stage counts
function StagePill({ label, count, style }: { label: string; count: number; style: string }) {
  return (
    <div className="bg-[#14161f] rounded-xl border border-white/10 px-4 py-3 text-center min-w-[90px]">
      <p className={`text-lg font-semibold font-display ${style}`}>{count}</p>
      <p className="text-white/40 text-[10px] mt-0.5">{label}</p>
    </div>
  );
}

export default function PipelinePage() {
  const [rows, setRows] = useState<PipelineRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [topicsRes, clustersRes, briefsRes, draftsRes] = await Promise.all([
        fetch("/api/v1/topics"),
        fetch("/api/v1/clusters"),
        fetch("/api/v1/briefs"),
        fetch("/api/v1/drafts"),
      ]);

      if (!topicsRes.ok || !clustersRes.ok || !briefsRes.ok || !draftsRes.ok) {
        throw new Error("Failed to load pipeline data");
      }

      const [topics, clusters, briefs, drafts]: [Topic[], Cluster[], Brief[], Draft[]] =
        await Promise.all([topicsRes.json(), clustersRes.json(), briefsRes.json(), draftsRes.json()]);

      const topicMap = new Map(topics.map(t => [t.id, t]));
      const clusterMap = new Map(clusters.map(c => [c.id, c]));
      const draftByBrief = new Map(drafts.map(d => [d.brief_id, d]));

      const pipeline: PipelineRow[] = briefs.map(b => {
        const topic = b.topic_opportunity_id ? topicMap.get(b.topic_opportunity_id) : null;
        const cluster = b.keyword_cluster_id ? clusterMap.get(b.keyword_cluster_id) : null;
        const draft = draftByBrief.get(b.id) ?? null;
        return {
          briefId: b.id,
          briefTitle: b.title,
          briefStatus: b.status,
          briefKeyword: b.target_keyword,
          topicTitle: topic?.title ?? null,
          topicId: b.topic_opportunity_id,
          clusterName: cluster?.name ?? null,
          clusterId: b.keyword_cluster_id,
          draftId: draft?.id ?? null,
          draftTitle: draft?.title ?? null,
          draftStatus: draft?.status ?? null,
          confidence: draft?.confidence_score ?? null,
        };
      });

      // Sort: review first, then approved, then draft
      pipeline.sort((a, b) => (BRIEF_STAGE[b.briefStatus] ?? 0) - (BRIEF_STAGE[a.briefStatus] ?? 0));
      setRows(pipeline);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const published   = rows.filter(r => r.draftStatus === "published").length;
  const withDraft   = rows.filter(r => r.draftId && r.draftStatus !== "published").length;
  const approved    = rows.filter(r => r.briefStatus === "approved" && !r.draftId).length;
  const inReview    = rows.filter(r => r.briefStatus === "review").length;
  const inProgress  = rows.filter(r => r.briefStatus === "draft").length;

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Content Pipeline</h1>
          <p className="text-white/50 text-sm">Topic → Cluster → Brief → Draft → Published</p>
        </div>
        <Button variant="outline" size="sm" className="border-white/20 text-white/60 hover:text-white w-fit"
          onClick={fetchAll} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Stage summary */}
      <div className="flex gap-3 flex-wrap mb-6">
        <StagePill label="In Progress" count={inProgress} style="text-white/60" />
        <ArrowRight className="h-4 w-4 text-white/15 self-center" />
        <StagePill label="In Review" count={inReview} style="text-amber-400" />
        <ArrowRight className="h-4 w-4 text-white/15 self-center" />
        <StagePill label="Approved" count={approved} style="text-pine" />
        <ArrowRight className="h-4 w-4 text-white/15 self-center" />
        <StagePill label="Draft Stage" count={withDraft} style="text-blue-400" />
        <ArrowRight className="h-4 w-4 text-white/15 self-center" />
        <StagePill label="Published" count={published} style="text-pine" />
      </div>

      {error && (
        <div className="text-amber-400 text-sm bg-amber-400/10 border border-amber-400/20 rounded-xl px-4 py-3 mb-6">
          {error}
        </div>
      )}

      {/* Pipeline table */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-white/40">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading pipeline…
          </div>
        ) : rows.length === 0 ? (
          <div className="text-center py-16 text-white/40 text-sm">
            No content in the pipeline yet. Start by discovering topics.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[800px]">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-white/40 font-medium">Brief</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium hidden sm:table-cell">Topic</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium hidden md:table-cell">Cluster</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium">Brief status</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium">Draft status</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium hidden lg:table-cell">IDs</th>
                  <th className="px-4 py-3 text-white/40 font-medium" />
                </tr>
              </thead>
              <tbody>
                {rows.map(row => (
                  <tr key={row.briefId} className="border-b border-white/5 last:border-0 hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3.5">
                      <p className="text-white/80 font-medium leading-snug max-w-[200px]">{row.briefTitle}</p>
                      <p className="text-white/30 mt-0.5">{row.briefKeyword}</p>
                    </td>
                    <td className="px-4 py-3.5 text-white/50 hidden sm:table-cell max-w-[140px]">
                      {row.topicTitle
                        ? <span className="line-clamp-2">{row.topicTitle}</span>
                        : <span className="text-white/20">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-white/50 hidden md:table-cell">
                      {row.clusterName ?? <span className="text-white/20">—</span>}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`px-2 py-0.5 rounded-full font-medium ${BRIEF_STATUS_STYLE[row.briefStatus] ?? ""}`}>
                        {row.briefStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      {row.draftStatus ? (
                        <div>
                          <span className={`px-2 py-0.5 rounded-full font-medium ${DRAFT_STATUS_STYLE[row.draftStatus] ?? ""}`}>
                            {row.draftStatus}
                          </span>
                          {row.confidence !== null && (
                            <p className="text-white/30 mt-0.5">{Math.round(row.confidence * 100)}% conf.</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-white/20">No draft</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 hidden lg:table-cell">
                      <div className="space-y-1">
                        <CopyableId id={row.briefId} label="Brief" />
                        {row.topicId && <CopyableId id={row.topicId} label="Topic" />}
                        {row.clusterId && <CopyableId id={row.clusterId} label="Cluster" />}
                        {row.draftId && <CopyableId id={row.draftId} label="Draft" />}
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-col gap-1 items-end">
                        <Link href={`/admin/briefs`} className="text-[10px] text-white/40 hover:text-white/70 transition-colors">
                          Brief →
                        </Link>
                        {row.draftId && (
                          <Link href={`/admin/drafts`} className="text-[10px] text-accent/60 hover:text-accent transition-colors">
                            Draft →
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
