"use client";

import { useEffect, useState } from "react";
import { Users, TrendingUp } from "lucide-react";

interface Segment {
  name: string;
  description: string;
  criteria_label: string;
  user_count: number;
  filter_criteria: Record<string, unknown>;
}

const SEGMENT_ICONS: Record<string, string> = {
  "Active Explorers": "🏔️",
  "Plan Starters": "🗺️",
  "New Signups (7d)": "✨",
  "Organic Search Visitors": "🔍",
  "High Engagement": "🔥",
  "Returning Visitors": "🔄",
  "Mobile-First Users": "📱",
  "Plan Wizard Completors": "✅",
  "Content Readers": "📖",
  "Search-Engaged": "🎯",
};

export default function CdpSegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/admin/cdp/segments", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setSegments(d.segments ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const total = segments.reduce((acc, s) => acc + s.user_count, 0);

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Segments</h1>
          <p className="text-white/50 text-sm">Audience segments based on behaviour — {segments.length} segments defined.</p>
        </div>
        {!loading && (
          <div className="bg-[#14161f] border border-white/10 rounded-xl px-4 py-2.5 flex items-center gap-2 w-fit">
            <Users className="h-4 w-4 text-accent" />
            <span className="text-white font-semibold text-sm">{total.toLocaleString()}</span>
            <span className="text-white/40 text-xs">total across segments</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-white/30 text-sm">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {segments.map((seg) => (
            <div key={seg.name} className="bg-[#14161f] rounded-2xl border border-white/10 p-5 flex flex-col">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl leading-none">{SEGMENT_ICONS[seg.name] ?? "👥"}</span>
                  <h3 className="text-white font-semibold text-sm leading-tight">{seg.name}</h3>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-2xl font-display font-bold text-accent leading-none">
                    {seg.user_count.toLocaleString()}
                  </p>
                  <p className="text-white/30 text-[10px] mt-0.5">users</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-white/50 text-xs leading-relaxed flex-1">{seg.description}</p>

              {/* Criteria label */}
              <div className="mt-3 pt-3 border-t border-white/8 flex items-start gap-1.5">
                <TrendingUp className="h-3 w-3 text-white/25 flex-shrink-0 mt-0.5" />
                <p className="text-white/35 text-[11px] font-mono leading-relaxed">{seg.criteria_label}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
