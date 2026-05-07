"use client";

import { useState } from "react";
import { Award, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { treks } from "@/data/treks";
import Link from "next/link";

const COMPARE_FIELDS = [
  { label: "Duration", key: "duration" },
  { label: "Max altitude", key: "altitude" },
  { label: "Difficulty", key: "difficulty" },
  { label: "Best season", key: "season" },
  { label: "Beginner-friendly", key: "beginner", render: (v: unknown) => (v ? <Check className="h-4 w-4 text-success" /> : <X className="h-4 w-4 text-muted-foreground/50" />) },
  { label: "State / region", key: "region" },
];

type TrekKey = keyof typeof treks[0];

export default function Compare() {
  const [leftSlug, setLeftSlug] = useState(treks[0].slug);
  const [rightSlug, setRightSlug] = useState(treks[6].slug);

  const left = treks.find((t) => t.slug === leftSlug) ?? treks[0];
  const right = treks.find((t) => t.slug === rightSlug) ?? treks[6];

  const selectCls = "w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40";

  return (
    <div className="container-narrow py-12">
      <div className="mb-8 text-center">
        <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">Side-by-side</div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-2">Compare any two treks</h1>
        <p className="text-muted-foreground">Select two treks to see a detailed side-by-side comparison.</p>
      </div>

      {/* Trek selectors */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <div>
          <label className="text-xs text-muted-foreground font-medium block mb-1.5">Trek A</label>
          <select value={leftSlug} onChange={(e) => setLeftSlug(e.target.value)} className={selectCls}>
            {treks.map((t) => <option key={t.slug} value={t.slug} disabled={t.slug === rightSlug}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-medium block mb-1.5">Trek B</label>
          <select value={rightSlug} onChange={(e) => setRightSlug(e.target.value)} className={selectCls}>
            {treks.map((t) => <option key={t.slug} value={t.slug} disabled={t.slug === leftSlug}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {/* Header cards */}
      <div className="grid grid-cols-2 gap-4 mb-1">
        {[left, right].map((t) => (
          <div key={t.slug} className="bg-card rounded-2xl border border-border overflow-hidden">
            <img src={t.image} alt={t.name} className="w-full h-32 object-cover" />
            <div className="p-4">
              <h2 className="font-display text-lg font-semibold text-foreground">{t.name}</h2>
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
          <div key={field.key} className={`grid grid-cols-[1fr_2fr_2fr] gap-0 ${i > 0 ? "border-t border-border" : ""}`}>
            <div className="px-4 py-3 text-xs text-muted-foreground font-medium bg-muted/30 flex items-center">{field.label}</div>
            {[left, right].map((t) => {
              const val = t[field.key as TrekKey];
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
      <div className="grid grid-cols-2 gap-4 mt-4">
        {[left, right].map((t) => (
          <div key={t.slug} className="bg-card rounded-2xl border border-border p-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Award className="h-4 w-4 text-accent" />
              <span className="text-xs font-medium text-foreground">{t.name}</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">{t.description}</p>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="grid grid-cols-2 gap-4 mt-6">
        {[left, right].map((t) => (
          <Link key={t.slug} href={`/trek/${t.slug}`}>
            <Button variant="outline" className="w-full">Read {t.name} guide →</Button>
          </Link>
        ))}
      </div>
    </div>
  );
}
