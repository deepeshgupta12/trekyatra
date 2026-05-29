"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, ArrowUpDown } from "lucide-react";

interface PageAnalytics {
  slug: string;
  title: string;
  page_type: string;
  views_7d: number;
  views_30d: number;
  scroll_50_count: number;
  scroll_100_count: number;
  leads: number;
  published_at?: string;
}

type SortKey = "views_30d" | "views_7d" | "leads" | "scroll_50_count";

export default function ContentAnalyticsPage() {
  const [pages, setPages] = useState<PageAnalytics[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>("views_30d");
  const [pageTypeFilter, setPageTypeFilter] = useState("");

  useEffect(() => {
    setLoading(true);
    const q = new URLSearchParams({ sort_by: sortBy });
    if (pageTypeFilter) q.set("page_type", pageTypeFilter);
    fetch(`/api/v1/admin/cdp/content/pages?${q.toString()}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d: { pages: PageAnalytics[]; total: number }) => {
        setPages(d.pages ?? []);
        setTotal(d.total ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [sortBy, pageTypeFilter]);

  const SortHeader = ({ col, label }: { col: SortKey; label: string }) => (
    <th
      className={`text-left px-4 py-3 text-xs font-medium cursor-pointer select-none ${sortBy === col ? "text-white" : "text-white/40"}`}
      onClick={() => setSortBy(col)}
    >
      <span className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="h-3 w-3 opacity-50" />
      </span>
    </th>
  );

  const PAGE_TYPES = ["trek_guide", "packing_list", "permit_guide", "beginner_guide", "editorial"];

  return (
    <div className="min-h-screen bg-[#0c0e14] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-semibold text-white mb-1">Content Analytics</h1>
            <p className="text-white/50 text-sm">Per-page views, scroll depth, and lead generation.</p>
          </div>
          <Link href="/admin/cdp/content/treks"
            className="text-sm text-accent hover:text-accent/80 font-medium">
            Trek Funnel Analytics →
          </Link>
        </div>

        {/* Filters */}
        <div className="bg-[#14161f] rounded-2xl border border-white/10 p-4 mb-6 flex items-center gap-4">
          <select
            value={pageTypeFilter}
            onChange={(e) => setPageTypeFilter(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          >
            <option value="">All page types</option>
            {PAGE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <span className="text-white/30 text-xs ml-auto">{total} pages total</span>
        </div>

        {/* Table */}
        <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Page</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Type</th>
                  <SortHeader col="views_7d" label="Views 7d" />
                  <SortHeader col="views_30d" label="Views 30d" />
                  <SortHeader col="scroll_50_count" label="Scroll 50%+" />
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Scroll 100%</th>
                  <SortHeader col="leads" label="Leads" />
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-white/30 text-sm">Loading…</td></tr>
                )}
                {!loading && pages.length === 0 && (
                  <tr><td colSpan={7} className="px-4 py-8 text-center text-white/30 text-sm">No published pages found.</td></tr>
                )}
                {!loading && pages.map((p) => (
                  <tr key={p.slug} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <a
                          href={`/trek/${p.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/80 font-medium text-xs hover:text-accent flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {p.title || p.slug}
                          <ExternalLink className="h-3 w-3 opacity-50" />
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="text-[10px] text-white/40 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded">
                        {p.page_type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-white/70 text-xs">{p.views_7d.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-white/70 text-xs font-medium">{p.views_30d.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-white/70 text-xs">{p.scroll_50_count.toLocaleString()}</td>
                    <td className="px-4 py-3.5 text-white/50 text-xs">{p.scroll_100_count.toLocaleString()}</td>
                    <td className="px-4 py-3.5">
                      {p.leads > 0 ? (
                        <span className="text-pine text-xs font-semibold">{p.leads}</span>
                      ) : (
                        <span className="text-white/25 text-xs">0</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
