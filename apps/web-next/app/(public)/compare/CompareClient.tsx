"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Award, CheckCircle2, Loader2, Plus, Save, Share2, Sparkles, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import AuthGateModal from "@/components/plan/AuthGateModal";
import { compareTreks, type CompareTreksResponse } from "@/lib/api";

export interface CompareTrek {
  slug: string;
  name: string;
  image: string;
  difficulty: string;
  duration: string;
  season: string;
  state: string;
  region: string;
  altitude?: string;
  permits?: string;
  base?: string;
  suitability?: string;
  description?: string;
}

const COMPARE_FIELDS: { label: string; key: keyof CompareTrek }[] = [
  { label: "Duration",         key: "duration" },
  { label: "Max altitude",     key: "altitude" },
  { label: "Difficulty",       key: "difficulty" },
  { label: "Best season",      key: "season" },
  { label: "State / region",   key: "state" },
  { label: "Permits required", key: "permits" },
  { label: "Base camp",        key: "base" },
  { label: "Suitability",      key: "suitability" },
];

const MAX_TREKS = 3;

/** Format a value from a TrekComparisonRow for display in the comparison table. */
function formatRowValue(field: string, value: string | number | boolean | null): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "number") {
    if (field === "budget_min" || field === "budget_max") return `₹${value.toLocaleString("en-IN")}`;
    if (field === "max_altitude_ft") return `${value.toLocaleString("en-IN")} ft`;
    return String(value);
  }
  return String(value);
}

const selectCls =
  "w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40";

