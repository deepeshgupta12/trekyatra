"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Globe, RefreshCw, Trash2, Pencil, Plus, Languages, Crown, Loader2, X, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerTranslation } from "@/lib/api";

interface CMSPage {
  id: string;
  slug: string;
  page_type: string;
  title: string;
  status: string;
  published_at: string | null;
  updated_at: string;
  language: string;
  translations: Record<string, string> | null;
  is_premium: boolean;
}

// Maps page_type to its public URL prefix. Editorial pages use empty prefix (/{slug}).
const PAGE_PREFIX: Record<string, string> = {
  trek_guide: "/trek", packing_list: "/packing", packing_guide: "/packing",
  permit_guide: "/permits", beginner_guide: "/guides", beginner_roundup: "/guides",
  cost_guide: "/guides", gear_guide: "/guides", safety_guide: "/guides",
  itinerary: "/guides", expert_guide: "/guides", premium_compendium: "/guides",
  comparison: "/compare", seasonal: "/seasons", seasonal_hub: "/seasons",
  cluster_hub: "/trek-types", regional_hub: "/regions",
  editorial: "",
};
function getLiveUrl(page: CMSPage): string {
  const base = PAGE_PREFIX[page.page_type];
  if (base === undefined) return `/trek/${page.slug}`;
  return base === "" ? `/${page.slug}` : `${base}/${page.slug}`;
}
function getHindiUrl(page: CMSPage): string {
  const base = PAGE_PREFIX[page.page_type];
  if (base === undefined) return `/hi/trek/${page.slug}`;
  if (base === "" || base === "/compare" || base === "/seasons" || base === "/trek-types" || base === "/regions") return "";
  // Map /trek → /hi/trek, /packing → /hi/packing, /guides → /hi/guides, /permits → ""
  const hiBase: Record<string, string> = {
    "/trek": "/hi/trek",
    "/packing": "/hi/packing",
    "/guides": "/hi/guides",
  };
  return hiBase[base] ? `${hiBase[base]}/${page.slug}` : "";
}

// Editorial pages are system pages — protect them from deletion
const PROTECTED_PAGE_TYPES = new Set(["editorial"]);

const statusStyle: Record<string, string> = {
  draft: "text-white/40 bg-white/5 border border-white/10",
  review: "text-amber-400 bg-amber-400/10 border border-amber-400/20",
  published: "text-pine bg-pine/10 border border-pine/20",
  archived: "text-white/40 bg-white/5 border border-white/10",
};

interface TranslationState {
  slug: string;
  title: string;
  status: "in-progress" | "done" | "error";
  elapsedSec: number;
  hindiUrl: string;
  message: string;
  fallback?: boolean;
}

