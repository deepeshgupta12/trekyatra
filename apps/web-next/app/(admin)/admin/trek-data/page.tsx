"use client";

import { useEffect, useState } from "react";
import { Mountain, RefreshCw, Sparkles, ChevronDown, ChevronUp, ShieldAlert, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  TrekDataQualityRow,
  TrekProfile,
  TrekMetaPatch,
  AIInteractionLogEntry,
  fetchTrekDataQuality,
  fetchTrekProfile,
  updateTrekMeta,
  triggerTrekBackfill,
  triggerTrekBackfillAll,
  fetchAiInteractionLogs,
} from "@/lib/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" });
}

function listToText(values: (string | number)[] | null | undefined): string {
  return (values ?? []).join(", ");
}

function textToStrings(text: string): string[] | null {
  const items = text.split(",").map((s) => s.trim()).filter(Boolean);
  return items.length > 0 ? items : null;
}

function textToNumbers(text: string): number[] | null {
  const items = text
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => !Number.isNaN(n));
  return items.length > 0 ? items : null;
}

const sourceStyle: Record<string, string> = {
  web: "text-blue-400  bg-blue-400/10  border border-blue-400/20",
  mobile: "text-pine      bg-pine/10      border border-pine/20",
  chatgpt: "text-purple-400 bg-purple-500/10 border border-purple-500/20",
  claude: "text-accent    bg-accent/10    border border-accent/20",
};

