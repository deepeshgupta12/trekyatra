"use client";

import { useEffect, useState } from "react";
import { FileText, Globe, RefreshCw, Trash2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CMSPage {
  id: string;
  slug: string;
  page_type: string;
  title: string;
  status: string;
  published_at: string | null;
  updated_at: string;
}

const statusStyle: Record<string, string> = {
  draft: "text-white/40 bg-white/5 border border-white/10",
  review: "text-amber-400 bg-amber-400/10 border border-amber-400/20",
  published: "text-pine bg-pine/10 border border-pine/20",
  archived: "text-white/40 bg-white/5 border border-white/10",
};

export default function CMSAdminPage() {
  const [pages, setPages] = useState<CMSPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [invalidating, setInvalidating] = useState(false);

  async function loadPages() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/cms/pages");
      if (res.ok) setPages(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPages(); }, []);

  async function invalidateCache(scope: "all" | "slug", slug?: string) {
    setInvalidating(true);
    setFeedback(null);
    try {
      const body = scope === "all" ? { scope: "all" } : { slug };
      const [apiRes, feRes] = await Promise.all([
        fetch("/api/v1/cms/cache/invalidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
        fetch("/api/revalidate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        }),
      ]);
      if (apiRes.ok) {
        setFeedback(scope === "all" ? "All caches cleared." : `Cache cleared for /${slug}`);
      }
    } catch {
      setFeedback("Cache clear failed.");
    } finally {
      setInvalidating(false);
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  async function deletePage(slug: string) {
    await fetch(`/api/v1/cms/pages/${slug}`, { method: "DELETE" });
    setPages((prev) => prev.filter((p) => p.slug !== slug));
  }

  return (
    <div className="p-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Master CMS</h1>
          <p className="text-white/50 text-sm">All published and draft content pages. Cache control included.</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <Button
            variant="hero"
            size="sm"
            className="w-fit"
            onClick={() => invalidateCache("all")}
            disabled={invalidating}
          >
            <RefreshCw className={`h-4 w-4 ${invalidating ? "animate-spin" : ""}`} />
            Clear all caches
          </Button>
          {feedback && (
            <span className="text-xs text-pine">{feedback}</span>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total pages", value: pages.length },
          { label: "Published", value: pages.filter((p) => p.status === "published").length },
          { label: "Drafts", value: pages.filter((p) => p.status === "draft").length },
          { label: "In review", value: pages.filter((p) => p.status === "review").length },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
            <p className="text-white font-display text-2xl font-semibold leading-none mb-1">{kpi.value}</p>
            <p className="text-white/50 text-xs">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Pages table */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
          <h2 className="text-white font-semibold text-sm">Content pages</h2>
          <button
            onClick={loadPages}
            className="text-white/40 hover:text-white transition-colors"
            title="Refresh"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Title / Slug</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden sm:table-cell">Type</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Status</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden md:table-cell">Updated</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/30 text-sm">
                    Loading…
                  </td>
                </tr>
              ) : pages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/30 text-sm">
                    No CMS pages yet. Publish a draft to create one.
                  </td>
                </tr>
              ) : (
                pages.map((page) => (
                  <tr
                    key={page.id}
                    className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors"
                  >
                    <td className="px-4 py-3.5">
                      <div className="font-medium text-white/90 text-sm">{page.title}</div>
                      <div className="text-white/40 text-xs mt-0.5 font-mono">/{page.slug}</div>
                    </td>
                    <td className="px-4 py-3.5 text-white/50 text-xs hidden sm:table-cell">
                      {page.page_type.replace(/_/g, " ")}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusStyle[page.status] ?? statusStyle.draft}`}>
                        {page.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-white/40 text-xs hidden md:table-cell">
                      {new Date(page.updated_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => invalidateCache("slug", page.slug)}
                          className="text-white/40 hover:text-accent transition-colors"
                          title="Clear cache for this page"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                        <a
                          href={`/trek/${page.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/40 hover:text-white transition-colors"
                          title="View page"
                        >
                          <Globe className="h-3.5 w-3.5" />
                        </a>
                        <button
                          onClick={() => deletePage(page.slug)}
                          className="text-white/40 hover:text-red-400 transition-colors"
                          title="Delete page"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
