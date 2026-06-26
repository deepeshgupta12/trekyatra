"use client";

import { useEffect, useState, useCallback } from "react";
import {
  CloudSun,
  RefreshCw,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock,
  Zap,
  Edit2,
  X,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  fetchConditionsList,
  seedAllCoordinates,
  dispatchRefreshAll,
  refreshSingleTrek,
  setTrekCoordinates,
  type ConditionAdminRow,
  type ConditionsListOut,
} from "@/lib/admin-conditions";

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });
}

function relativeTime(iso: string | null): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  if (h < 1) return "< 1h ago";
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Status badge ──────────────────────────────────────────────────────────────

const trailStyle: Record<string, string> = {
  open: "text-pine bg-pine/10 border border-pine/20",
  caution: "text-amber-400 bg-amber-400/10 border border-amber-400/20",
  closed: "text-red-400 bg-red-400/10 border border-red-400/20",
};

const permitStyle: Record<string, string> = {
  not_required: "text-white/40 bg-white/5 border border-white/10",
  required: "text-amber-400 bg-amber-400/10 border border-amber-400/20",
  check_locally: "text-blue-400 bg-blue-400/10 border border-blue-400/20",
};

const trailLabel: Record<string, string> = {
  open: "Open",
  caution: "Caution",
  closed: "Closed",
};

const permitLabel: Record<string, string> = {
  not_required: "No Permit",
  required: "Permit Req.",
  check_locally: "Check Locally",
};

