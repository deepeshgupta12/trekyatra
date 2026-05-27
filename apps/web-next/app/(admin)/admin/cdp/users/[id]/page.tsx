"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface Trait {
  total_sessions: number;
  total_events: number;
  total_page_views: number;
  first_seen_at: string | null;
  last_seen_at: string | null;
  acquisition_source: string | null;
  acquisition_medium: string | null;
  viewed_treks: string[];
  searched_queries: string[];
  plan_wizard_started: boolean;
  plan_wizard_completed: boolean;
  signed_up_at: string | null;
  countries: string[];
  device_types_used: string[];
}

interface Session {
  id: string;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number | null;
  page_count: number;
  event_count: number;
  converted: boolean;
  landing_page: string | null;
  utm_source: string | null;
}

interface Event {
  id: string;
  event_category: string;
  event_name: string;
  event_value: number | null;
  page_url: string | null;
  created_at: string;
}

interface UserProfile {
  user_id: string;
  email: string | null;
  full_name: string | null;
  traits: Trait | null;
  recent_events: Event[];
  sessions: Session[];
}

function fmt(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export default function CdpUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/v1/admin/cdp/users/${id}`, { credentials: "include" })
      .then((r) => {
        if (r.status === 404) { setNotFound(true); setLoading(false); return null; }
        return r.json();
      })
      .then((d) => { if (d) { setProfile(d); setLoading(false); } })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-white/40 text-sm p-8">Loading…</div>;
  if (notFound) return (
    <div className="text-center py-16">
      <p className="text-white/40 text-sm mb-4">User not found.</p>
      <Link href="/admin/cdp/users" className="text-accent text-sm hover:underline">← Back to users</Link>
    </div>
  );
  if (!profile) return null;

  const t = profile.traits;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/cdp/users" className="text-white/40 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-semibold text-white">
            {profile.full_name ?? profile.email ?? "Anonymous User"}
          </h1>
          <p className="text-white/40 text-sm">{profile.email ?? profile.user_id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Traits summary */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
            <h2 className="text-white font-semibold text-sm mb-4">Profile</h2>
            <dl className="space-y-2.5 text-sm">
              {[
                ["Sessions", t?.total_sessions ?? 0],
                ["Events", t?.total_events ?? 0],
                ["Page views", t?.total_page_views ?? 0],
                ["Source", t?.acquisition_source ?? "direct"],
                ["Medium", t?.acquisition_medium ?? "—"],
                ["First seen", fmt(t?.first_seen_at ?? null)],
                ["Last seen", fmt(t?.last_seen_at ?? null)],
                ["Signed up", fmt(t?.signed_up_at ?? null)],
                ["Countries", (t?.countries ?? []).join(", ") || "—"],
                ["Devices", (t?.device_types_used ?? []).join(", ") || "—"],
              ].map(([k, v]) => (
                <div key={String(k)} className="flex justify-between gap-2">
                  <dt className="text-white/40">{k}</dt>
                  <dd className="text-white/80 text-right">{String(v)}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
            <h2 className="text-white font-semibold text-sm mb-3">Funnel Status</h2>
            <div className="space-y-2">
              {[
                ["Plan Wizard Started", t?.plan_wizard_started],
                ["Plan Wizard Completed", t?.plan_wizard_completed],
                ["Signed Up", !!t?.signed_up_at],
              ].map(([label, done]) => (
                <div key={String(label)} className="flex items-center justify-between">
                  <span className="text-white/50 text-xs">{String(label)}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${done ? "text-pine bg-pine/10" : "text-white/30 bg-white/5"}`}>
                    {done ? "Yes" : "No"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {(t?.viewed_treks ?? []).length > 0 && (
            <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
              <h2 className="text-white font-semibold text-sm mb-3">Viewed Treks</h2>
              <div className="flex flex-wrap gap-1.5">
                {t!.viewed_treks.slice(0, 10).map((slug) => (
                  <span key={slug} className="text-[10px] text-white/50 bg-white/5 px-2 py-1 rounded-lg">{slug}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sessions + Events */}
        <div className="lg:col-span-2 space-y-4">
          {/* Sessions */}
          <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
              <h2 className="text-white font-semibold text-sm">Recent Sessions</h2>
              <span className="text-white/30 text-xs">{profile.sessions.length} shown</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[400px]">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-4 py-2.5 text-white/30 font-medium text-xs">Started</th>
                    <th className="text-left px-4 py-2.5 text-white/30 font-medium text-xs">Pages</th>
                    <th className="text-left px-4 py-2.5 text-white/30 font-medium text-xs">Events</th>
                    <th className="text-left px-4 py-2.5 text-white/30 font-medium text-xs">Source</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.sessions.length === 0 ? (
                    <tr><td colSpan={4} className="px-4 py-4 text-white/20 text-xs">No sessions.</td></tr>
                  ) : profile.sessions.map((s) => (
                    <tr key={s.id} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-2.5 text-white/60 text-xs">{fmt(s.started_at)}</td>
                      <td className="px-4 py-2.5 text-white/60 text-xs">{s.page_count}</td>
                      <td className="px-4 py-2.5 text-white/60 text-xs">{s.event_count}</td>
                      <td className="px-4 py-2.5 text-white/40 text-xs">{s.utm_source ?? "direct"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Events */}
          <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
              <h2 className="text-white font-semibold text-sm">Recent Events</h2>
              <span className="text-white/30 text-xs">{profile.recent_events.length} shown</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[400px]">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left px-4 py-2.5 text-white/30 font-medium text-xs">Event</th>
                    <th className="text-left px-4 py-2.5 text-white/30 font-medium text-xs hidden sm:table-cell">Page</th>
                    <th className="text-left px-4 py-2.5 text-white/30 font-medium text-xs">Time</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.recent_events.length === 0 ? (
                    <tr><td colSpan={3} className="px-4 py-4 text-white/20 text-xs">No events.</td></tr>
                  ) : profile.recent_events.map((e) => (
                    <tr key={e.id} className="border-b border-white/5 last:border-0">
                      <td className="px-4 py-2.5">
                        <span className="text-white/70 text-xs">{e.event_name}</span>
                        <span className="ml-1.5 text-white/30 text-[10px]">{e.event_category}</span>
                      </td>
                      <td className="px-4 py-2.5 text-white/30 text-xs truncate max-w-[180px] hidden sm:table-cell">{e.page_url ?? "—"}</td>
                      <td className="px-4 py-2.5 text-white/30 text-xs">{fmt(e.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
