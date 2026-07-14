"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Globe, RefreshCw, Trash2, Pencil, Plus, Languages, Crown, Loader2, X,
  CheckCircle2, AlertCircle, RotateCcw, Newspaper,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerTranslation, generateTrekNews } from "@/lib/api";

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
  trek_name: string | null;
  trek_state: string | null;
  trek_difficulty: string | null;
  trek_duration: string | null;
  trek_permit_required: boolean | null;
  route_image_url: string | null;
}

const PAGE_PREFIX: Record<string, string> = {
  trek_guide: "/trek", packing_list: "/packing", packing_guide: "/packing",
  permit_guide: "/permits", beginner_guide: "/guides", beginner_roundup: "/guides",
  cost_guide: "/guides", gear_guide: "/guides", safety_guide: "/guides",
  itinerary: "/guides", expert_guide: "/guides", premium_compendium: "/guides",
  comparison: "/compare", seasonal: "/seasons", seasonal_hub: "/seasons",
  cluster_hub: "/trek-types", regional_hub: "/regions",
  news_article: "/news",
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
  const hiBase: Record<string, string> = {
    "/trek": "/hi/trek",
    "/packing": "/hi/packing",
    "/guides": "/hi/guides",
  };
  return hiBase[base] ? `${hiBase[base]}/${page.slug}` : "";
}

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

interface NewsModalState {
  slug: string;
  trek_name: string;
  status: "queuing" | "done" | "error";
  task_id?: string;
  message?: string;
}

type TabType = "all" | "trek_guide" | "news_article" | "other";

const TABS: { id: TabType; label: string }[] = [
  { id: "all", label: "All" },
  { id: "trek_guide", label: "Trek Guides" },
  { id: "news_article", label: "News" },
  { id: "other", label: "Other" },
];

