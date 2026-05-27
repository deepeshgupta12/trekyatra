"use client";

import { useEffect, useState } from "react";

const FUNNELS = [
  { name: "trek_discovery_to_signup", label: "Trek Discovery → Signup" },
  { name: "search_to_conversion", label: "Search → Conversion" },
  { name: "news_to_engagement", label: "News → Engagement" },
];

interface FunnelStep {
  step: number;
  event_name: string;
  users: number;
  drop_off_pct: number | null;
}

interface FunnelData {
  name: string;
  steps: FunnelStep[];
  overall_conversion_pct: number;
}

export default function CdpFunnelsPage() {
  const [selected, setSelected] = useState(FUNNELS[0].name);
  const [data, setData] = useState<FunnelData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/admin/cdp/funnels/${selected}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [selected]);

  const maxUsers = data?.steps[0]?.users ?? 1;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Funnels</h1>
          <p className="text-white/50 text-sm">Conversion funnel analysis across key user journeys.</p>
        </div>
        {data && (
          <span className="text-pine text-sm font-medium">{data.overall_conversion_pct}% overall</span>
        )}
      </div>

      {/* Funnel selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {FUNNELS.map((f) => (
          <button
            key={f.name}
            onClick={() => setSelected(f.name)}
            className={`text-sm px-4 py-2 rounded-xl border transition-all ${
              selected === f.name
                ? "bg-accent/15 text-accent border-accent/20 font-semibold"
                : "text-white/50 border-white/10 hover:text-white hover:border-white/20"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-white/30 text-sm">Loading…</div>
      ) : !data?.steps.length ? (
        <div className="text-white/30 text-sm">No data.</div>
      ) : (
        <div className="space-y-3">
          {data.steps.map((step, idx) => {
            const widthPct = maxUsers > 0 ? (step.users / maxUsers) * 100 : 0;
            return (
              <div key={step.step} className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-white/30 text-xs font-mono w-5 text-right">{idx + 1}</span>
                    <span className="text-white/80 text-sm font-medium">{step.event_name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-white font-semibold text-sm">{step.users.toLocaleString()}</span>
                    {step.drop_off_pct !== null && (
                      <span className="text-red-400 text-xs">↓ {step.drop_off_pct}% drop</span>
                    )}
                  </div>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
