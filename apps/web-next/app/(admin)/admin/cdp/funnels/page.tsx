"use client";

import { useEffect, useState } from "react";
import { Plus, X, Play, GitMerge, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

const API = "/api/v1";

interface CatalogEvent {
  event_name: string;
  event_category: string;
  count: number;
}

interface FunnelStep {
  event_name: string;
  event_category: string;
}

interface FunnelStepResult {
  step: number;
  event_name: string;
  users: number;
  drop_off_pct: number | null;
}

interface FunnelResult {
  steps: FunnelStepResult[];
  overall_conversion_pct: number;
  count_type: string;
}

const COUNT_TYPE_OPTIONS = [
  { value: "unique_users", label: "Unique Users" },
  { value: "total_events", label: "Total Events" },
];

export default function FunnelsPage() {
  const [catalog, setCatalog] = useState<CatalogEvent[]>([]);
  const [steps, setSteps] = useState<FunnelStep[]>([
    { event_name: "", event_category: "" },
    { event_name: "", event_category: "" },
  ]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [countType, setCountType] = useState("unique_users");
  const [result, setResult] = useState<FunnelResult | null>(null);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/admin/cdp/events/catalog`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setCatalog(d.events ?? []))
      .catch(() => {});
  }, []);

  const uniqueEventNames = Array.from(new Set(catalog.map((e) => e.event_name)));
  const categoriesFor = (eventName: string) =>
    Array.from(new Set(catalog.filter((e) => e.event_name === eventName).map((e) => e.event_category)));

  function updateStep(idx: number, field: keyof FunnelStep, value: string) {
    setSteps((prev) => {
      const next = [...prev];
      if (field === "event_name") {
        next[idx] = { event_name: value, event_category: "" };
      } else {
        next[idx] = { ...next[idx], [field]: value };
      }
      return next;
    });
  }

  function addStep() {
    if (steps.length >= 8) return;
    setSteps((prev) => [...prev, { event_name: "", event_category: "" }]);
  }

  function removeStep(idx: number) {
    if (steps.length <= 2) return;
    setSteps((prev) => prev.filter((_, i) => i !== idx));
  }

  async function runFunnel() {
    const validSteps = steps.filter((s) => s.event_name.trim());
    if (validSteps.length < 2) {
      setError("Select at least 2 events to build a funnel.");
      return;
    }
    setError("");
    setRunning(true);
    try {
      const body: Record<string, unknown> = {
        steps: validSteps.map((s) => ({
          event_name: s.event_name,
          ...(s.event_category ? { event_category: s.event_category } : {}),
        })),
        count_type: countType,
      };
      if (dateFrom) body.date_from = dateFrom;
      if (dateTo) body.date_to = dateTo;
      const res = await fetch(`${API}/admin/cdp/funnels/dynamic`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("API error");
      setResult(await res.json());
    } catch {
      setError("Failed to run funnel. Please try again.");
    } finally {
      setRunning(false);
    }
  }

  const maxUsers = result ? Math.max(...result.steps.map((s) => s.users), 1) : 1;

  return (
    <div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Funnels</h1>
          <p className="text-white/50 text-sm">Build dynamic event-based funnels to measure conversion.</p>
        </div>
      </div>

      {/* Funnel builder */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5 mb-5">
        <h2 className="text-white font-semibold text-sm mb-4">Funnel Builder</h2>

        {/* Filters row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/40 font-medium">From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/40 font-medium">To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-accent/50"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-white/40 font-medium">Count by</label>
            <div className="relative">
              <select
                value={countType}
                onChange={(e) => setCountType(e.target.value)}
                className="appearance-none bg-white/5 border border-white/10 rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-accent/50"
              >
                {COUNT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-[#14161f]">{o.label}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Step rows */}
        <div className="space-y-3 mb-4">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-accent/20 text-accent text-[10px] font-semibold flex items-center justify-center flex-shrink-0">
                {idx + 1}
              </span>
              <div className="relative flex-1">
                <select
                  value={step.event_name}
                  onChange={(e) => updateStep(idx, "event_name", e.target.value)}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-lg pl-3 pr-8 py-2 text-sm text-white focus:outline-none focus:border-accent/50"
                >
                  <option value="" className="bg-[#14161f]">Select event…</option>
                  {uniqueEventNames.map((n) => (
                    <option key={n} value={n} className="bg-[#14161f]">{n}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40 pointer-events-none" />
              </div>
              <div className="relative w-40 hidden sm:block">
                <select
                  value={step.event_category}
                  onChange={(e) => updateStep(idx, "event_category", e.target.value)}
                  disabled={!step.event_name}
                  className="w-full appearance-none bg-white/5 border border-white/10 rounded-lg pl-3 pr-8 py-2 text-sm text-white/70 focus:outline-none focus:border-accent/50 disabled:opacity-40"
                >
                  <option value="" className="bg-[#14161f]">Any category</option>
                  {categoriesFor(step.event_name).map((c) => (
                    <option key={c} value={c} className="bg-[#14161f]">{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/40 pointer-events-none" />
              </div>
              <button
                onClick={() => removeStep(idx)}
                disabled={steps.length <= 2}
                className="text-white/30 hover:text-red-400 transition-colors disabled:opacity-20 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
          <button
            onClick={addStep}
            disabled={steps.length >= 8}
            className="flex items-center gap-1.5 text-xs text-white/50 hover:text-accent transition-colors disabled:opacity-30"
          >
            <Plus className="h-3.5 w-3.5" /> Add Step
          </button>
          <div className="sm:ml-auto flex flex-col sm:flex-row gap-2 items-start sm:items-center">
            {error && <p className="text-xs text-red-400">{error}</p>}
            <Button variant="hero" size="sm" onClick={runFunnel} disabled={running} className="w-full sm:w-auto">
              <Play className="h-3.5 w-3.5 mr-1.5" />
              {running ? "Running…" : "Run Funnel"}
            </Button>
          </div>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
            <h2 className="text-white font-semibold text-sm flex items-center gap-2">
              <GitMerge className="h-4 w-4 text-accent" /> Funnel Results
            </h2>
            <span className="text-xs text-white/40">
              Overall conversion:{" "}
              <span className="text-accent font-semibold">{result.overall_conversion_pct}%</span>
            </span>
          </div>
          <div className="p-5 space-y-4">
            {result.steps.map((s, idx) => {
              const barPct = maxUsers > 0 ? Math.round((s.users / maxUsers) * 100) : 0;
              return (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-accent/20 text-accent text-[10px] font-semibold flex items-center justify-center">
                        {s.step}
                      </span>
                      <span className="text-sm text-white/80 font-medium">{s.event_name}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-white font-semibold">{s.users.toLocaleString()}</span>
                      {s.drop_off_pct !== null && (
                        <span className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 px-2 py-0.5 rounded-full">
                          ↓ {s.drop_off_pct}% drop-off
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="h-7 bg-white/5 rounded-lg overflow-hidden">
                    <div
                      className="h-full bg-accent/70 rounded-lg transition-all duration-700"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!result && !running && (
        <div className="bg-[#14161f] rounded-2xl border border-white/10 p-10 text-center">
          <GitMerge className="h-8 w-8 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 text-sm">
            Select events above and click <strong className="text-white/60">Run Funnel</strong> to visualise conversion.
          </p>
        </div>
      )}
    </div>
  );
}
