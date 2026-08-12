import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Rung = "beginner" | "moderate" | "challenging";

const RUNGS: { key: Rung; href: string; label: string; sub: string }[] = [
  { key: "beginner", href: "/beginner", label: "Beginner", sub: "Your first trek" },
  { key: "moderate", href: "/moderate", label: "Moderate", sub: "Step it up" },
  { key: "challenging", href: "/challenging", label: "Challenging", sub: "High & technical" },
];

/**
 * The trek difficulty ladder — a shared cross-link block rendered on /beginner, /moderate and
 * /challenging. It interlinks the three (so search engines read them as a graded set, not
 * duplicates) and highlights the current rung.
 */
export function DifficultyLadder({ current }: { current: Rung }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-4">The difficulty ladder</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {RUNGS.map((r, i) => {
          const active = r.key === current;
          return (
            <Link
              key={r.key}
              href={r.href}
              aria-current={active ? "page" : undefined}
              className={`relative block rounded-xl border p-4 transition-colors ${
                active ? "border-accent/40 bg-accent/10" : "border-border hover:border-accent/30"
              }`}
            >
              <span className="text-xs text-muted-foreground">Level {i + 1}</span>
              <p className={`font-display text-lg font-semibold ${active ? "text-accent" : "text-foreground"}`}>{r.label}</p>
              <p className="text-muted-foreground text-xs">{r.sub}</p>
              {!active && <ArrowRight className="absolute top-4 right-4 h-4 w-4 text-muted-foreground/50" />}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