export default function CMSAdminPage() {
  const [pages, setPages] = useState<CMSPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [invalidating, setInvalidating] = useState(false);
  const [translation, setTranslation] = useState<TranslationState | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

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

  // Cleanup timer on unmount
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  async function invalidateCache(scope: "all" | "slug", slug?: string) {
    setInvalidating(true);
    setFeedback(null);
    try {
      const body = scope === "all" ? { scope: "all" } : { slug };
      const [apiRes] = await Promise.all([
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

  async function deletePage(slug: string, pageType: string) {
    if (PROTECTED_PAGE_TYPES.has(pageType)) {
      setFeedback("Editorial pages are protected and cannot be deleted. Edit their content instead.");
      setTimeout(() => setFeedback(null), 4000);
      return;
    }
    if (!confirm(`Delete /${slug}? This cannot be undone.`)) return;
    await fetch(`/api/v1/cms/pages/${slug}`, { method: "DELETE" });
    setPages((prev) => prev.filter((p) => p.slug !== slug));
  }

  async function togglePremium(slug: string, currentValue: boolean) {
    setFeedback(null);
    try {
      const res = await fetch(`/api/v1/cms/pages/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_premium: !currentValue }),
      });
      if (res.ok) {
        setPages((prev) => prev.map((p) => p.slug === slug ? { ...p, is_premium: !currentValue } : p));
        setFeedback(`${slug}: premium ${!currentValue ? "enabled" : "disabled"}.`);
      }
    } catch {
      setFeedback("Toggle failed.");
    } finally {
      setTimeout(() => setFeedback(null), 3000);
    }
  }

  async function translatePage(page: CMSPage) {
    // Start the progress modal
    const hindiUrl = getHindiUrl(page);
    setTranslation({
      slug: page.slug,
      title: page.title,
      status: "in-progress",
      elapsedSec: 0,
      hindiUrl,
      message: "Calling Claude AI for translation…",
    });

    // Elapsed timer
    let elapsed = 0;
    timerRef.current = setInterval(() => {
      elapsed += 1;
      setTranslation((prev) => prev ? { ...prev, elapsedSec: elapsed } : prev);
    }, 1000);

    try {
      const result = await triggerTranslation(page.slug, "hi");
      clearInterval(timerRef.current!);

      setTranslation((prev) => prev ? {
        ...prev,
        status: "done",
        message: result.message,
        fallback: result.fallback,
      } : prev);

      await loadPages();
    } catch (err: unknown) {
      clearInterval(timerRef.current!);
      const msg = err instanceof Error ? err.message : "Translation request failed.";
      setTranslation((prev) => prev ? {
        ...prev,
        status: "error",
        message: msg,
      } : prev);
    }
  }

  function closeTranslationModal() {
    if (timerRef.current) clearInterval(timerRef.current);
    setTranslation(null);
  }

  return (
    <div className="p-6 max-w-6xl">
      {/* Translation Progress Modal */}
      {translation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#14161f] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                {translation.status === "in-progress" && (
                  <div className="h-10 w-10 rounded-xl bg-amber-400/10 flex items-center justify-center flex-shrink-0">
                    <Loader2 className="h-5 w-5 text-amber-400 animate-spin" />
                  </div>
                )}
                {translation.status === "done" && !translation.fallback && (
                  <div className="h-10 w-10 rounded-xl bg-pine/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-pine" />
                  </div>
                )}
                {translation.status === "done" && translation.fallback && (
                  <div className="h-10 w-10 rounded-xl bg-amber-400/10 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-amber-400" />
                  </div>
                )}
                {translation.status === "error" && (
                  <div className="h-10 w-10 rounded-xl bg-red-400/10 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                )}
                <div>
                  <h3 className="text-white font-semibold text-sm">
                    {translation.status === "in-progress" && "Generating Hindi Translation"}
                    {translation.status === "done" && !translation.fallback && "Translation Saved as Draft"}
                    {translation.status === "done" && translation.fallback && "Draft Saved — Not Translated"}
                    {translation.status === "error" && "Translation Failed"}
                  </h3>
                  <p className="text-white/40 text-xs mt-0.5 font-mono">/{translation.slug}</p>
                </div>
              </div>
              {translation.status !== "in-progress" && (
                <button onClick={closeTranslationModal} className="text-white/30 hover:text-white transition-colors">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Progress details */}
            <div className="space-y-3">
              <div className="bg-[#0c0e14] rounded-xl p-4">
                <p className="text-white/70 text-xs font-medium mb-1">Page</p>
                <p className="text-white text-sm">{translation.title}</p>
              </div>

              {translation.status === "in-progress" && (
                <div className="bg-[#0c0e14] rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-white/70 text-xs font-medium">Elapsed</p>
                    <p className="text-amber-400 font-mono text-sm">{translation.elapsedSec}s</p>
                  </div>
                  <p className="text-white/40 text-xs mt-2">{translation.message}</p>
                  <div className="mt-3 h-1 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-400/60 rounded-full animate-pulse" style={{ width: "60%" }} />
                  </div>
                  <p className="text-white/25 text-xs mt-2">Translation can take 15–30 seconds. Please wait…</p>
                </div>
              )}

              {translation.status === "done" && !translation.fallback && (
                <div className="bg-pine/5 border border-pine/20 rounded-xl p-4">
                  <p className="text-pine text-xs font-medium mb-1">Translation complete — saved as draft</p>
                  <p className="text-white/60 text-xs">{translation.message}</p>
                  <p className="text-white/40 text-xs mt-2">Review in CMS and publish when ready.</p>
                  {translation.hindiUrl && (
                    <a
                      href={`/admin/cms/${translation.slug}-hi/edit`}
                      className="inline-flex items-center gap-1.5 mt-3 text-xs text-accent font-medium hover:underline"
                    >
                      <Globe className="h-3.5 w-3.5" />
                      Review draft in CMS →
                    </a>
                  )}
                </div>
              )}
              {translation.status === "done" && translation.fallback && (
                <div className="bg-amber-400/5 border border-amber-400/20 rounded-xl p-4">
                  <p className="text-amber-400 text-xs font-medium mb-1">Draft saved — translation did not run</p>
                  <p className="text-white/60 text-xs">{translation.message}</p>
                  <p className="text-amber-400/70 text-xs mt-2 font-medium">
                    Action required: Set ANTHROPIC_API_KEY in production to enable real Hindi translation.
                  </p>
                  <a
                    href={`/admin/cms/${translation.slug}-hi/edit`}
                    className="inline-flex items-center gap-1.5 mt-3 text-xs text-white/50 font-medium hover:underline"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Edit draft in CMS →
                  </a>
                </div>
              )}

              {translation.status === "error" && (
                <div className="bg-red-400/5 border border-red-400/20 rounded-xl p-4">
                  <p className="text-red-400 text-xs font-medium mb-1">Error</p>
                  <p className="text-white/60 text-xs">{translation.message}</p>
                </div>
              )}
            </div>

            {translation.status !== "in-progress" && (
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-5 border-white/20 text-white/60 hover:text-white"
                onClick={closeTranslationModal}
              >
                Close
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Master CMS</h1>
          <p className="text-white/50 text-sm">All published and draft content pages. Cache control included.</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex gap-2">
            <Link href="/admin/cms/new">
              <Button variant="outline" size="sm" className="border-white/20 text-white/60 hover:text-white w-fit">
                <Plus className="h-4 w-4" /> New page
              </Button>
            </Link>
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
          </div>
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
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-white/40 text-xs font-mono">/{page.slug}</span>
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${page.language === "en" ? "text-blue-400 bg-blue-400/10" : "text-amber-400 bg-amber-400/10"}`}>
                          {(page.language ?? "en").toUpperCase()}
                        </span>
                        {page.translations?.hi && (
                          <span className="text-xs text-pine bg-pine/10 px-1.5 py-0.5 rounded">HI ✓</span>
                        )}
                      </div>
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
                        <Link
                          href={`/admin/cms/${page.slug}/edit`}
                          className="text-white/40 hover:text-white transition-colors"
                          title="Edit page"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          onClick={() => invalidateCache("slug", page.slug)}
                          className="text-white/40 hover:text-accent transition-colors"
                          title="Clear cache"
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                        {/* Premium toggle */}
                        <button
                          onClick={() => togglePremium(page.slug, page.is_premium)}
                          className={`transition-colors ${page.is_premium ? "text-amber-400 hover:text-white/40" : "text-white/40 hover:text-amber-400"}`}
                          title={page.is_premium ? "Unset premium" : "Mark as premium"}
                        >
                          <Crown className="h-3.5 w-3.5" />
                        </button>
                        {/* Translate button: only for English source pages without an existing HI translation */}
                        {(page.language === "en" || !page.language) && !page.translations?.hi && (
                          <button
                            onClick={() => translatePage(page)}
                            disabled={!!translation}
                            className={`transition-colors ${translation ? "text-white/20 cursor-wait" : "text-white/40 hover:text-amber-400"}`}
                            title="Generate Hindi translation"
                          >
                            <Languages className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {/* Re-translate button: shown when HI translation already exists */}
                        {(page.language === "en" || !page.language) && page.translations?.hi && (
                          <span className="text-pine/60" title="Hindi translation exists">
                            <Languages className="h-3.5 w-3.5" />
                          </span>
                        )}
                        <a
                          href={getLiveUrl(page)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/40 hover:text-white transition-colors"
                          title="View live page"
                        >
                          <Globe className="h-3.5 w-3.5" />
                        </a>
                        {PROTECTED_PAGE_TYPES.has(page.page_type) ? (
                          <span className="text-white/20 cursor-not-allowed" title="Protected — editorial pages cannot be deleted">
                            <Trash2 className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          <button
                            onClick={() => deletePage(page.slug, page.page_type)}
                            className="text-white/40 hover:text-red-400 transition-colors"
                            title="Delete page"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
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
