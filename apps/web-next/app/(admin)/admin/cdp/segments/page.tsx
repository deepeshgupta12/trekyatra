"use client";

import { useEffect, useState } from "react";

interface Segment {
  name: string;
  description: string;
  user_count: number;
  filter_criteria: Record<string, unknown>;
}

export default function CdpSegmentsPage() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/v1/admin/cdp/segments", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setSegments(d.segments ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-white mb-1">Segments</h1>
        <p className="text-white/50 text-sm">Pre-defined audience segments based on behaviour traits.</p>
      </div>

      {loading ? (
        <div className="text-white/30 text-sm">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {segments.map((seg) => (
            <div key={seg.name} className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-white font-semibold text-sm leading-tight">{seg.name}</h3>
                <span className="text-2xl font-display font-bold text-accent ml-3 flex-shrink-0">
                  {seg.user_count.toLocaleString()}
                </span>
              </div>
              <p className="text-white/40 text-xs leading-relaxed">{seg.description}</p>
              <div className="mt-3 pt-3 border-t border-white/8">
                <p className="text-white/20 text-[10px] font-mono">
                  {JSON.stringify(seg.filter_criteria)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
