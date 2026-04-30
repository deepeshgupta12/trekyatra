"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Globe, RefreshCw, ExternalLink, MapPin, Cloud, BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchHubPages, regenerateHub, HubPage } from "@/lib/api";

const HUB_TYPE_LABELS: Record<string, string> = {
  seasonal_hub: "Seasonal",
  cluster_hub: "Trek Category",
  regional_hub: "Regional",
};

const HUB_TYPE_ICONS: Record<string, typeof Globe> = {
  seasonal_hub: Cloud,
  cluster_hub: BarChart2,
  regional_hub: MapPin,
};

const HUB_TYPE_COLORS: Record<string, string> = {
  seasonal_hub: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  cluster_hub: "text-purple-400 bg-purple-500/10 border-purple-400/20",
  regional_hub: "text-pine bg-pine/10 border-pine/20",
};

const STATUS_COLORS: Record<string, string> = {
  published: "text-pine bg-pine/10 border border-pine/20",
  draft: "text-amber-400 bg-amber-400/10 border border-amber-400/20",
  archived: "text-white/40 bg-white/5 border border-white/10",
};

const SEASON_SLUGS = ["seasons/winter", "seasons/summer", "seasons/monsoon", "seasons/spring"];

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function HubsPage() {
  const [hubs, setHubs] = useState<HubPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetchHubPages()
      .then(setHubs)
      .catch(() => setHubs([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleRegenerate(slug: string) {
    setRegenerating((p) => ({ ...p, [slug]: true }));
    setMessages((p) => ({ ...p, [slug]: "" }));
    try {
      const res = await regenerateHub(slug);
      setMessages((p) => ({ ...p, [slug]: `✓ ${res.message}` }));
      // Refresh list
      const updated = await fetchHubPages();
      setHubs(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to regenerate";
      setMessages((p) => ({ ...p, [slug]: `✗ ${msg}` }));
    } finally {
      setRegenerating((p) => ({ ...p, [slug]: false }));
    }
  }

  const filteredHubs = filter === "all" ? hubs : hubs.filter((h) => h.page_type === filter);

  // Seasonal stubs: show placeholders for seasons that don't have a CMS page yet
  const existingSeasonSlugs = new Set(hubs.filter((h) => h.page_type === "seasonal_hub").map((h) => h.slug));
  const missingSeasons = SEASON_SLUGS.filter((s) => !existingSeasonSlugs.has(s));

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Destination Hubs</h1>
          <p className="text-white/50 text-sm">Manage regional, seasonal, and trek-type hub pages.</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex gap-2 items-center flex-wrap">
            {(["all", "seasonal_hub", "cluster_hub", "regional_hub"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-all ${
                  filter === t
                    ? "bg-accent/15 text-accent border-accent/20 font-semibold"
                    : "text-white/40 border-white/10 hover:text-white/70"
                }`}
              >
                {t === "all" ? "All hubs" : HUB_TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total hubs", value: hubs.length, icon: Globe, color: "text-accent" },
          { label: "Seasonal", value: hubs.filter((h) => h.page_type === "seasonal_hub").length, icon: Cloud, color: "text-blue-400" },
          { label: "Trek categories", value: hubs.filter((h) => h.page_type === "cluster_hub").length, icon: BarChart2, color: "text-purple-400" },
          { label: "Regional", value: hubs.filter((h) => h.page_type === "regional_hub").length, icon: MapPin, color: "text-pine" },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-[#14161f] rounded-2xl border border-white/10 p-4">
            <div className={`${color} bg-white/5 w-8 h-8 rounded-lg flex items-center justify-center mb-2`}>
              <Icon className="h-4 w-4" />
            </div>
            <p className="text-white font-display text-2xl font-semibold leading-none mb-1">{value}</p>
            <p className="text-white/40 text-xs">{label}</p>
          </div>
        ))}
      </div>

      {/* Hub list table */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden mb-6">
        <div className="px-5 py-3.5 border-b border-white/8 flex items-center justify-between">
          <h2 className="text-white font-semibold text-sm">Hub Pages</h2>
          <span className="text-white/30 text-xs">{filteredHubs.length} page{filteredHubs.length !== 1 ? "s" : ""}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Title / Slug</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Type</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden sm:table-cell">Status</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden md:table-cell">Last Updated</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/30 text-sm">Loading…</td>
                </tr>
              ) : filteredHubs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-white/30 text-sm">No hub pages found.</td>
                </tr>
              ) : (
                filteredHubs.map((hub) => {
                  const TypeIcon = HUB_TYPE_ICONS[hub.page_type] ?? Globe;
                  const typeColor = HUB_TYPE_COLORS[hub.page_type] ?? "text-white/40 bg-white/5 border-white/10";
                  return (
                    <tr key={hub.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3.5">
                        <p className="text-white/90 font-medium text-sm">{hub.title}</p>
                        <p className="text-white/30 text-xs font-mono mt-0.5">{hub.slug}</p>
                        {messages[hub.slug] && (
                          <p className={`text-xs mt-1 ${messages[hub.slug].startsWith("✓") ? "text-pine" : "text-red-400"}`}>
                            {messages[hub.slug]}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${typeColor}`}>
                          <TypeIcon className="h-3 w-3" />
                          {HUB_TYPE_LABELS[hub.page_type]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[hub.status] ?? STATUS_COLORS.draft}`}>
                          {hub.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-white/40 text-xs hidden md:table-cell">{formatDate(hub.updated_at)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          {hub.page_type === "seasonal_hub" && (
                            <button
                              onClick={() => handleRegenerate(hub.slug)}
                              disabled={regenerating[hub.slug]}
                              className="inline-flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 disabled:text-white/20 transition-colors"
                            >
                              <RefreshCw className={`h-3.5 w-3.5 ${regenerating[hub.slug] ? "animate-spin" : ""}`} />
                              {regenerating[hub.slug] ? "Running…" : "Regenerate"}
                            </button>
                          )}
                          <Link
                            href={`/${hub.slug}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" /> View
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Missing seasonal hubs panel */}
      {(filter === "all" || filter === "seasonal_hub") && missingSeasons.length > 0 && (
        <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/8">
            <h2 className="text-white font-semibold text-sm">Generate Missing Seasonal Hubs</h2>
            <p className="text-white/40 text-xs mt-0.5">These seasonal hub pages have not been generated yet.</p>
          </div>
          <div className="p-5 grid sm:grid-cols-2 gap-3">
            {missingSeasons.map((slug) => {
              const season = slug.split("/")[1];
              return (
                <div key={slug} className="bg-[#0f1117] rounded-xl border border-white/8 p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-white/80 font-medium text-sm capitalize">{season} Hub</p>
                    <p className="text-white/30 text-xs font-mono">{slug}</p>
                    {messages[slug] && (
                      <p className={`text-xs mt-1 ${messages[slug].startsWith("✓") ? "text-pine" : "text-red-400"}`}>
                        {messages[slug]}
                      </p>
                    )}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={regenerating[slug]}
                    onClick={() => handleRegenerate(slug)}
                    className="border-white/20 text-white/60 hover:text-white text-xs flex-shrink-0"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${regenerating[slug] ? "animate-spin" : ""}`} />
                    {regenerating[slug] ? "Generating…" : "Generate"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