export function CompareClient({ initialTreks }: { initialTreks: CompareTrek[] }) {
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(() => {
    const raw = searchParams?.get("slugs");
    if (raw && initialTreks.length > 0) {
      const parsed = raw.split(",").filter((s) => initialTreks.some((t) => t.slug === s));
      if (parsed.length >= 2) return parsed.slice(0, MAX_TREKS);
      if (parsed.length === 1) {
        // Pre-select from trek detail page link — auto-pick a second
        const second = initialTreks.find((t) => t.slug !== parsed[0]);
        return second ? [parsed[0], second.slug] : [parsed[0]];
      }
    }
    return initialTreks.length >= 2
      ? [initialTreks[0].slug, initialTreks[1].slug]
      : initialTreks.slice(0, 2).map((t) => t.slug);
  });

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("slugs", selectedSlugs.join(","));
    window.history.replaceState({}, "", url.toString());
  }, [selectedSlugs]);

  const selected = selectedSlugs
    .map((slug) => initialTreks.find((t) => t.slug === slug) ?? initialTreks[0])
    .filter(Boolean) as CompareTrek[];

  const colCount = selected.length;

  const [compareData, setCompareData] = useState<CompareTreksResponse | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  useEffect(() => {
    if (selectedSlugs.length < 2) {
      setCompareData(null);
      return;
    }
    let cancelled = false;
    setCompareLoading(true);
    compareTreks(selectedSlugs)
      .then((data) => {
        if (!cancelled) setCompareData(data);
      })
      .catch(() => {
        if (!cancelled) setCompareData(null);
      })
      .finally(() => {
        if (!cancelled) setCompareLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedSlugs]);

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [shareCopied, setShareCopied] = useState(false);

  function changeSlug(idx: number, newSlug: string) {
    setSelectedSlugs((prev) => prev.map((s, i) => (i === idx ? newSlug : s)));
  }

  function addTrek() {
    const available = initialTreks.find((t) => !selectedSlugs.includes(t.slug));
    if (available) setSelectedSlugs((prev) => [...prev, available.slug]);
  }

  function removeTrek(idx: number) {
    if (selectedSlugs.length <= 2) return;
    setSelectedSlugs((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: "Trek comparison on TrekYatra", url }).catch(() => {});
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setShareCopied(true);
        setTimeout(() => setShareCopied(false), 2500);
      } catch {
        window.prompt("Copy comparison link:", url);
      }
    }
  }

  async function doSave() {
    setSaving(true);
    try {
      const name = selected.map((t) => t.name).join(" vs ");
      const res = await fetch("/api/v1/account/comparisons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, slugs: selectedSlugs }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 5000);
      } else {
        setSaveMsg("Error saving");
        setTimeout(() => setSaveMsg(""), 3000);
      }
    } catch {
      setSaveMsg("Error saving");
      setTimeout(() => setSaveMsg(""), 3000);
    } finally {
      setSaving(false);
    }
  }

  function handleSave() {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    doSave();
  }

  if (initialTreks.length === 0) {
    return (
      <div className="container-narrow py-12 text-center text-muted-foreground">
        No trek data available. Please check back soon.
      </div>
    );
  }

  return (
    <>
      <AuthGateModal
        open={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={() => {
          setAuthModalOpen(false);
          doSave();
        }}
      />

      <div className="container-narrow py-12">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">Side-by-side</div>
          <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-2">
            Compare up to 3 treks
          </h1>
          <p className="text-muted-foreground">
            Select any trek for a detailed side-by-side comparison. Share your comparison with anyone.
          </p>
        </div>

        {/* Trek selectors */}
        <div
          className="gap-4 mb-8"
          style={{ display: "grid", gridTemplateColumns: `repeat(${colCount}, 1fr)` }}
        >
          {selected.map((trek, idx) => (
            <div key={idx} className="relative">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-muted-foreground font-medium">
                  Trek {String.fromCharCode(65 + idx)}
                </label>
                {colCount > 2 && (
                  <button
                    onClick={() => removeTrek(idx)}
                    className="text-muted-foreground/40 hover:text-red-400 transition-colors"
                    title="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <select
                aria-label={`Trek ${idx + 1}`}
                value={trek.slug}
                onChange={(e) => changeSlug(idx, e.target.value)}
                className={selectCls}
              >
                {initialTreks.map((t) => (
                  <option
                    key={t.slug}
                    value={t.slug}
                    disabled={selectedSlugs.includes(t.slug) && t.slug !== trek.slug}
                  >
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3 mb-3">
          {colCount < MAX_TREKS && (
            <Button variant="outline" size="sm" onClick={addTrek} className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> Add third trek
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
            <Share2 className="h-3.5 w-3.5" />
            {shareCopied ? "Link copied!" : "Share comparison"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={saving}
            className="gap-1.5"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {saveMsg || "Save comparison"}
          </Button>
        </div>

        {/* Save success banner */}
        {saveSuccess && (
          <div className="flex items-center gap-2 text-pine text-sm bg-pine/10 border border-pine/20 rounded-xl px-4 py-3 mb-6">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            Comparison saved!{" "}
            <Link href="/account" className="underline font-medium">
              View in your profile
            </Link>
            .
          </div>
        )}

        {/* Trek header cards */}
        <div
          className="gap-4 mb-1 mt-4"
          style={{ display: "grid", gridTemplateColumns: `repeat(${colCount}, 1fr)` }}
        >
          {selected.map((t) => (
            <div key={t.slug} className="bg-card rounded-2xl border border-border overflow-hidden">
              <img
                src={t.image}
                alt={t.name}
                className="w-full h-32 object-cover"
                loading="lazy"
              />
              <div className="p-4">
                <h2 className="font-display text-base font-semibold text-foreground leading-tight">
                  {t.name}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">{t.state || t.region}</p>
                <Link
                  href={`/trek/${t.slug}`}
                  className="text-xs text-accent hover:underline mt-2 inline-block"
                >
                  Full guide →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Comparison table */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden mt-4">
          {compareData ? (
            compareData.rows.map((row, i) => (
              <div
                key={row.field}
                className={i > 0 ? "border-t border-border" : ""}
                style={{ display: "grid", gridTemplateColumns: `1fr repeat(${colCount}, 2fr)` }}
              >
                <div className="px-4 py-3 text-xs text-muted-foreground font-medium bg-muted/30 flex items-center">
                  {row.label}
                </div>
                {row.values.map((value, idx) => (
                  <div
                    key={idx}
                    className="px-4 py-3 text-sm text-foreground border-l border-border flex items-center"
                  >
                    {formatRowValue(row.field, value)}
                  </div>
                ))}
              </div>
            ))
          ) : (
            COMPARE_FIELDS.map((field, i) => (
              <div
                key={field.key}
                className={i > 0 ? "border-t border-border" : ""}
                style={{ display: "grid", gridTemplateColumns: `1fr repeat(${colCount}, 2fr)` }}
              >
                <div className="px-4 py-3 text-xs text-muted-foreground font-medium bg-muted/30 flex items-center">
                  {field.label}
                </div>
                {selected.map((t) => (
                  <div
                    key={t.slug}
                    className="px-4 py-3 text-sm text-foreground border-l border-border flex items-center"
                  >
                    {String(t[field.key] ?? "—")}
                  </div>
                ))}
              </div>
            ))
          )}
        </div>

        {/* AI trade-off summary */}
        {(compareLoading || compareData?.ai_summary) && (
          <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 mt-4 flex gap-3">
            <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-accent flex-shrink-0">
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="text-sm leading-relaxed text-foreground/85 min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wide text-accent mb-1">
                TrekSage's take
              </div>
              {compareLoading && !compareData ? "Comparing treks…" : compareData?.ai_summary}
            </div>
          </div>
        )}

        {/* Description comparison */}
        <div
          className="gap-4 mt-4"
          style={{ display: "grid", gridTemplateColumns: `repeat(${colCount}, 1fr)` }}
        >
          {selected.map((t) => (
            <div key={t.slug} className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center gap-1.5 mb-2">
                <Award className="h-4 w-4 text-accent" />
                <span className="text-xs font-medium text-foreground">{t.name}</span>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t.description || "See the full guide for itinerary, permits, and cost details."}
              </p>
            </div>
          ))}
        </div>

        {/* Read guide CTAs */}
        <div
          className="gap-4 mt-6"
          style={{ display: "grid", gridTemplateColumns: `repeat(${colCount}, 1fr)` }}
        >
          {selected.map((t) => (
            <Link key={t.slug} href={`/trek/${t.slug}`}>
              <Button variant="outline" className="w-full text-xs">
                Read {t.name} guide →
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
