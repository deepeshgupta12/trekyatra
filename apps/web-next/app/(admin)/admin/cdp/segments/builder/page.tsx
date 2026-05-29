"use client";

import { useState, useEffect } from "react";
import { Plus, X, Save, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Condition {
  type: "event_count" | "event_property" | "trait" | "inactivity";
  event_name?: string;
  property_key?: string;
  property_value?: string;
  operator: "gte" | "lte" | "eq" | "contains";
  value: string | number;
  time_window_days?: number;
}

interface CatalogItem { event_name: string; event_category: string; count: number }

const CONDITION_TYPES = [
  { value: "event_count", label: "Event Count" },
  { value: "event_property", label: "Event Property" },
  { value: "trait", label: "User Trait" },
  { value: "inactivity", label: "Inactivity" },
] as const;

const OPERATORS = [
  { value: "gte", label: "at least" },
  { value: "lte", label: "at most" },
  { value: "eq", label: "equals" },
  { value: "contains", label: "contains" },
] as const;

const DEFAULT_CONDITION: Condition = {
  type: "event_count",
  event_name: "trek_view",
  operator: "gte",
  value: 1,
  time_window_days: 30,
};

export default function SegmentBuilderPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [conditions, setConditions] = useState<Condition[]>([{ ...DEFAULT_CONDITION }]);
  const [catalog, setCatalog] = useState<CatalogItem[]>([]);
  const [preview, setPreview] = useState<{ estimated_count: number; evaluated_in_ms: number } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    fetch("/api/v1/admin/cdp/events/catalog", { credentials: "include" })
      .then((r) => r.json())
      .then((d: { events: CatalogItem[] }) => setCatalog(d.events ?? []))
      .catch(() => {});
  }, []);

  const addCondition = () => {
    setConditions((prev) => [...prev, { ...DEFAULT_CONDITION }]);
  };

  const removeCondition = (idx: number) => {
    setConditions((prev) => prev.filter((_, i) => i !== idx));
  };

  const updateCondition = (idx: number, patch: Partial<Condition>) => {
    setConditions((prev) => prev.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  };

  const runPreview = () => {
    setPreviewLoading(true);
    fetch("/api/v1/admin/cdp/segments/preview", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ conditions }),
    })
      .then((r) => r.json())
      .then((d: { estimated_count: number; evaluated_in_ms: number }) => {
        setPreview(d);
        setPreviewLoading(false);
      })
      .catch(() => setPreviewLoading(false));
  };

  const saveSegment = () => {
    if (!name.trim()) { alert("Segment name is required."); return; }
    setSaveStatus("saving");
    fetch("/api/v1/admin/cdp/segments/custom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ name, description, conditions }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("Failed");
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 3000);
      })
      .catch(() => setSaveStatus("error"));
  };

  return (
    <div className="min-h-screen bg-[#0c0e14] text-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
          <div>
            <h1 className="font-display text-2xl font-semibold text-white mb-1">Segment Builder</h1>
            <p className="text-white/50 text-sm">Define rule-based custom audience segments.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={runPreview} disabled={previewLoading}
              className="border-white/20 text-white/60 hover:text-white">
              <Eye className="h-3.5 w-3.5 mr-1.5" />
              {previewLoading ? "Computing…" : "Preview"}
            </Button>
            <Button variant="hero" size="sm" onClick={saveSegment} disabled={saveStatus === "saving"}>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              {saveStatus === "saving" ? "Saving…" : saveStatus === "saved" ? "Saved ✓" : "Save Segment"}
            </Button>
          </div>
        </div>

        {/* Segment meta */}
        <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5 mb-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/40 font-medium mb-1.5 block">Segment name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. High Intent Trekkers"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30"
              />
            </div>
            <div>
              <label className="text-xs text-white/40 font-medium mb-1.5 block">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Viewed 3+ treks in last 30 days"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30"
              />
            </div>
          </div>
        </div>

        {/* Conditions */}
        <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden mb-5">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
            <h2 className="text-white font-semibold text-sm">Conditions (AND)</h2>
            <button
              onClick={addCondition}
              className="flex items-center gap-1.5 text-xs text-accent hover:text-accent/80 font-medium"
            >
              <Plus className="h-3.5 w-3.5" /> Add condition
            </button>
          </div>
          <div className="divide-y divide-white/5">
            {conditions.map((cond, idx) => (
              <div key={idx} className="px-5 py-4 flex items-start gap-3 flex-wrap">
                <span className="text-white/30 text-xs mt-2.5 shrink-0 w-16">
                  {idx === 0 ? "WHERE" : "AND"}
                </span>
                <div className="flex items-center gap-2 flex-wrap flex-1">
                  <select
                    value={cond.type}
                    onChange={(e) => updateCondition(idx, { type: e.target.value as Condition["type"] })}
                    className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                  >
                    {CONDITION_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>

                  {(cond.type === "event_count" || cond.type === "event_property") && (
                    <select
                      value={cond.event_name ?? ""}
                      onChange={(e) => updateCondition(idx, { event_name: e.target.value })}
                      className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      {catalog.map((e) => <option key={e.event_name} value={e.event_name}>{e.event_name}</option>)}
                    </select>
                  )}

                  {cond.type === "event_property" && (
                    <>
                      <input
                        value={cond.property_key ?? ""}
                        onChange={(e) => updateCondition(idx, { property_key: e.target.value })}
                        placeholder="property key"
                        className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 w-28"
                      />
                      <span className="text-white/30 text-xs">=</span>
                      <input
                        value={cond.property_value ?? ""}
                        onChange={(e) => updateCondition(idx, { property_value: e.target.value })}
                        placeholder="value"
                        className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 w-28"
                      />
                    </>
                  )}

                  {cond.type === "event_count" && (
                    <>
                      <select
                        value={cond.operator}
                        onChange={(e) => updateCondition(idx, { operator: e.target.value as Condition["operator"] })}
                        className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white"
                      >
                        {OPERATORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      <input
                        type="number"
                        value={String(cond.value)}
                        onChange={(e) => updateCondition(idx, { value: parseInt(e.target.value, 10) || 1 })}
                        className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white w-16 text-center"
                        min={1}
                      />
                      <span className="text-white/30 text-xs">times in last</span>
                      <input
                        type="number"
                        value={String(cond.time_window_days ?? 30)}
                        onChange={(e) => updateCondition(idx, { time_window_days: parseInt(e.target.value, 10) || 30 })}
                        className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white w-16 text-center"
                        min={1}
                        max={365}
                      />
                      <span className="text-white/30 text-xs">days</span>
                    </>
                  )}

                  {cond.type === "inactivity" && (
                    <>
                      <span className="text-white/50 text-xs">No event in last</span>
                      <input
                        type="number"
                        value={String(cond.value)}
                        onChange={(e) => updateCondition(idx, { value: parseInt(e.target.value, 10) || 14 })}
                        className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white w-16 text-center"
                        min={1}
                        max={365}
                      />
                      <span className="text-white/30 text-xs">days</span>
                    </>
                  )}

                  {cond.type === "trait" && (
                    <>
                      <input
                        value={cond.property_key ?? ""}
                        onChange={(e) => updateCondition(idx, { property_key: e.target.value })}
                        placeholder="trait key (e.g. top_region)"
                        className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 w-48"
                      />
                      <span className="text-white/30 text-xs">contains</span>
                      <input
                        value={cond.property_value ?? ""}
                        onChange={(e) => updateCondition(idx, { property_value: e.target.value })}
                        placeholder="value"
                        className="bg-white/5 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-white/30 w-32"
                      />
                    </>
                  )}
                </div>
                {conditions.length > 1 && (
                  <button
                    onClick={() => removeCondition(idx)}
                    className="text-white/30 hover:text-red-400 transition-colors mt-2 shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Preview result */}
        {preview && (
          <div className="bg-pine/10 border border-pine/20 rounded-xl px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-pine font-semibold text-sm">
                Estimated ~{preview.estimated_count.toLocaleString()} users
              </p>
              <p className="text-white/30 text-xs mt-0.5">evaluated in {preview.evaluated_in_ms}ms · last 90 days</p>
            </div>
            <Button variant="hero" size="sm" onClick={saveSegment}>
              <Save className="h-3.5 w-3.5 mr-1.5" /> Save Segment
            </Button>
          </div>
        )}

        {saveStatus === "error" && (
          <p className="text-red-400 text-sm mt-3">Failed to save segment. Please try again.</p>
        )}

      </div>
    </div>
  );
}
