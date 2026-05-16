"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TrekCard, type Trek } from "@/components/trek/TrekCard";

type Difficulty = "Easy" | "Moderate" | "Challenging";

const DIFF_CONFIG: {
  label: Difficulty;
  emoji: string;
  desc: string;
  page: string;
  cta: string;
  match: string[];
}[] = [
  {
    label: "Easy",
    emoji: "🟢",
    desc: "First-time trekkers",
    page: "/beginner",
    cta: "All beginner treks",
    match: ["Easy", "easy"],
  },
  {
    label: "Moderate",
    emoji: "🟡",
    desc: "Some experience needed",
    page: "/moderate",
    cta: "All moderate treks",
    match: ["Moderate", "moderate"],
  },
  {
    label: "Challenging",
    emoji: "🔴",
    desc: "Experienced trekkers",
    page: "/challenging",
    cta: "All challenging treks",
    match: ["Difficult", "Challenging", "difficult", "challenging"],
  },
];

export function DifficultyTabsSection({ treks }: { treks: Trek[] }) {
  const [active, setActive] = useState<Difficulty>("Easy");
  const cfg = DIFF_CONFIG.find((d) => d.label === active)!;
  const filtered = treks
    .filter((t) => cfg.match.some((m) => t.difficulty.includes(m)))
    .slice(0, 3);

  return (
    <section className="py-16 md:py-24 bg-surface-muted">
      <div className="container-wide">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-accent mb-2">By difficulty</div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold leading-tight">
              Treks matched to your level
            </h2>
          </div>
          <Link
            href={cfg.page}
            className="flex items-center gap-1 text-sm text-accent hover:underline font-medium whitespace-nowrap"
          >
            {cfg.cta} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Tab pills */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-1 -mx-1 px-1">
          {DIFF_CONFIG.map((d) => (
            <button
              key={d.label}
              onClick={() => setActive(d.label)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all border ${
                active === d.label
                  ? "bg-accent text-accent-foreground border-accent shadow"
                  : "bg-card border-border text-muted-foreground hover:text-foreground hover:border-accent/40"
              }`}
            >
              <span aria-hidden="true">{d.emoji}</span>
              {d.label}
              <span className="text-[10px] opacity-60 hidden sm:inline">{d.desc}</span>
            </button>
          ))}
        </div>

        {/* Cards */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {filtered.map((t) => (
              <TrekCard key={t.slug} trek={t} />
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-sm py-8 text-center">
            No treks found for this level.{" "}
            <Link href="/explore" className="text-accent hover:underline">
              Explore all treks →
            </Link>
          </p>
        )}
      </div>
    </section>
  );
}
