"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { TrekCard, type Trek } from "@/components/trek/TrekCard";
import type { CMSPage, TrekFacts } from "@/lib/api";

/** Convert a CMS trek_guide page to a Trek card-compatible object.
 *  Prefers trek_* DB columns (Step 46); falls back to content_json.trek_facts. */
function cmsToTrek(page: CMSPage): Trek {
  const tf = (page.content_json?.trek_facts ?? {}) as TrekFacts;
  // trek_difficulty column (Step 46) is more reliable than trek_facts
  const rawDiff = (page.trek_difficulty ?? tf.difficulty ?? "Moderate").trim();
  const difficulty = rawDiff;  // preserve full value (Easy–Moderate, etc.) for TrekCard
  return {
    slug: page.slug,
    name: page.trek_name ?? page.title,
    region: tf.base ?? page.trek_state ?? "",
    state: page.trek_state ?? "",  // was hardcoded as ""
    image:       page.hero_image_url ?? "/images/trek-forest.jpg",
    duration:    page.trek_duration  ?? tf.duration ?? "—",
    altitude:    (tf as Record<string, string>).altitude ?? "—",
    difficulty,
    season:      page.trek_season ?? tf.season ?? "—",
    description: page.seo_description ?? "",
    beginner:    page.trek_suitability?.toLowerCase().includes("begin") ?? difficulty.toLowerCase().startsWith("easy"),
    suitability: page.trek_suitability ?? undefined,
  };
}

function cmsMatchesDifficulty(page: CMSPage, match: string[]): boolean {
  // Prefer trek_difficulty column (Step 46); fall back to trek_facts
  const tf = (page.content_json?.trek_facts as TrekFacts | undefined);
  const d = (page.trek_difficulty ?? tf?.difficulty ?? "").toLowerCase();
  return match.some((m) => d.includes(m.toLowerCase()));
}

type Difficulty = "Easy" | "Moderate" | "Challenging";

const DIFF_CONFIG: {
  label: Difficulty;
  dot: string;
  desc: string;
  page: string;
  cta: string;
  match: string[];
}[] = [
  {
    label: "Easy",
    dot: "bg-emerald-500",
    desc: "First-time trekkers",
    page: "/beginner",
    cta: "All beginner treks",
    match: ["Easy", "easy"],
  },
  {
    label: "Moderate",
    dot: "bg-amber-400",
    desc: "Some experience needed",
    page: "/moderate",
    cta: "All moderate treks",
    match: ["Moderate", "moderate"],
  },
  {
    label: "Challenging",
    dot: "bg-red-500",
    desc: "Experienced trekkers",
    page: "/challenging",
    cta: "All challenging treks",
    match: ["Difficult", "Challenging", "difficult", "challenging"],
  },
];

interface Props {
  treks: Trek[];          // static fallback
  cmsPages?: CMSPage[];   // CMS trek_guide pages (preferred source)
}

export function DifficultyTabsSection({ treks, cmsPages = [] }: Props) {
  const [active, setActive] = useState<Difficulty>("Easy");
  const cfg = DIFF_CONFIG.find((d) => d.label === active)!;

  // Prefer CMS pages; fall back to static treks for this difficulty
  const cmsFiltered = cmsPages
    .filter((p) => cmsMatchesDifficulty(p, cfg.match))
    .slice(0, 3)
    .map(cmsToTrek);

  const filtered = cmsFiltered.length > 0
    ? cmsFiltered
    : treks.filter((t) => cfg.match.some((m) => t.difficulty.toLowerCase().includes(m))).slice(0, 3);

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
              <span className={`h-2.5 w-2.5 rounded-full flex-shrink-0 ${d.dot}`} />
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