function StatusBadge({ value, map, labelMap }: { value: string | null; map: Record<string, string>; labelMap: Record<string, string> }) {
  if (!value) {
    return (
      <span className="text-xs font-medium px-2.5 py-1 rounded-full text-white/25 bg-white/3 border border-white/8">
        Not refreshed
      </span>
    );
  }
  const cls = map[value] ?? "text-white/40 bg-white/5 border border-white/10";
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cls}`}>
      {labelMap[value] ?? value}
    </span>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon,
  value,
  label,
  sub,
  color = "text-accent",
  bg = "bg-accent/10",
}: {
  icon: React.ElementType;
  value: number | string;
  label: string;
  sub?: string;
  color?: string;
  bg?: string;
}) {
  return (
    <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
      <div className={`${bg} w-8 h-8 rounded-lg flex items-center justify-center mb-3`}>
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <p className="text-white font-display text-2xl font-semibold leading-none mb-1">{value}</p>
      <p className="text-white/50 text-xs">{label}</p>
      {sub && <p className="text-white/25 text-xs mt-1">{sub}</p>}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminConditionsPage() {
  const [list, setList] = useState<ConditionsListOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [refreshing, setRefreshing] = useState<string | null>(null); // slug being refreshed

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchConditionsList();
      setList(data);
    } catch {
      setError("Could not load conditions list. Ensure the API is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function handleSeed() {
    setSeeding(true);
    setStatus(null);
    try {
      const r = await seedAllCoordinates();
      setStatus(`✓ Coordinates seeded: ${r.seeded} treks updated, ${r.skipped} already set.`);
      await load();
    } catch {
      setStatus("✗ Seed failed — check API logs.");
    } finally {
      setSeeding(false);
    }
  }

  async function handleRefreshAll() {
    setDispatching(true);
    setStatus(null);
    try {
      const r = await dispatchRefreshAll();
      setStatus(`✓ Refresh-all task dispatched (ID: ${r.task_id}). Celery worker will process all treks in background.`);
    } catch {
      setStatus("✗ Dispatch failed — ensure Celery worker is running.");
    } finally {
      setDispatching(false);
    }
  }

  async function handleRefreshRow(slug: string) {
    setRefreshing(slug);
    setStatus(null);
    try {
      await refreshSingleTrek(slug);
      setStatus(`✓ Refreshed conditions for ${slug}.`);
      await load();
    } catch {
      setStatus(`✗ Refresh failed for ${slug} — trek may have no coordinates.`);
    } finally {
      setRefreshing(null);
    }
  }

  async function handleSetCoords(slug: string, lat: number, lng: number) {
    try {
      await setTrekCoordinates(slug, lat, lng);
      setStatus(`✓ Coordinates saved for ${slug}. Click Refresh to fetch live weather.`);
      await load();
    } catch {
      setStatus(`✗ Failed to save coordinates for ${slug}.`);
    }
  }

  return (
    <div className="p-6 min-h-screen bg-[#0c0e14]">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Live Trek Conditions</h1>
          <p className="text-white/50 text-sm">
            Open-Meteo weather + trail/permit status — refreshed every 6 hours by Celery beat.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSeed}
              disabled={seeding}
              className="border-white/20 text-white/60 hover:text-white w-full sm:w-auto"
            >
              <MapPin className="h-3.5 w-3.5 mr-1.5" />
              {seeding ? "Seeding…" : "Seed Coordinates"}
            </Button>
            <Button
              variant="hero"
              size="sm"
              onClick={handleRefreshAll}
              disabled={dispatching}
              className="w-full sm:w-auto"
            >
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              {dispatching ? "Dispatching…" : "Refresh All"}
            </Button>
          </div>
          {status && (
            <p className={`text-xs px-3 py-1.5 rounded-lg max-w-sm text-right ${
              status.startsWith("✓")
                ? "text-pine bg-pine/10 border border-pine/20"
                : "text-red-400 bg-red-400/10 border border-red-400/20"
            }`}>
              {status}
            </p>
          )}
        </div>
      </div>

      {/* KPI row */}
      {list && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          <KpiCard
            icon={CloudSun}
            value={list.total}
            label="Total Trek Guides"
            sub="published trek_guide pages"
            color="text-sky-400"
            bg="bg-sky-400/10"
          />
          <KpiCard
            icon={MapPin}
            value={list.seeded}
            label="Coords Seeded"
            sub={`${list.total - list.seeded} without coordinates`}
            color="text-accent"
            bg="bg-accent/10"
          />
          <KpiCard
            icon={CheckCircle2}
            value={list.refreshed}
            label="Conditions Cached"
            sub={`${list.total - list.refreshed} never refreshed`}
            color="text-pine"
            bg="bg-pine/10"
          />
        </div>
      )}

      {/* Info callout — how to use */}
      <div className="bg-blue-400/5 border border-blue-400/15 rounded-xl px-4 py-3 mb-5 flex gap-3 items-start">
        <AlertCircle className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
        <div className="text-xs text-white/60 leading-relaxed">
          <strong className="text-white/80">First time?</strong>{" "}
          Click <strong className="text-white/80">Seed Coordinates</strong> to populate lat/lng for ~40 Himalayan treks from the built-in dictionary.
          Then click <strong className="text-white/80">Refresh All</strong> to dispatch the Celery task and fetch live weather from Open-Meteo.
          The beat scheduler repeats this every 6 hours automatically.
          Treks not in the dictionary can be added via the CMS trek_base_lat/trek_base_lng fields (coming soon).
        </div>
      </div>

      {/* Table */}
      {loading && (
        <div className="bg-[#14161f] rounded-2xl border border-white/10 p-10 text-center text-white/30 text-sm">
          Loading…
        </div>
      )}

      {error && (
        <div className="bg-red-400/5 border border-red-400/20 rounded-2xl p-6 text-red-400 text-sm text-center">
          {error}
        </div>
      )}

      {list && !loading && (
        <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
            <h2 className="text-white font-semibold text-sm">
              Trek Conditions — {list.total} treks
            </h2>
            <button
              onClick={load}
              className="text-white/40 hover:text-white/80 transition-colors"
              aria-label="Reload list"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[700px]">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Trek</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Coords</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden sm:table-cell">Weather</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Trail</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden md:table-cell">Permit</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden md:table-cell">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Last Refreshed</span>
                  </th>
                  <th className="text-right px-4 py-3 text-white/40 font-medium text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.rows.map((row) => (
                  <TrekRow
                    key={row.slug}
                    row={row}
                    refreshing={refreshing === row.slug}
                    onRefresh={() => void handleRefreshRow(row.slug)}
                    onSetCoords={(lat, lng) => void handleSetCoords(row.slug, lat, lng)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Table row ─────────────────────────────────────────────────────────────────

function TrekRow({
  row,
  refreshing,
  onRefresh,
  onSetCoords,
}: {
  row: ConditionAdminRow;
  refreshing: boolean;
  onRefresh: () => void;
  onSetCoords: (lat: number, lng: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [latVal, setLatVal] = useState(row.trek_base_lat?.toString() ?? "");
  const [lngVal, setLngVal] = useState(row.trek_base_lng?.toString() ?? "");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    const lat = parseFloat(latVal);
    const lng = parseFloat(lngVal);
    if (isNaN(lat) || isNaN(lng)) return;
    setSaving(true);
    onSetCoords(lat, lng);
    setSaving(false);
    setEditing(false);
  }

  return (
    <>
      <tr className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors">
        {/* Trek name */}
        <td className="px-4 py-3.5">
          <div>
            <p className="text-white/80 font-medium text-xs sm:text-sm leading-tight">{row.title}</p>
            <p className="text-white/30 text-[10px] mt-0.5 font-mono">{row.slug}</p>
          </div>
        </td>

        {/* Coords status */}
        <td className="px-4 py-3.5">
          {row.coords_seeded ? (
            <div>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-pine">
                <CheckCircle2 className="h-3 w-3" /> Seeded
              </span>
              {row.trek_base_lat !== null && (
                <p className="text-white/20 text-[10px] font-mono mt-0.5">
                  {row.trek_base_lat.toFixed(4)}, {row.trek_base_lng?.toFixed(4)}
                </p>
              )}
            </div>
          ) : (
            <button
              onClick={() => setEditing((e) => !e)}
              className="inline-flex items-center gap-1 text-xs font-medium text-amber-400 hover:text-amber-300 transition-colors"
              title="Click to set coordinates manually"
            >
              <Edit2 className="h-3 w-3" /> Set Coords
            </button>
          )}
        </td>

        {/* Weather label */}
        <td className="px-4 py-3.5 hidden sm:table-cell">
          <span className="text-white/50 text-xs">
            {row.weather_label ?? <span className="text-white/20">—</span>}
          </span>
        </td>

        {/* Trail status */}
        <td className="px-4 py-3.5">
          <StatusBadge value={row.trail_status} map={trailStyle} labelMap={trailLabel} />
        </td>

        {/* Permit */}
        <td className="px-4 py-3.5 hidden md:table-cell">
          <StatusBadge value={row.permit_status} map={permitStyle} labelMap={permitLabel} />
        </td>

        {/* Last refreshed */}
        <td className="px-4 py-3.5 hidden md:table-cell">
          <span className="text-white/40 text-xs" title={fmt(row.last_updated_at)}>
            {relativeTime(row.last_updated_at)}
          </span>
        </td>

        {/* Actions */}
        <td className="px-4 py-3.5 text-right">
          <div className="flex items-center justify-end gap-3">
            {!row.coords_seeded && (
              <button
                onClick={() => setEditing((e) => !e)}
                className="inline-flex items-center gap-1 text-xs font-medium text-white/30 hover:text-white/60 transition-colors"
                title="Set coordinates"
              >
                <MapPin className="h-3 w-3" />
              </button>
            )}
            <button
              onClick={onRefresh}
              disabled={refreshing || !row.coords_seeded}
              className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent/80 disabled:text-white/20 disabled:cursor-not-allowed transition-colors"
              title={!row.coords_seeded ? "No coordinates — set coords first" : "Refresh conditions now"}
            >
              <RefreshCw className={`h-3 w-3 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "…" : "Refresh"}
            </button>
          </div>
        </td>
      </tr>

      {/* Inline coords editor row */}
      {editing && (
        <tr className="border-b border-white/5 bg-amber-400/[0.03]">
          <td colSpan={7} className="px-4 py-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
              <span className="text-xs text-white/50 shrink-0">Set coordinates for <span className="font-mono text-white/70">{row.slug}</span>:</span>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="number"
                  step="0.0001"
                  placeholder="Latitude (e.g. 30.7333)"
                  value={latVal}
                  onChange={(e) => setLatVal(e.target.value)}
                  className="bg-white/5 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-400/40 w-44"
                />
                <input
                  type="number"
                  step="0.0001"
                  placeholder="Longitude (e.g. 78.4333)"
                  value={lngVal}
                  onChange={(e) => setLngVal(e.target.value)}
                  className="bg-white/5 border border-white/15 rounded-lg px-3 py-1.5 text-xs text-white/80 placeholder:text-white/20 focus:outline-none focus:border-amber-400/40 w-44"
                />
                <button
                  onClick={() => void handleSave()}
                  disabled={saving || !latVal || !lngVal}
                  className="inline-flex items-center gap-1.5 text-xs font-medium bg-amber-400/15 text-amber-400 border border-amber-400/25 hover:bg-amber-400/25 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Save className="h-3 w-3" />
                  {saving ? "Saving…" : "Save"}
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="inline-flex items-center gap-1 text-xs text-white/30 hover:text-white/60 transition-colors"
                >
                  <X className="h-3 w-3" /> Cancel
                </button>
              </div>
              <p className="text-[10px] text-white/25 sm:ml-auto">
                Find coordinates: search trek name on <a href="https://www.latlong.net" target="_blank" rel="noopener noreferrer" className="underline hover:text-white/40">latlong.net</a>
              </p>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
