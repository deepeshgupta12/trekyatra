"use client";

import { useState } from "react";
import { Search, User, Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActivityEvent {
  id: string;
  event_category: string;
  event_name: string;
  properties: Record<string, unknown>;
  page_url: string | null;
  page_title: string | null;
  created_at: string;
}

interface UserActivity {
  email: string | null;
  full_name: string | null;
  anonymous_id: string | null;
  user_id: string | null;
  signed_up_at: string | null;
  total_events: number;
  events: ActivityEvent[];
  page: number;
  page_size: number;
  total: number;
}

const CATEGORY_STYLE: Record<string, string> = {
  conversion: "text-pine bg-pine/10 border border-pine/20",
  engagement: "text-blue-400 bg-blue-400/10 border border-blue-400/20",
  navigation: "text-white/50 bg-white/5 border border-white/10",
};

function categoryStyle(cat: string) {
  return CATEGORY_STYLE[cat] ?? "text-white/50 bg-white/5 border border-white/10";
}

function formatEventLabel(name: string): string {
  return name.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatProperties(props: Record<string, unknown>): string {
  const relevant = Object.entries(props)
    .filter(([, v]) => v !== null && v !== undefined && v !== "")
    .slice(0, 3)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join(" · ");
  return relevant;
}

function formatDateTime(iso: string): { date: string; time: string } {
  try {
    const d = new Date(iso);
    return {
      date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
    };
  } catch {
    return { date: iso, time: "" };
  }
}

export default function UserActivityPage() {
  const [email, setEmail] = useState("");
  const [query, setQuery] = useState("");
  const [data, setData] = useState<UserActivity | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState("");

  async function lookup(targetEmail: string, targetPage = 1) {
    if (!targetEmail.trim()) return;
    setLoading(true);
    setNotFound(false);
    try {
      const params = new URLSearchParams({ email: targetEmail, page: String(targetPage), page_size: "50" });
      if (categoryFilter) params.set("category", categoryFilter);
      const res = await fetch(`/api/v1/admin/cdp/users/activity?${params}`, { credentials: "include" });
      if (res.status === 404) { setNotFound(true); setData(null); setLoading(false); return; }
      const d = await res.json();
      setData(d);
      setPage(targetPage);
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setQuery(email);
    lookup(email, 1);
  }

  const totalPages = data ? Math.ceil(data.total / data.page_size) : 0;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">User Activity</h1>
          <p className="text-white/50 text-sm">Full chronological event timeline for any user.</p>
        </div>
      </div>

      {/* Search card */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5 mb-5">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
            <input
              type="email"
              placeholder="user@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-accent/50"
            />
          </div>
          <Button type="submit" variant="hero" size="sm" disabled={loading || !email.trim()} className="w-full sm:w-auto">
            {loading ? "Looking up…" : "Look up"}
          </Button>
        </form>
      </div>

      {/* Not found */}
      {notFound && (
        <div className="bg-[#14161f] rounded-2xl border border-white/10 p-8 text-center">
          <User className="h-8 w-8 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">No user found for <span className="text-white/60">{query}</span>.</p>
        </div>
      )}

      {/* User profile + timeline */}
      {data && (
        <>
          {/* Profile card */}
          <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5 mb-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{data.full_name ?? "—"}</p>
                  <p className="text-white/50 text-xs">{data.email}</p>
                </div>
              </div>
              <div className="flex flex-wrap gap-4">
                <div>
                  <p className="text-white/30 text-[10px] uppercase tracking-wide">User ID</p>
                  <p className="text-white/60 text-xs font-mono">{data.user_id?.slice(0, 8) ?? "—"}…</p>
                </div>
                <div>
                  <p className="text-white/30 text-[10px] uppercase tracking-wide">Signed up</p>
                  <p className="text-white/60 text-xs">{data.signed_up_at ? new Date(data.signed_up_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}</p>
                </div>
                <div>
                  <p className="text-white/30 text-[10px] uppercase tracking-wide">Total Events</p>
                  <p className="text-accent font-semibold text-sm">{data.total.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <span className="text-xs text-white/40">Filter:</span>
            {["", "conversion", "engagement", "navigation"].map((cat) => (
              <button
                key={cat || "all"}
                onClick={() => { setCategoryFilter(cat); lookup(query, 1); }}
                className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                  categoryFilter === cat
                    ? "bg-accent/20 text-accent border-accent/30"
                    : "bg-white/5 text-white/40 border-white/10 hover:text-white/70"
                }`}
              >
                {cat || "All"}
              </button>
            ))}
          </div>

          {/* Timeline */}
          <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
              <h2 className="text-white font-semibold text-sm">Activity Timeline</h2>
              <span className="text-xs text-white/40">
                {data.total.toLocaleString()} events · page {page}/{totalPages || 1}
              </span>
            </div>

            {data.events.length === 0 ? (
              <div className="p-8 text-center text-white/30 text-sm">No events found.</div>
            ) : (
              <div className="divide-y divide-white/5">
                {data.events.map((ev) => {
                  const { date, time } = formatDateTime(ev.created_at);
                  const props = formatProperties(ev.properties);
                  return (
                    <div key={ev.id} className="flex items-start gap-3 px-5 py-3 hover:bg-white/2 transition-colors">
                      {/* Date/time */}
                      <div className="flex-shrink-0 w-28 text-right">
                        <p className="text-white/50 text-[11px]">{date}</p>
                        <p className="text-white/25 text-[10px]">{time}</p>
                      </div>
                      {/* Dot */}
                      <div className="flex-shrink-0 mt-1.5">
                        <div className="w-2 h-2 rounded-full bg-white/20" />
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${categoryStyle(ev.event_category)}`}>
                            {ev.event_category}
                          </span>
                          <span className="text-white/80 text-xs font-medium">{formatEventLabel(ev.event_name)}</span>
                        </div>
                        {props && (
                          <p className="text-white/30 text-[10px] mt-0.5 truncate">{props}</p>
                        )}
                        {ev.page_url && (
                          <p className="text-white/20 text-[10px] mt-0.5 truncate">{ev.page_url}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-white/8">
                <button
                  onClick={() => lookup(query, page - 1)}
                  disabled={page <= 1}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous
                </button>
                <div className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-white/20" />
                  <span className="text-xs text-white/30">Page {page} of {totalPages}</span>
                </div>
                <button
                  onClick={() => lookup(query, page + 1)}
                  disabled={page >= totalPages}
                  className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/70 disabled:opacity-30 transition-colors"
                >
                  Next <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
