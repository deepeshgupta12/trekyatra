"use client";

import { useState } from "react";
import { createSignal } from "@/lib/buddies";
import type { SignalOut } from "@/lib/buddies";

interface Props {
  trekSlug: string;
  onCreated: (signal: SignalOut) => void;
  onCancel: () => void;
}

const MONTHS = Array.from({ length: 12 }, (_, i) => {
  const d = new Date();
  d.setMonth(d.getMonth() + i);
  return {
    value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    label: d.toLocaleDateString("en-IN", { month: "long", year: "numeric" }),
  };
});

export function BuddySignalForm({ trekSlug, onCreated, onCancel }: Props) {
  const [monthYear, setMonthYear] = useState(MONTHS[0].value);
  const [groupSize, setGroupSize] = useState(1);
  const [experience, setExperience] = useState<"beginner" | "intermediate" | "expert" | "">("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const signal = await createSignal({
        trek_slug: trekSlug,
        month_year: monthYear,
        group_size: groupSize,
        experience: experience || undefined,
        notes: notes.trim() || undefined,
      });
      onCreated(signal);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to post signal");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-accent/20 bg-accent/5 p-4 space-y-4">
      <h3 className="font-semibold text-sm">I&apos;m planning this trek</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-foreground/60 mb-1.5">Planning month *</label>
          <select
            value={monthYear}
            onChange={(e) => setMonthYear(e.target.value)}
            className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {MONTHS.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground/60 mb-1.5">Group size</label>
          <select
            value={groupSize}
            onChange={(e) => setGroupSize(Number(e.target.value))}
            className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>{n === 1 ? "Solo" : `Group of ${n}`}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-foreground/60 mb-1.5">Experience level</label>
        <div className="flex flex-wrap gap-2">
          {(["beginner", "intermediate", "expert"] as const).map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setExperience(experience === level ? "" : level)}
              className={`px-3 py-1.5 rounded-full text-xs border transition-colors capitalize ${
                experience === level
                  ? "border-accent text-accent bg-accent/10 font-semibold"
                  : "border-foreground/15 text-foreground/50 hover:border-foreground/30"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-foreground/60 mb-1.5">Brief note <span className="text-foreground/30">(optional)</span></label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="Anything you want other trekkers to know…"
          className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent resize-none"
        />
        <p className="text-xs text-foreground/30 text-right mt-0.5">{notes.length}/500</p>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={submitting}
          className="px-5 py-2 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
        >
          {submitting ? "Posting…" : "Post my signal"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2 rounded-xl border border-foreground/15 text-foreground/60 text-sm hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
