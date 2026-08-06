"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface UserRow {
  user_id: string | null;
  anonymous_id: string | null;
  email: string | null;
  full_name: string | null;
  total_sessions: number;
  total_events: number;
  first_seen_at: string | null;
  last_seen_at: string | null;
  acquisition_source: string | null;
  signed_up_at: string | null;
  lifecycle_stage: string | null;
  engagement_score: number | null;
  lead_score: number | null;
}

// Lifecycle badge colours — align with the admin status-badge palette (see root CLAUDE.md §15).
const lifecycleStyle: Record<string, string> = {
  new: "text-blue-400 bg-blue-400/10 border border-blue-400/20",
  active: "text-pine bg-pine/10 border border-pine/20",
  dormant: "text-amber-400 bg-amber-400/10 border border-amber-400/20",
  churned: "text-red-400 bg-red-400/10 border border-red-400/20",
};

function LifecycleBadge({ stage }: { stage: string | null }) {
  if (!stage) return <span className="text-white/20 text-xs">—</span>;
  const cls = lifecycleStyle[stage] ?? "text-white/40 bg-white/5 border border-white/10";
  return <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cls}`}>{stage}</span>;
}

// Lead score → colour by intent band (0–100).
function LeadScore({ score }: { score: number | null }) {
  if (score == null) return <span className="text-white/20 text-xs">—</span>;
  const color = score >= 60 ? "text-pine" : score >= 30 ? "text-amber-400" : "text-white/50";
  return <span className={`text-xs font-semibold tabular-nums ${color}`}>{score}</span>;
}

interface UserList {
  users: UserRow[];
  total: number;
  page: number;
  page_size: number;
}

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export default function CdpUsersPage() {
  const [data, setData] = useState<UserList | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), page_size: "50" });
    if (debouncedSearch) params.set("search", debouncedSearch);
    fetch(`/api/v1/admin/cdp/users?${params}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [page, debouncedSearch]);

  const totalPages = data ? Math.ceil(data.total / 50) : 0;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Users</h1>
          <p className="text-white/50 text-sm">All tracked users — anonymous and registered.</p>
        </div>
        <p className="text-white/40 text-sm">{data?.total.toLocaleString() ?? "—"} total</p>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          className="w-full sm:w-72 bg-[#14161f] border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
          placeholder="Search by email..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
        />
      </div>

      <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-white/8">
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">User</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Lifecycle</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Lead</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden sm:table-cell">Source</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Sessions</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden md:table-cell">Events</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden lg:table-cell">First seen</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden lg:table-cell">Last seen</th>
                <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Signed up</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-white/30 text-sm">Loading…</td></tr>
              ) : !data?.users.length ? (
                <tr><td colSpan={9} className="px-4 py-8 text-center text-white/30 text-sm">No users yet.</td></tr>
              ) : (
                data.users.map((u, i) => (
                  <tr key={u.user_id ?? u.anonymous_id ?? i} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3.5">
                      {u.user_id ? (
                        <Link href={`/admin/cdp/users/${u.user_id}`} className="text-accent text-xs font-medium hover:underline">
                          {u.email ?? u.full_name ?? "User"}
                        </Link>
                      ) : (
                        <span className="text-white/40 text-xs font-mono">{(u.anonymous_id ?? "").slice(0, 16)}…</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5"><LifecycleBadge stage={u.lifecycle_stage} /></td>
                    <td className="px-4 py-3.5"><LeadScore score={u.lead_score} /></td>
                    <td className="px-4 py-3.5 text-white/50 text-xs hidden sm:table-cell">{u.acquisition_source ?? "direct"}</td>
                    <td className="px-4 py-3.5 text-white/80 text-xs">{u.total_sessions}</td>
                    <td className="px-4 py-3.5 text-white/50 text-xs hidden md:table-cell">{u.total_events}</td>
                    <td className="px-4 py-3.5 text-white/40 text-xs hidden lg:table-cell">{fmt(u.first_seen_at)}</td>
                    <td className="px-4 py-3.5 text-white/40 text-xs hidden lg:table-cell">{fmt(u.last_seen_at)}</td>
                    <td className="px-4 py-3.5 text-xs">
                      {u.signed_up_at ? (
                        <span className="text-pine text-xs">{fmt(u.signed_up_at)}</span>
                      ) : (
                        <span className="text-white/20 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="text-white/50 hover:text-white disabled:opacity-30 text-sm transition-colors"
          >
            ← Previous
          </button>
          <span className="text-white/30 text-xs">Page {page} of {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="text-white/50 hover:text-white disabled:opacity-30 text-sm transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