function SourceBadge({ source }: { source: string }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${sourceStyle[source] ?? "text-white/40 bg-white/5 border border-white/10"}`}>
      {source}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Edit form (expanded row)
// ---------------------------------------------------------------------------

function TrekEditForm({
  slug,
  onSaved,
}: {
  slug: string;
  onSaved: () => void;
}) {
  const [profile, setProfile] = useState<TrekProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<Record<string, string | boolean>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchTrekProfile(slug).then((p) => {
      if (cancelled) return;
      setProfile(p);
      if (p) {
        setForm({
          trek_region: p.region ?? "",
          trek_max_altitude_ft: p.max_altitude_ft?.toString() ?? "",
          trek_duration_days_min: p.duration_days_min?.toString() ?? "",
          trek_duration_days_max: p.duration_days_max?.toString() ?? "",
          trek_best_months: listToText(p.best_months),
          trek_open_months: listToText(p.open_months),
          trek_avoid_months: listToText(p.avoid_months),
          trek_permit_required: p.permit_required ?? false,
          trek_permit_notes: p.permit_notes ?? "",
          trek_budget_min: p.budget_min?.toString() ?? "",
          trek_budget_max: p.budget_max?.toString() ?? "",
          trek_themes: listToText(p.themes),
          trek_crowd_level: p.crowd_level ?? "",
          trek_beginner_friendly: p.beginner_friendly ?? false,
          trek_solo_friendly: p.solo_friendly ?? false,
          trek_family_friendly: p.family_friendly ?? false,
          trek_is_unsafe_closed: p.is_unsafe_closed,
        });
      }
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [slug]);

  function set(field: string, value: string | boolean) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const patch: TrekMetaPatch = {
        trek_region: (form.trek_region as string) || null,
        trek_max_altitude_ft: form.trek_max_altitude_ft ? Number(form.trek_max_altitude_ft) : null,
        trek_duration_days_min: form.trek_duration_days_min ? Number(form.trek_duration_days_min) : null,
        trek_duration_days_max: form.trek_duration_days_max ? Number(form.trek_duration_days_max) : null,
        trek_best_months: textToNumbers(form.trek_best_months as string),
        trek_open_months: textToNumbers(form.trek_open_months as string),
        trek_avoid_months: textToNumbers(form.trek_avoid_months as string),
        trek_permit_required: form.trek_permit_required as boolean,
        trek_permit_notes: (form.trek_permit_notes as string) || null,
        trek_budget_min: form.trek_budget_min ? Number(form.trek_budget_min) : null,
        trek_budget_max: form.trek_budget_max ? Number(form.trek_budget_max) : null,
        trek_themes: textToStrings(form.trek_themes as string),
        trek_crowd_level: (form.trek_crowd_level as string) || null,
        trek_beginner_friendly: form.trek_beginner_friendly as boolean,
        trek_solo_friendly: form.trek_solo_friendly as boolean,
        trek_family_friendly: form.trek_family_friendly as boolean,
        trek_is_unsafe_closed: form.trek_is_unsafe_closed as boolean,
      };
      await updateTrekMeta(slug, patch);
      onSaved();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="px-5 py-6 text-center text-white/30 text-sm">Loading profile…</div>;
  }
  if (!profile) {
    return <div className="px-5 py-6 text-center text-red-400 text-sm">Failed to load trek profile.</div>;
  }

  return (
    <div className="px-5 py-5 bg-white/[0.02] border-t border-white/8 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Field label="Region">
          <input className={inputClass} value={form.trek_region as string} onChange={(e) => set("trek_region", e.target.value)} />
        </Field>
        <Field label="Max Altitude (ft)">
          <input className={inputClass} type="number" value={form.trek_max_altitude_ft as string} onChange={(e) => set("trek_max_altitude_ft", e.target.value)} />
        </Field>
        <Field label="Crowd Level">
          <input className={inputClass} placeholder="low / medium / high" value={form.trek_crowd_level as string} onChange={(e) => set("trek_crowd_level", e.target.value)} />
        </Field>
        <Field label="Duration Days (min)">
          <input className={inputClass} type="number" value={form.trek_duration_days_min as string} onChange={(e) => set("trek_duration_days_min", e.target.value)} />
        </Field>
        <Field label="Duration Days (max)">
          <input className={inputClass} type="number" value={form.trek_duration_days_max as string} onChange={(e) => set("trek_duration_days_max", e.target.value)} />
        </Field>
        <Field label="Budget Min (₹)">
          <input className={inputClass} type="number" value={form.trek_budget_min as string} onChange={(e) => set("trek_budget_min", e.target.value)} />
        </Field>
        <Field label="Budget Max (₹)">
          <input className={inputClass} type="number" value={form.trek_budget_max as string} onChange={(e) => set("trek_budget_max", e.target.value)} />
        </Field>
        <Field label="Best Months (1-12, comma-separated)">
          <input className={inputClass} placeholder="e.g. 3, 4, 5" value={form.trek_best_months as string} onChange={(e) => set("trek_best_months", e.target.value)} />
        </Field>
        <Field label="Open Months (1-12, comma-separated)">
          <input className={inputClass} placeholder="e.g. 3, 4, 5, 6" value={form.trek_open_months as string} onChange={(e) => set("trek_open_months", e.target.value)} />
        </Field>
        <Field label="Avoid Months (1-12, comma-separated)">
          <input className={inputClass} placeholder="e.g. 7, 8" value={form.trek_avoid_months as string} onChange={(e) => set("trek_avoid_months", e.target.value)} />
        </Field>
        <Field label="Themes (comma-separated)">
          <input className={inputClass} placeholder="e.g. snow, ridge-walk, alpine-lake" value={form.trek_themes as string} onChange={(e) => set("trek_themes", e.target.value)} />
        </Field>
        <Field label="Permit Notes">
          <input className={inputClass} value={form.trek_permit_notes as string} onChange={(e) => set("trek_permit_notes", e.target.value)} />
        </Field>
      </div>

      <div className="flex flex-wrap gap-4 pt-2">
        <Toggle label="Permit Required" checked={form.trek_permit_required as boolean} onChange={(v) => set("trek_permit_required", v)} />
        <Toggle label="Beginner Friendly" checked={form.trek_beginner_friendly as boolean} onChange={(v) => set("trek_beginner_friendly", v)} />
        <Toggle label="Solo Friendly" checked={form.trek_solo_friendly as boolean} onChange={(v) => set("trek_solo_friendly", v)} />
        <Toggle label="Family Friendly" checked={form.trek_family_friendly as boolean} onChange={(v) => set("trek_family_friendly", v)} />
        <Toggle label="Unsafe / Closed (exclude from recommendations)" checked={form.trek_is_unsafe_closed as boolean} onChange={(v) => set("trek_is_unsafe_closed", v)} danger />
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex justify-end">
        <Button variant="hero" size="sm" disabled={saving} onClick={handleSave}>
          {saving ? "Saving…" : "Save & Mark Verified"}
        </Button>
      </div>
    </div>
  );
}

const inputClass = "w-full bg-[#0c0e14] border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/80 focus:outline-none focus:border-accent/40";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-white/40 font-medium block mb-1">{label}</span>
      {children}
    </label>
  );
}

function Toggle({ label, checked, onChange, danger }: { label: string; checked: boolean; onChange: (v: boolean) => void; danger?: boolean }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-accent h-4 w-4" />
      <span className={`text-xs ${danger ? "text-red-400" : "text-white/60"}`}>{label}</span>
    </label>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TrekDataPage() {
  const [rows, setRows] = useState<TrekDataQualityRow[]>([]);
  const [logs, setLogs] = useState<AIInteractionLogEntry[]>([]);
  const [loadingRows, setLoadingRows] = useState(true);
  const [loadingLogs, setLoadingLogs] = useState(true);
  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [backfillingSlug, setBackfillingSlug] = useState<string | null>(null);
  const [backfillingAll, setBackfillingAll] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [feedbackError, setFeedbackError] = useState(false);

  async function loadRows() {
    setLoadingRows(true);
    try {
      setRows(await fetchTrekDataQuality());
    } catch {
      // silent — table shows empty state
    } finally {
      setLoadingRows(false);
    }
  }

  async function loadLogs() {
    setLoadingLogs(true);
    try {
      setLogs(await fetchAiInteractionLogs(50));
    } catch {
      // silent — table shows empty state
    } finally {
      setLoadingLogs(false);
    }
  }

  useEffect(() => { loadRows(); loadLogs(); }, []);

  const totalTreks = rows.length;
  const totalVerified = rows.reduce((sum, r) => sum + r.verified_count, 0);
  const totalDraft = rows.reduce((sum, r) => sum + r.draft_count, 0);
  const totalMissing = rows.reduce((sum, r) => sum + r.missing_count, 0);
  const unsafeCount = rows.filter((r) => r.is_unsafe_closed).length;

  async function handleBackfill(slug: string) {
    setBackfillingSlug(slug);
    setFeedback(null);
    setFeedbackError(false);
    try {
      await triggerTrekBackfill(slug);
      setFeedback(`Backfill queued for ${slug}. Refresh in a moment to see draft fields.`);
    } catch (err: unknown) {
      setFeedback(err instanceof Error ? err.message : "Backfill failed");
      setFeedbackError(true);
    } finally {
      setBackfillingSlug(null);
    }
  }

  async function handleBackfillAll() {
    setBackfillingAll(true);
    setFeedback(null);
    setFeedbackError(false);
    try {
      const res = await triggerTrekBackfillAll();
      setFeedback(
        `Backfill queued for ${res.trek_count} trek(s). This runs in the background and may take several minutes — reload to see updated coverage.`
      );
    } catch (err: unknown) {
      setFeedback(err instanceof Error ? err.message : "Backfill all failed");
      setFeedbackError(true);
    } finally {
      setBackfillingAll(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold text-white mb-1">Trek Data</h1>
          <p className="text-white/50 text-sm">
            TrekSage structured-field coverage, admin verification, and AI/MCP interaction log.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Button variant="outline" size="sm" className="border-white/20 text-white/60 hover:text-white w-fit" onClick={() => { loadRows(); loadLogs(); }}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Reload
            </Button>
            <Button variant="hero" size="sm" className="w-fit" disabled={backfillingAll} onClick={handleBackfillAll}>
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              {backfillingAll ? "Queuing…" : "Backfill All Treks"}
            </Button>
          </div>
          {feedback && (
            <p className={`text-xs ${feedbackError ? "text-red-400" : "text-pine"}`}>{feedback}</p>
          )}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <KPI icon={Mountain} value={totalTreks} label="Trek Guides" />
        <KPI icon={Sparkles} value={totalVerified} label="Verified Fields" accent="text-pine" />
        <KPI icon={Sparkles} value={totalDraft} label="Draft Fields" accent="text-blue-400" />
        <KPI icon={Sparkles} value={totalMissing} label="Missing Fields" accent="text-amber-400" />
        <KPI icon={ShieldAlert} value={unsafeCount} label="Unsafe / Closed" accent="text-red-400" />
      </div>

      {/* Data-quality table */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
          <h2 className="text-white font-semibold text-sm">Structured Field Coverage</h2>
          <span className="text-white/40 text-xs">{rows.length} trek guide{rows.length !== 1 ? "s" : ""}</span>
        </div>

        {loadingRows ? (
          <div className="px-5 py-8 text-center text-white/30 text-sm">Loading…</div>
        ) : rows.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <Mountain className="h-8 w-8 text-white/20 mx-auto mb-2" />
            <p className="text-white/50 text-sm">No trek_guide pages found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Trek</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Verified</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Draft</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Missing</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden sm:table-cell">Status</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden md:table-cell">Last Verified</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <>
                    <tr key={row.slug} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className="text-white/80 font-medium text-xs sm:text-sm">{row.name}</span>
                        <span className="block text-white/30 text-xs font-mono">{row.slug}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full text-pine bg-pine/10 border border-pine/20">{row.verified_count}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full text-blue-400 bg-blue-400/10 border border-blue-400/20">{row.draft_count}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs font-medium px-2.5 py-1 rounded-full text-amber-400 bg-amber-400/10 border border-amber-400/20">{row.missing_count}</span>
                      </td>
                      <td className="px-4 py-3.5 hidden sm:table-cell">
                        {row.is_unsafe_closed ? (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full text-red-400 bg-red-400/10 border border-red-400/20">Unsafe / Closed</span>
                        ) : (
                          <span className="text-xs font-medium px-2.5 py-1 rounded-full text-white/40 bg-white/5 border border-white/10">OK</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 hidden md:table-cell text-white/40 text-xs">{formatDate(row.last_verified_at)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/20 text-white/60 hover:text-white text-xs h-7 px-2.5"
                            onClick={() => setExpandedSlug(expandedSlug === row.slug ? null : row.slug)}
                          >
                            {expandedSlug === row.slug ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-white/20 text-white/60 hover:text-white text-xs h-7 px-2.5"
                            disabled={backfillingSlug === row.slug}
                            onClick={() => handleBackfill(row.slug)}
                          >
                            {backfillingSlug === row.slug ? <RefreshCw className="h-3 w-3 mr-1 animate-spin" /> : <Sparkles className="h-3 w-3 mr-1" />}
                            {backfillingSlug === row.slug ? "Queuing…" : "Backfill draft"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                    {expandedSlug === row.slug && (
                      <tr key={`${row.slug}-edit`}>
                        <td colSpan={7} className="p-0">
                          <TrekEditForm slug={row.slug} onSaved={() => { setExpandedSlug(null); loadRows(); }} />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* AI interaction log */}
      <div className="bg-[#14161f] rounded-2xl border border-white/10 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/8">
          <h2 className="text-white font-semibold text-sm">AI / MCP Interaction Log</h2>
          <span className="text-white/40 text-xs">{logs.length} recent</span>
        </div>

        {loadingLogs ? (
          <div className="px-5 py-8 text-center text-white/30 text-sm">Loading…</div>
        ) : logs.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <Bot className="h-8 w-8 text-white/20 mx-auto mb-2" />
            <p className="text-white/50 text-sm">No AI/MCP interactions logged yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-white/8">
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">When</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Source</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden sm:table-cell">Tool</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs">Query</th>
                  <th className="text-left px-4 py-3 text-white/40 font-medium text-xs hidden lg:table-cell">Treks</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-white/5 last:border-0 hover:bg-white/3 transition-colors">
                    <td className="px-4 py-3.5 text-white/40 text-xs">{formatDate(log.created_at)}</td>
                    <td className="px-4 py-3.5"><SourceBadge source={log.source} /></td>
                    <td className="px-4 py-3.5 text-white/50 text-xs hidden sm:table-cell font-mono">{log.tool_name}</td>
                    <td className="px-4 py-3.5 text-white/70 text-xs max-w-[280px] truncate">{log.query_summary ?? "—"}</td>
                    <td className="px-4 py-3.5 text-white/40 text-xs hidden lg:table-cell font-mono">{(log.trek_slugs ?? []).join(", ") || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function KPI({ icon: Icon, value, label, accent }: { icon: typeof Mountain; value: number; label: string; accent?: string }) {
  return (
    <div className="bg-[#14161f] rounded-2xl border border-white/10 p-5">
      <div className="bg-accent/10 w-8 h-8 rounded-lg flex items-center justify-center mb-3">
        <Icon className={`h-4 w-4 ${accent ?? "text-accent"}`} />
      </div>
      <p className="text-white font-display text-2xl font-semibold leading-none mb-1">{value}</p>
      <p className="text-white/50 text-xs">{label}</p>
    </div>
  );
}
