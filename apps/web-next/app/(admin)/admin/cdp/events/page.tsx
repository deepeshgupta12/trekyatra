"use client";

import { useEffect, useState, useCallback } from "react";
import { Download, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EventItem {
  id: string;
  anonymous_id: string;
  user_id?: string;
  session_id?: string;
  event_category: string;
  event_name: string;
  event_value?: number;
  page_url?: string;
  page_title?: string;
  properties: Record<string, unknown>;
  device_type?: string;
  browser?: string;
  country?: string;
  is_internal: boolean;
  created_at: string;
}

interface EventsResponse {
  events: EventItem[];
  total: number;
  page: number;
  page_size: number;
}

interface CatalogItem { event_name: string; event_category: string; count: number }

const CATEGORIES = ["navigation", "engagement", "conversion", "system"];

const catColor: Record<string, string> = {
  navigation: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  engagement: "text-accent bg-accent/10 border-accent/20",
  conversion: "text-pine bg-pine/10 border-pine/20",
  system: "text-purple-400 bg-purple-400/10 border-purple-400/20",
};

export default function EventExplorerPage() {
  const [data, setData] = useState<EventsResponse | null>(null);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const [category, setCategory] = useState("");
  const [eventName, setEventName] = useState("");
  const [anonymousId, setAnonymousId] = useState("");
  const [pageUrlContains, setPageUrlContains] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [excludeInternal, setExcludeInternal] = useState(true);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  const buildQuery = useCallback(() => {
    const q = new URLSearchParams();
    if (category) q.set("category", category);
    if (eventName) q.set("event_name", eventName);
    if (anonymousId) q.set("anonymous_id", anonymousId);
    if (pageUrlContains) q.set("page_url_contains", pageUrlContains);
    if (dateFrom) q.set("date_from", dateFrom);
    if (dateTo) q.set("date_to", dateTo);
    q.set("exclude_internal", String(excludeInternal));
    q.set("page", String(page));
    q.set("page_size", String(PAGE_SIZE));
    return q.toString();
  }, [category, eventName, anonymousId, pageUrlContains, dateFrom, dateTo, excludeInternal, page]);

  const fetchEvents = useCallback(() => {
    setLoading(true);
    fetch(`/api/v1/admin/cdp/events?${buildQuery()}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d: EventsResponse) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [buildQuery]);

  useEffect(() => {
    fetch("/api/v1/admin/cdp/events/catalog", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { events: CatalogItem[] }) => setCatalog(d.events ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  const handleExport = () => {
    const q = new URLSearchParams();
    if (category) q.set("category", category);
    if (eventName) q.set("event_name", eventName);
    if (dateFrom) q.set("date_from", dateFrom);
    if (dateTo) q.set("date_to", dateTo);
    q.set("exclude_internal", String(excludeInternal));
    window.location.href = `/api/v1/admin/cdp/events/export?${q.toString()}`;
  };

  const resetFilters = () => {
    setCategory(""); setEventName(""); setAnonymousId("");
    setPageUrlContains(""); setDateFrom(""); setDateTo("");
    setExcludeInternal(true); setPage(1);
  };

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div className="min-h-screen bg-[#0c0e14] text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-semibold text-white mb-1">Event Explorer</h1>
            <p className="text-white/50 text-sm">Search, filter, and export analytics events.</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="border-white/20 text-white/60 hover:text-white w-fit">
            <Download className="h-3.5 w-3.5 mr-1.5" /> Export CSV
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-white/40" />
            <span className="text-white/70 text-sm font-medium">Filters</span>
            <button onClick={resetFilters} className="ml-auto text-xs text-white/30 hover:text-white/60 flex items-center gap-1">
              <X className="h-3 w-3" /> Reset
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <select
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="">All categories</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <select
              value={eventName}
              onChange={(e) => { setEventName(e.target.value); setPage(1); }}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            >
              <option value="">All events</option>
              {catalog.map((e) => (
                <option key={e.event_name} value={e.event_name}>{e.event_name} ({e.count})</option>
              ))}
            </select>
            <input
              value={anonymousId}
              onChange={(e) => { setAnonymousId(e.target.value); setPage(1); }}
              placeholder="anonymous_id…"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30"
            />
            <input
              value={pageUrlContains}
              onChange={(e) => { setPageUrlContains(e.target.value); setPage(1); }}
              placeholder="Page URL contains…"
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30"
            />
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white" />
            <label className="flex items-center gap-2 text-xs text-white/50 cursor-pointer">
              <input type="checkbox" checked={excludeInternal}
                onChange={(e) => { setExcludeInternal(e.target.checked); setPage(1); }}
                className="accent-accent" />
              Exclude internal
            </label>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
            <h2 className="text-white font-semibold text-sm">
              {loading ? "Loading…" : `${(data?.total ?? 0).toLocaleString()} events`}
            </h2>
            {totalPages > 1 && (
              <div className="flex items-center gap-2 text-xs text-white/40">
                <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="disabled:opacity-30 hover:text-white">← prev</button>
                <span>page {page} / {totalPages}</span>
                <button disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="disabled:opacity-30 hover:text-white">next →</button>
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Timestamp</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Category</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Event</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden md:table-cell">User</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden lg:table-cell">Page URL</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden lg:table-cell">Properties</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-white/30 text-sm">Loading…</td></tr>
                )}
                {!loading && (!data?.events || data.events.length === 0) && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-white/30 text-sm">No events matching this filter.</td></tr>
                )}
                {!loading && data?.events?.map((ev) => (
                  <>
                    <tr
                      key={ev.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(expandedId === ev.id ? null : ev.id)}
                    >
                      <td className="px-4 py-3 text-white/50 text-xs font-mono">
                        {new Date(ev.created_at).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${catColor[ev.event_category] ?? "text-white/40 bg-white/5 border-white/10"}`}>
                          {ev.event_category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-white/80 text-xs font-medium">{ev.event_name}</td>
                      <td className="px-4 py-3 text-white/40 text-xs hidden md:table-cell">
                        <div className="truncate max-w-[120px]">{ev.anonymous_id}</div>
                      </td>
                      <td className="px-4 py-3 text-white/40 text-xs hidden lg:table-cell">
                        <div className="truncate max-w-[200px]">{ev.page_url ?? "—"}</div>
                      </td>
                      <td className="px-4 py-3 text-white/40 text-xs hidden lg:table-cell">
                        {Object.entries(ev.properties).slice(0, 2).map(([k, v]) => (
                          <span key={k} className="mr-2">{k}: <span className="text-white/50">{String(v)}</span></span>
                        ))}
                      </td>
                    </tr>
                    {expandedId === ev.id && (
                      <tr key={`${ev.id}-exp`} className="bg-white/3">
                        <td colSpan={6} className="px-6 py-3">
                          <pre className="text-xs text-white/60 font-mono overflow-x-auto whitespace-pre-wrap break-all">
                            {JSON.stringify(ev, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
