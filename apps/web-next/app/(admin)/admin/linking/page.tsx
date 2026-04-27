"use client";

import { useEffect, useState, useCallback } from "react";
import { Link2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchOrphanPages, fetchAnchorSuggestions, triggerLinkSync, AnchorSuggestion, OrphanPage } from "@/lib/api";

export default function InternalLinkingPage() {
  const [orphans, setOrphans] = useState<OrphanPage[]>([]);
  const [orphanCount, setOrphanCount] = useState(0);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [anchors, setAnchors] = useState<AnchorSuggestion[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrphans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchOrphanPages();
      setOrphans(data.pages);
      setOrphanCount(data.count);
    } catch {
      setError("Failed to load orphan pages.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrphans(); }, [loadOrphans]);

  async function handleSync() {
    setSyncing(true);
    setSyncMsg(null);
    try {
      const result = await triggerLinkSync();
      setSyncMsg(`Synced ${result.synced} pages from CMS.`);
      await loadOrphans();
    } catch {
      setSyncMsg("Sync failed. Check backend logs.");
    } finally {
      setSyncing(false);
    }
  }

  async function handleSelectSlug(slug: string) {
    if (selectedSlug === slug) {
      setSelectedSlug(null);
      setAnchors([]);
      return;
    }
    setSelectedSlug(slug);
    try {
      const data = await fetchAnchorSuggestions(slug);
      setAnchors(data);
    } catch {
      setAnchors([]);
    }
  }

  const PAGE_TYPE_LABELS: Record<string, string> = {
    trek_guide: "Trek Guide",
    packing_list: "Packing List",
    permit_guide: "Permit Guide",
    beginner_guide: "Beginner Guide",
    comparison: "Comparison",
    seasonal: "Seasonal Guide",
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Internal Linking</h1>
          <p className="text-white/50 text-sm">Orphan pages and anchor text suggestions for your content graph.</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <Button
            variant="hero"
            size="sm"
            className="w-fit"
            onClick={handleSync}
            disabled={syncing}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Syncing…" : "Sync from CMS"}
          </Button>
          {syncMsg && (
            <p className="text-xs text-white/50">{syncMsg}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5 mb-5 flex items-center gap-4">
        <div className="bg-amber-400/10 w-8 h-8 rounded-lg flex items-center justify-center">
          <Link2 className="h-4 w-4 text-amber-400" />
        </div>
        <div>
          <p className="text-white font-display text-2xl font-semibold leading-none">{orphanCount}</p>
          <p className="text-white/50 text-xs">Orphan pages (no inbound links)</p>
        </div>
      </div>

      {/* Orphan pages table */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
          <h2 className="text-white font-semibold text-sm">Orphan Pages</h2>
          <span className="text-white/40 text-xs">Click a row to see anchor suggestions</span>
        </div>

        {loading ? (
          <p className="text-white/40 text-sm p-6">Loading…</p>
        ) : error ? (
          <div className="flex items-center gap-2 text-red-400 text-sm p-6">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        ) : orphans.length === 0 ? (
          <p className="text-white/40 text-sm p-6">No orphan pages — all published pages have at least one inbound link.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[480px]">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Title</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden sm:table-cell">Type</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden sm:table-cell">Slug</th>
                </tr>
              </thead>
              <tbody>
                {orphans.map((page) => (
                  <>
                    <tr
                      key={page.id}
                      className={`border-b border-white/5 last:border-0 cursor-pointer transition-colors ${
                        selectedSlug === page.slug ? "bg-accent/8" : "hover:bg-white/3"
                      }`}
                      onClick={() => handleSelectSlug(page.slug)}
                    >
                      <td className="px-4 py-3.5 text-white/80 font-medium text-xs sm:text-sm">{page.title}</td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <span className="text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-2.5 py-1 rounded-full">
                          {PAGE_TYPE_LABELS[page.page_type] ?? page.page_type}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-white/40 text-xs font-mono hidden sm:table-cell">{page.slug}</td>
                    </tr>
                    {selectedSlug === page.slug && anchors.length > 0 && (
                      <tr key={`${page.id}-anchors`} className="bg-[#1a1d2a] border-b border-white/5">
                        <td colSpan={3} className="px-6 py-4">
                          <p className="text-white/50 text-xs font-medium mb-2">Anchor suggestions for &quot;{page.title}&quot;</p>
                          <div className="flex flex-wrap gap-2">
                            {anchors.map((a) => (
                              <div key={a.text} className="bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                                <p className="text-white/80 text-xs font-medium">{a.text}</p>
                                <p className="text-white/30 text-[10px] mt-0.5">{a.reason}</p>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
