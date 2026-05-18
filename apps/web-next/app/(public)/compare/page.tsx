"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Award, Check, X, Plus, Share2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { treks } from "@/data/treks";
import Link from "next/link";
import type { Trek } from "@/components/trek/TrekCard";

const COMPARE_FIELDS: { label: string; key: keyof Trek; render?: (v: unknown) => React.ReactNode }[] = [
  { label: "Duration", key: "duration" },
  { label: "Max altitude", key: "altitude" },
  { label: "Difficulty", key: "difficulty" },
  { label: "Best season", key: "season" },
  { label: "State / region", key: "state" },
  {
    label: "Beginner-friendly",
    key: "beginner",
    render: (v: unknown) =>
      v ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4 text-muted-foreground/50" />,
  },
];

const MAX_TREKS = 3;

function CompareContent() {
  const searchParams = useSearchParams();

  // Initialise from ?slugs=a,b,c URL param so share links work
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>(() => {
    const raw = searchParams?.get("slugs");
    if (raw) {
      const parsed = raw.split(",").filter((s) => treks.some((t) => t.slug === s));
      if (parsed.length >= 2) return parsed.slice(0, MAX_TREKS);
    }
    return [treks[0].slug, treks[6].slug];
  });

  // Sync URL when selection changes (for shareable links)
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("slugs", selectedSlugs.join(","));
    window.history.replaceState({}, "", url.toString());
  }, [selectedSlugs]);

  const selected = selectedSlugs.map((slug) => treks.find((t) => t.slug === slug) ?? treks[0]);
  const colCount = selected.length;

  const selectCls =
    "w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40";

  function changeSlug(idx: number, newSlug: string) {
    setSelectedSlugs((prev) => prev.map((s, i) => (i === idx ? newSlug : s)));
  }

  function addTrek() {
    const available = treks.find((t) => !selectedSlugs.includes(t.slug));
    if (available) setSelectedSlugs((prev) => [...prev, available.slug]);
  }

  function removeTrek(idx: number) {
    setSelectedSlugs((prev) => prev.filter((_, i) => i !== idx));
  }

  async function handleShare() {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: "Trek comparison on TrekYatra", url }).catch(() => {});
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
      alert("Link copied to clipboard");
    }
  }

  return (
    <div className="container-narrow py-12">
      {/* Header */}
      <div className="mb-8 text-center">
        <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">Side-by-side</div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-2">
          Compare up to 3 treks
        </h1>
        <p className="text-muted-foreground">
          Select treks for a detailed side-by-side comparison. Share your comparison with anyone.
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
                  className="text-white/30 hover:text-red-400 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <select
              value={trek.slug}
              onChange={(e) => changeSlug(idx, e.target.value)}
              className={selectCls}
            >
              {treks.map((t) => (
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
      <div className="flex gap-3 mb-8 flex-wrap">
        {colCount < MAX_TREKS && (
          <Button variant="outline" size="sm" onClick={addTrek} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add third trek
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
          <Share2 className="h-3.5 w-3.5" /> Share comparison
        </Button>
      </div>

      {/* Header cards */}
      <div className="gap-4 mb-1" style={{ display: "grid", gridTemplateColumns: `repeat(${colCount}, 1fr)` }}>
        {selected.map((t) => (
          <div key={t.slug} className="bg-card rounded-2xl border border-border overflow-hidden">
            <img src={t.image} alt={t.name} className="w-full h-32 object-cover" />
            <div className="p-4">
              <h2 className="font-display text-base font-semibold text-foreground leading-tight">{t.name}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">{t.region}</p>
              <Link href={`/trek/${t.slug}`} className="text-xs text-accent hover:underline mt-2 inline-block">
                Full guide →
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden mt-4">
        {COMPARE_FIELDS.map((field, i) => (
          <div
            key={field.key}
            className={`gap-0 ${i > 0 ? "border-t border-border" : ""}`}
            style={{ display: "grid", gridTemplateColumns: `1fr repeat(${colCount}, 2fr)` }}
          >
            <div className="px-4 py-3 text-xs text-muted-foreground font-medium bg-muted/30 flex items-center">
              {field.label}
            </div>
            {selected.map((t) => {
              const val = t[field.key];
              return (
                <div key={t.slug} className="px-4 py-3 text-sm text-foreground border-l border-border flex items-center">
                  {field.render ? field.render(val) : String(val ?? "—")}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Description comparison */}
      <div className="gap-4 mt-4" style={{ display: "grid", gridTemplateColumns: `repeat(${colCount}, 1fr)` }}>
        {selected.map((t) => (
          <div key={t.slug} className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Award className="h-4 w-4 text-accent" />
              <span className="text-xs font-medium text-foreground">{t.name}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{t.description}</p>
          </div>
        ))}
      </div>

      {/* CTAs */}
      <div className="gap-4 mt-6" style={{ display: "grid", gridTemplateColumns: `repeat(${colCount}, 1fr)` }}>
        {selected.map((t) => (
          <Link key={t.slug} href={`/trek/${t.slug}`}>
            <Button variant="outline" className="w-full text-xs">Read {t.name} guide →</Button>
          </Link>
        ))}
      </div>
    </div>
  );
}

// Wrap in Suspense — required by Next.js 14 when useSearchParams is used
export default function Compare() {
  return (
    <Suspense fallback={<div className="container-narrow py-12 text-center text-muted-foreground">Loading comparison…</div>}>
      <CompareContent />
    </Suspense>
  );
}