export default function CMSAdminPage() {
  const [pages, setPages] = useState<CMSPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [invalidating, setInvalidating] = useState(false);
  const [translation, setTranslation] = useState<TranslationState | null>(null);
  const [newsModal, setNewsModal] = useState<NewsModalState | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [languageFilter, setLanguageFilter] = useState("all");
  // Trek-guide-specific filters (only applied when activeTab === "trek_guide")
  const [trekStateFilter, setTrekStateFilter] = useState("all");
  const [trekDifficultyFilter, setTrekDifficultyFilter] = useState("all");
  const [trekDurationFilter, setTrekDurationFilter] = useState("all");
  const [trekPermitFilter, setTrekPermitFilter] = useState("all");
  const [routeImageFilter, setRouteImageFilter] = useState("all");
  const [publishedFrom, setPublishedFrom] = useState("");
  const [publishedTo, setPublishedTo] = useState("");
  const [updatedFrom, setUpdatedFrom] = useState("");
  const [updatedTo, setUpdatedTo] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function loadPages() {
    setLoading(true);
    try {
      const res = await fetch("/api/v1/cms/pages?limit=500");
      if (res.ok) setPages(await res.json());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadPages(); }, []);
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // Unique trek states from loaded pages (for state dropdown)
  const trekStates = useMemo(() => {
    const states = new Set<string>();
    pages.filter((p) => p.page_type === "trek_guide" && p.trek_state).forEach((p) => states.add(p.trek_state!));
    return Array.from(states).sort();
  }, [pages]);

  const hasTrekFilters = activeTab === "trek_guide" && (
    trekStateFilter !== "all" || trekDifficultyFilter !== "all" ||
    trekDurationFilter !== "all" || trekPermitFilter !== "all" || routeImageFilter !== "all" ||
    publishedFrom !== "" || publishedTo !== "" || updatedFrom !== "" || updatedTo !== ""
  );

  function clearTrekFilters() {
    setTrekStateFilter("all"); setTrekDifficultyFilter("all");
    setTrekDurationFilter("all"); setTrekPermitFilter("all"); setRouteImageFilter("all");
    setPublishedFrom(""); setPublishedTo(""); setUpdatedFrom(""); setUpdatedTo("");
  }

  function parseDurationDays(dur: string | null): number | null {
    if (!dur) return null;
    const m = dur.match(/(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  }

  const visiblePages = useMemo(() => {
    let result = pages;
    if (activeTab === "trek_guide") result = result.filter((p) => p.page_type === "trek_guide");
    else if (activeTab === "news_article") result = result.filter((p) => p.page_type === "news_article");
    else if (activeTab === "other") result = result.filter((p) => p.page_type !== "trek_guide" && p.page_type !== "news_article");
    if (statusFilter !== "all") result = result.filter((p) => p.status === statusFilter);
    if (languageFilter !== "all") result = result.filter((p) => (p.language ?? "en") === languageFilter);
    // Trek-specific filters (only active on trek_guide tab)
    if (activeTab === "trek_guide") {
      if (trekStateFilter !== "all") result = result.filter((p) => p.trek_state === trekStateFilter);
      if (trekDifficultyFilter !== "all") result = result.filter((p) => p.trek_difficulty?.toLowerCase() === trekDifficultyFilter);
      if (trekDurationFilter !== "all") {
        result = result.filter((p) => {
          const d = parseDurationDays(p.trek_duration);
          if (d === null) return false;
          if (trekDurationFilter === "1-3") return d >= 1 && d <= 3;
          if (trekDurationFilter === "4-6") return d >= 4 && d <= 6;
          if (trekDurationFilter === "7-9") return d >= 7 && d <= 9;
          if (trekDurationFilter === "10+") return d >= 10;
          return true;
        });
      }
      if (trekPermitFilter === "yes") result = result.filter((p) => p.trek_permit_required === true);
      if (trekPermitFilter === "no") result = result.filter((p) => p.trek_permit_required === false);
      if (routeImageFilter === "published") result = result.filter((p) => !!p.route_image_url);
      if (routeImageFilter === "missing") result = result.filter((p) => !p.route_image_url);
      if (publishedFrom) result = result.filter((p) => p.published_at && p.published_at >= publishedFrom);
      if (publishedTo) result = result.filter((p) => p.published_at && p.published_at <= publishedTo + "T23:59:59");
      if (updatedFrom) result = result.filter((p) => p.updated_at >= updatedFrom);
      if (updatedTo) result = result.filter((p) => p.updated_at <= updatedTo + "T23:59:59");
    }
    return result;
  }, [pages, activeTab, statusFilter, languageFilter, trekStateFilter, trekDifficultyFilter, trekDurationFilter, trekPermitFilter, routeImageFilter, publishedFrom, publishedTo, updatedFrom, updatedTo]);

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
      setFeedback("Editorial pages are protected and cannot be deleted.");
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

  async function translatePage(page: CMSPage, force = false) {
    const hindiUrl = getHindiUrl(page);
    setTranslation({
      slug: page.slug,
      title: page.title,
      status: "in-progress",
      elapsedSec: 0,
      hindiUrl,
      message: force ? "Re-translating with Claude AI…" : "Calling Claude AI for translation…",
    });

    let elapsed = 0;
    timerRef.current = setInterval(() => {
      elapsed += 1;
      setTranslation((prev) => prev ? { ...prev, elapsedSec: elapsed } : prev);
    }, 1000);

    try {
      const result = await triggerTranslation(page.slug, "hi", force);
      clearInterval(timerRef.current!);
      setTranslation((prev) => prev ? { ...prev, status: "done", message: result.message, fallback: result.fallback } : prev);
      await loadPages();
    } catch (err: unknown) {
      clearInterval(timerRef.current!);
      const msg = err instanceof Error ? err.message : "Translation request failed.";
      setTranslation((prev) => prev ? { ...prev, status: "error", message: msg } : prev);
    }
  }

  async function generateNews(page: CMSPage) {
    setNewsModal({
      slug: page.slug,
      trek_name: page.trek_name ?? page.title,
      status: "queuing",
    });
    try {
      const result = await generateTrekNews(page.slug);
      setNewsModal((prev) => prev ? {
        ...prev,
        status: "done",
        task_id: result.task_id,
        message: `Queued for "${result.trek_name}"`,
      } : null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to queue news generation.";
      setNewsModal((prev) => prev ? { ...prev, status: "error", message: msg } : null);
    }
  }

  function closeTranslationModal() {
    if (timerRef.current) clearInterval(timerRef.current);
    setTranslation(null);
  }

  const tabCounts: Record<TabType, number> = {
    all: pages.length,
    trek_guide: pages.filter((p) => p.page_type === "trek_guide").length,
    news_article: pages.filter((p) => p.page_type === "news_article").length,
    other: pages.filter((p) => p.page_type !== "trek_guide" && p.page_type !== "news_article").length,
  };

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
                    {translation.status === "in-progress" && translation.message.startsWith("Re-") && "Re-translating Hindi Page"}
                    {translation.status === "in-progress" && !translation.message.startsWith("Re-") && "Generating Hindi Translation"}
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
                    <a href={`/admin/cms/${translation.slug}-hi/edit`} className="inline-flex items-center gap-1.5 mt-3 text-xs text-accent font-medium hover:underline">
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
                  <a href={`/admin/cms/${translation.slug}-hi/edit`} className="inline-flex items-center gap-1.5 mt-3 text-xs text-white/50 font-medium hover:underline">
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
              <Button variant="outline" size="sm" className="w-full mt-5 border-white/20 text-white/60 hover:text-white" onClick={closeTranslationModal}>
                Close
              </Button>
            )}
          </div>
        </div>
      )}

      {/* News Generation Modal */}
      {newsModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#14161f] border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-3">
                {newsModal.status === "queuing" && (
                  <div className="h-10 w-10 rounded-xl bg-blue-400/10 flex items-center justify-center flex-shrink-0">
                    <Loader2 className="h-5 w-5 text-blue-400 animate-spin" />
                  </div>
                )}
                {newsModal.status === "done" && (
                  <div className="h-10 w-10 rounded-xl bg-pine/10 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="h-5 w-5 text-pine" />
                  </div>
                )}
                {newsModal.status === "error" && (
                  <div className="h-10 w-10 rounded-xl bg-red-400/10 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-red-400" />
                  </div>
                )}
                <div>
                  <h3 className="text-white font-semibold text-sm">
                    {newsModal.status === "queuing" && "Queuing News Generation…"}
                    {newsModal.status === "done" && "News Generation Queued"}
                    {newsModal.status === "error" && "News Generation Failed"}
                  </h3>
                  <p className="text-white/40 text-xs mt-0.5 font-mono">/{newsModal.slug}</p>
                </div>
              </div>
              {newsModal.status !== "queuing" && (
                <button onClick={() => setNewsModal(null)} className="text-white/30 hover:text-white transition-colors">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div className="bg-[#0c0e14] rounded-xl p-4">
                <p className="text-white/70 text-xs font-medium mb-1">Trek</p>
                <p className="text-white text-sm">{newsModal.trek_name}</p>
              </div>

              {newsModal.status === "queuing" && (
                <div className="bg-[#0c0e14] rounded-xl p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-400/60 rounded-full animate-pulse" style={{ width: "45%" }} />
                    </div>
                  </div>
                  <p className="text-white/40 text-xs mt-2">
                    Fetching Google News RSS and queuing article generation…
                  </p>
                </div>
              )}

              {newsModal.status === "done" && (
                <div className="bg-pine/5 border border-pine/20 rounded-xl p-4">
                  <p className="text-pine text-xs font-medium mb-1">Queued successfully</p>
                  <p className="text-white/60 text-xs">{newsModal.message}</p>
                  {newsModal.task_id && (
                    <p className="text-white/30 text-xs mt-2 font-mono">
                      Task ID: {newsModal.task_id.slice(0, 16)}…
                    </p>
                  )}
                  <p className="text-white/40 text-xs mt-3">
                    The Celery worker will fetch news, generate articles with Claude AI, and publish them. Check the News tab in a minute.
                  </p>
                </div>
              )}

              {newsModal.status === "error" && (
                <div className="bg-red-400/5 border border-red-400/20 rounded-xl p-4">
                  <p className="text-red-400 text-xs font-medium mb-1">Error</p>
                  <p className="text-white/60 text-xs">{newsModal.message}</p>
                </div>
              )}
            </div>

            {newsModal.status !== "queuing" && (
              <div className="flex gap-2 mt-5">
                <Button variant="outline" size="sm" className="flex-1 border-white/20 text-white/60 hover:text-white" onClick={() => setNewsModal(null)}>
                  Close
                </Button>
                {newsModal.status === "done" && (
                  <Button variant="outline" size="sm" className="flex-1 border-white/20 text-white/60 hover:text-white" onClick={() => { setNewsModal(null); setActiveTab("news_article"); }}>
                    View News tab
                  </Button>
                )}
              </div>
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
            <Button variant="hero" size="sm" className="w-fit" onClick={() => invalidateCache("all")} disabled={invalidating}>
              <RefreshCw className={`h-4 w-4 ${invalidating ? "animate-spin" : ""}`} />
              Clear all caches
            </Button>
          </div>
          {feedback && <span className="text-xs text-pine">{feedback}</span>}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total pages", value: pages.length },
          { label: "Trek Guides", value: tabCounts.trek_guide },
          { label: "News Articles", value: tabCounts.news_article },
          { label: "Published", value: pages.filter((p) => p.status === "published").length },
        ].map((kpi) => (
          <div key={kpi.label} className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
            <p className="text-white font-display text-2xl font-semibold leading-none mb-1">{kpi.value}</p>
            <p className="text-white/50 text-xs">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs + Filters */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">

        {/* Tab row */}
        <div className="flex items-center gap-1 px-4 pt-3 pb-0 border-b border-white/8 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${
                activeTab === tab.id
                  ? "border-accent text-white"
                  : "border-transparent text-white/50 hover:text-white/80"
              }`}
            >
              {tab.label}
              <span className="text-[10px] text-white/30 ml-0.5">{tabCounts[tab.id]}</span>
            </button>
          ))}
          <div className="flex-1" />
          <button onClick={loadPages} className="text-white/40 hover:text-white transition-colors pb-2" title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Filter row — global */}
        <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b border-white/5">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#0c0e14] border border-white/10 rounded-lg px-3 py-1.5 text-white/70 text-xs focus:outline-none focus:border-accent/40"
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="review">In Review</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="bg-[#0c0e14] border border-white/10 rounded-lg px-3 py-1.5 text-white/70 text-xs focus:outline-none focus:border-accent/40"
          >
            <option value="all">All languages</option>
            <option value="en">EN only</option>
            <option value="hi">HI only</option>
          </select>
          {(statusFilter !== "all" || languageFilter !== "all") && (
            <button
              onClick={() => { setStatusFilter("all"); setLanguageFilter("all"); }}
              className="text-xs text-white/40 hover:text-white transition-colors flex items-center gap-1"
            >
              <X className="h-3 w-3" /> Clear filters
            </button>
          )}
          <span className="text-white/25 text-xs ml-auto">
            {visiblePages.length} of {pages.length} pages
          </span>
        </div>

        {/* Trek-guide-specific filter row — only shown on Trek Guides tab */}
        {activeTab === "trek_guide" && (
          <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-white/2">
            <span className="text-white/30 text-[10px] font-medium uppercase tracking-wide mr-1">Trek filters:</span>
            {/* State */}
            <select
              value={trekStateFilter}
              onChange={(e) => setTrekStateFilter(e.target.value)}
              className="bg-[#0c0e14] border border-white/10 rounded-lg px-2 py-1 text-white/60 text-xs focus:outline-none focus:border-accent/40"
            >
              <option value="all">All states</option>
              {trekStates.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            {/* Difficulty */}
            <select
              value={trekDifficultyFilter}
              onChange={(e) => setTrekDifficultyFilter(e.target.value)}
              className="bg-[#0c0e14] border border-white/10 rounded-lg px-2 py-1 text-white/60 text-xs focus:outline-none focus:border-accent/40"
            >
              <option value="all">All difficulty</option>
              <option value="easy">Easy</option>
              <option value="moderate">Moderate</option>
              <option value="difficult">Difficult</option>
            </select>
            {/* Duration */}
            <select
              value={trekDurationFilter}
              onChange={(e) => setTrekDurationFilter(e.target.value)}
              className="bg-[#0c0e14] border border-white/10 rounded-lg px-2 py-1 text-white/60 text-xs focus:outline-none focus:border-accent/40"
            >
              <option value="all">All durations</option>
              <option value="1-3">1–3 days</option>
              <option value="4-6">4–6 days</option>
              <option value="7-9">7–9 days</option>
              <option value="10+">10+ days</option>
            </select>
            {/* Permit */}
            <select
              value={trekPermitFilter}
              onChange={(e) => setTrekPermitFilter(e.target.value)}
              className="bg-[#0c0e14] border border-white/10 rounded-lg px-2 py-1 text-white/60 text-xs focus:outline-none focus:border-accent/40"
            >
              <option value="all">Any permit</option>
              <option value="yes">Permit required</option>
              <option value="no">No permit</option>
            </select>
            {/* Route image published/missing */}
            <select
              value={routeImageFilter}
              onChange={(e) => setRouteImageFilter(e.target.value)}
              className="bg-[#0c0e14] border border-white/10 rounded-lg px-2 py-1 text-white/60 text-xs focus:outline-none focus:border-accent/40"
            >
              <option value="all">Any route image</option>
              <option value="published">Route image ✓</option>
              <option value="missing">Route image missing</option>
            </select>
            {/* Published date range */}
            <div className="flex items-center gap-1">
              <span className="text-white/30 text-[10px]">Published:</span>
              <input type="date" value={publishedFrom} onChange={(e) => setPublishedFrom(e.target.value)}
                className="bg-[#0c0e14] border border-white/10 rounded-lg px-2 py-1 text-white/60 text-xs focus:outline-none focus:border-accent/40 w-32" />
              <span className="text-white/20 text-[10px]">–</span>
              <input type="date" value={publishedTo} onChange={(e) => setPublishedTo(e.target.value)}
                className="bg-[#0c0e14] border border-white/10 rounded-lg px-2 py-1 text-white/60 text-xs focus:outline-none focus:border-accent/40 w-32" />
            </div>
            {/* Updated date range */}
            <div className="flex items-center gap-1">
              <span className="text-white/30 text-[10px]">Updated:</span>
              <input type="date" value={updatedFrom} onChange={(e) => setUpdatedFrom(e.target.value)}
                className="bg-[#0c0e14] border border-white/10 rounded-lg px-2 py-1 text-white/60 text-xs focus:outline-none focus:border-accent/40 w-32" />
              <span className="text-white/20 text-[10px]">–</span>
              <input type="date" value={updatedTo} onChange={(e) => setUpdatedTo(e.target.value)}
                className="bg-[#0c0e14] border border-white/10 rounded-lg px-2 py-1 text-white/60 text-xs focus:outline-none focus:border-accent/40 w-32" />
            </div>
            {hasTrekFilters && (
              <button
                onClick={clearTrekFilters}
                className="text-xs text-accent/70 hover:text-accent transition-colors flex items-center gap-1 ml-1"
              >
                <X className="h-3 w-3" /> Clear trek filters
              </button>
            )}
          </div>
        )}

        {/* Table */}
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
                  <td colSpan={5} className="px-4 py-8 text-center text-white/30 text-sm">Loading…</td>
                </tr>
              ) : visiblePages.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/30 text-sm">
                    No pages match the current filters.
                  </td>
                </tr>
              ) : (
                visiblePages.map((page) => (
                  <tr key={page.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
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
                        <Link href={`/admin/cms/${page.slug}/edit`} className="text-white/40 hover:text-white transition-colors" title="Edit page">
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        <button onClick={() => invalidateCache("slug", page.slug)} className="text-white/40 hover:text-accent transition-colors" title="Clear cache">
                          <RefreshCw className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => togglePremium(page.slug, page.is_premium)}
                          className={`transition-colors ${page.is_premium ? "text-amber-400 hover:text-white/40" : "text-white/40 hover:text-amber-400"}`}
                          title={page.is_premium ? "Unset premium" : "Mark as premium"}
                        >
                          <Crown className="h-3.5 w-3.5" />
                        </button>
                        {/* Translate: first time */}
                        {(page.language === "en" || !page.language) && !page.translations?.hi && (
                          <button
                            onClick={() => translatePage(page, false)}
                            disabled={!!translation}
                            className={`transition-colors ${translation ? "text-white/20 cursor-wait" : "text-white/40 hover:text-amber-400"}`}
                            title="Generate Hindi translation"
                          >
                            <Languages className="h-3.5 w-3.5" />
                          </button>
                        )}
                        {/* Re-translate */}
                        {(page.language === "en" || !page.language) && page.translations?.hi && (
                          <>
                            <span className="text-pine/70" title="Hindi translation exists">
                              <Languages className="h-3.5 w-3.5" />
                            </span>
                            <button
                              onClick={() => translatePage(page, true)}
                              disabled={!!translation}
                              className={`transition-colors ${translation ? "text-white/20 cursor-wait" : "text-white/40 hover:text-amber-400"}`}
                              title="Re-translate Hindi page"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          </>
                        )}
                        {/* Generate News — only for EN trek_guide pages */}
                        {page.page_type === "trek_guide" && (page.language === "en" || !page.language) && (
                          <button
                            onClick={() => generateNews(page)}
                            disabled={newsModal?.status === "queuing"}
                            className={`transition-colors ${newsModal?.status === "queuing" ? "text-white/20 cursor-wait" : "text-white/40 hover:text-pine"}`}
                            title="Generate news articles for this trek"
                          >
                            <Newspaper className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <a href={getLiveUrl(page)} target="_blank" rel="noopener noreferrer" className="text-white/40 hover:text-white transition-colors" title="View live page">
                          <Globe className="h-3.5 w-3.5" />
                        </a>
                        {PROTECTED_PAGE_TYPES.has(page.page_type) ? (
                          <span className="text-white/20 cursor-not-allowed" title="Protected — editorial pages cannot be deleted">
                            <Trash2 className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          <button onClick={() => deletePage(page.slug, page.page_type)} className="text-white/40 hover:text-red-400 transition-colors" title="Delete page">
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
