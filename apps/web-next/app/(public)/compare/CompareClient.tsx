"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Award, Plus, Share2, Trash2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

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
  description?: string;
}

const COMPARE_FIELDS: { label: string; key: keyof CompareTrek }[] = [
  { label: "Duration",       key: "duration" },
  { label: "Max altitude",   key: "altitude" },
  { label: "Difficulty",     key: "difficulty" },
  { label: "Best season",    key: "season" },
  { label: "State / region", key: "state" },
];

const FAQ_ITEMS = [
  {
    q: "Which is easier — Kedarkantha or Brahmatal?",
    a: "Both are beginner-friendly winter treks in Uttarakhand. Kedarkantha (3,810 m) has a steeper summit push but a shorter overall distance. Brahmatal (3,741 m) is longer with a gentler gradient and fewer crowds. For a first Himalayan snow trek, either works well.",
  },
  {
    q: "What is the easiest trek in India for beginners?",
    a: "Kedarkantha, Dayara Bugyal, and Chopta-Tungnath are excellent beginner choices — 4–6 days, altitude under 4,000 m, well-marked trails with operator support. Use the compare tool above to evaluate them side by side.",
  },
  {
    q: "How do I compare treks by difficulty?",
    a: "TrekYatra rates treks as Easy, Moderate, Challenging, or Difficult based on daily altitude gain, trail grade, and required fitness. Use the dropdowns above to pick any two treks and compare difficulty, duration, and altitude gain in the table.",
  },
  {
    q: "Can I compare more than two treks?",
    a: "Yes — TrekYatra's compare tool supports up to 3 treks simultaneously. Click the '+ Add third trek' button to add a third column to the comparison table.",
  },
  {
    q: "Which trek has the highest altitude?",
    a: "Stok Kangri (6,153 m) is among the highest listed treks. Most beginner treks peak between 3,000–4,500 m. Use the 'Max altitude' row in the comparison table to check any trek.",
  },
  {
    q: "How much does a Himalayan trek cost?",
    a: "Independent treks cost ₹5,000–₹12,000 including travel, accommodation, and food. Operator-led packages range from ₹8,000–₹25,000 per person for 5–7 day treks, including guides, permits, and camping gear.",
  },
];

const MAX_TREKS = 3;

const selectCls =
  "w-full bg-card border border-border rounded-xl px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40";

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <button
        className="w-full text-left px-5 py-4 flex items-center justify-between gap-4 text-sm font-medium text-foreground"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <span>{question}</span>
        <span className="text-muted-foreground flex-shrink-0 text-lg leading-none">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="px-5 pb-4 pt-3 text-sm text-muted-foreground leading-relaxed border-t border-border">
          {answer}
        </div>
      )}
    </div>
  );
}

export function CompareClient({ initialTreks }: { initialTreks: CompareTrek[] }) {
  const searchParams = useSearchParams();

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

  const selected = selectedSlugs.map(
    (slug) => initialTreks.find((t) => t.slug === slug) ?? initialTreks[0]
  ).filter(Boolean) as CompareTrek[];

  const colCount = selected.length;

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

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
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url).catch(() => {});
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/v1/account/comparisons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slugs: selectedSlugs }),
      });
      if (res.ok) {
        setSaveMsg("Saved!");
      } else if (res.status === 401) {
        setSaveMsg("Sign in to save");
      } else {
        setSaveMsg("Error");
      }
    } catch {
      setSaveMsg("Error");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 3000);
    }
  }

  if (initialTreks.length === 0) {
    return (
      <div className="container-narrow py-12 text-center text-muted-foreground">
        No trek data available. Please check back soon.
      </div>
    );
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
      <div className="flex flex-wrap gap-3 mb-8">
        {colCount < MAX_TREKS && (
          <Button variant="outline" size="sm" onClick={addTrek} className="gap-1.5">
            <Plus className="h-3.5 w-3.5" /> Add third trek
          </Button>
        )}
        <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
          <Share2 className="h-3.5 w-3.5" /> Share comparison
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="gap-1.5"
        >
          {saving
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Save className="h-3.5 w-3.5" />}
          {saveMsg || "Save comparison"}
        </Button>
      </div>

      {/* Trek header cards */}
      <div
        className="gap-4 mb-1"
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
        {COMPARE_FIELDS.map((field, i) => (
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
        ))}
      </div>

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

      {/* AEO FAQ section */}
      <div className="mt-16">
        <h2 className="font-display text-xl font-semibold text-foreground mb-2">
          Frequently asked questions about trek comparison
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          Common questions about comparing Himalayan treks.
        </p>
        <div className="space-y-3">
          {FAQ_ITEMS.map((item, i) => (
            <FAQItem key={i} question={item.q} answer={item.a} />
          ))}
        </div>
      </div>
    </div>
  );
}
