"use client";

import { useEffect, useState, useCallback } from "react";

interface EventRow {
  id: string;
  anonymous_id: string;
  user_id: string | null;
  event_category: string;
  event_name: string;
  event_value: number | null;
  page_url: string | null;
  properties: Record<string, unknown>;
  created_at: string;
}

const CATEGORIES = ["navigation", "engagement", "conversion", "system"];

function fmt(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function CdpEventsPage() {
  const [events, setEvents] = useState<EventRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [category, setCategory] = useState("");
  const [eventName, setEventName] = useState("");
  const [debouncedName, setDebouncedName] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedName(eventName), 400);
    return () => clearTimeout(t);
  }, [eventName]);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), page_size: "100" });
    if (category) params.set("category", category);
    if (debouncedName) params.set("event_name", debouncedName);
    fetch(`/api/v1/admin/cdp/events/stream?${params}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setEvents(d.events ?? []); setTotal(d.total ?? 0); setLoading(false); })
      .catch(() => setLoading(false));
  }, [page, category, debouncedName]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / 100);

  const categoryColor: Record<string, string> = {
    navigation: "text-blue-400 bg-blue-400/10",
    engagement: "text-pine bg-pine/10",
    conversion: "text-accent bg-accent/10",
    system: "text-white/40 bg-white/5",
  };

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Event Stream</h1>
          <p className="text-white/50 text-sm">Live feed of all analytics events — latest first.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-white/30 text-xs">{total.toLocaleString()} total</span>
          <button onClick={load} className="text-white/50 hover:text-white text-xs border border-white/10 rounded-lg px-3 py-1.5 transition-colors">Refresh</button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="flex gap-1.5 flex-wrap">
          <button
            onClick={() => { setCategory(""); setPage(1); }}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${!category ? "bg-accent/15 text-accent border-accent/20" : "text-white/40 border-white/10 hover:text-white"}`}
          >All</button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => { setCategory(c); setPage(1); }}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${category === c ? "bg-accent/15 text-accent border-accent/20" : "text-white/40 border-white/10 hover:text-white"}`}
            >{c}</button>
          ))}
        </div>
        <input
          className="w-full sm:w-48 bg-[#14161f] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
          placeholder="Filter by event name…"
          value={eventName}
          onChange={(e) => { setEventName(e.target.value); setPage(1); }}
        />
      </div>

      <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[560px]">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Time</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Event</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden md:table-cell">Page</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden lg:table-cell">User</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-white/30 text-sm">Loading…</td></tr>
              ) : events.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-8 text-center text-white/30 text-sm">No events yet.</td></tr>
              ) : events.map((e) => (
                <tr key={e.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                  <td className="px-4 py-3 text-white/30 text-xs whitespace-nowrap">{fmt(e.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className="text-white/80 text-xs font-medium">{e.event_name}</span>
                    <span className={`ml-2 text-[10px] font-medium px-1.5 py-0.5 rounded ${categoryColor[e.event_category] ?? "text-white/30 bg-white/5"}`}>
                      {e.event_category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white/30 text-xs max-w-[200px] truncate hidden md:table-cell">{e.page_url ?? "—"}</td>
                  <td className="px-4 py-3 text-white/30 text-xs font-mono hidden lg:table-cell">
                    {e.user_id ? e.user_id.slice(0, 8) + "…" : e.anonymous_id.slice(0, 12) + "…"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button disabled={page === 1} onClick={() => setPage((p) => p - 1)} className="text-white/50 hover:text-white disabled:opacity-30 text-sm transition-colors">← Previous</button>
          <span className="text-white/30 text-xs">Page {page} of {totalPages}</span>
          <button disabled={page === totalPages} onClick={() => setPage((p) => p + 1)} className="text-white/50 hover:text-white disabled:opacity-30 text-sm transition-colors">Next →</button>
        </div>
      )}
    </div>
  );
}
