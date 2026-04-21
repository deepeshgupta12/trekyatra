"use client";

import Link from "next/link";
import { Bookmark, Mountain, Clock, TrendingUp } from "lucide-react";

export type Trek = {
  slug: string;
  name: string;
  region: string;
  state: string;
  image: string;
  duration: string;
  altitude: string;
  difficulty: "Easy" | "Moderate" | "Difficult" | "Challenging";
  season: string;
  description: string;
  beginner?: boolean;
};

const diffColors = {
  Easy: "bg-success/15 text-success",
  Moderate: "bg-warning/15 text-warning",
  Difficult: "bg-accent/15 text-accent",
  Challenging: "bg-destructive/15 text-destructive",
};

export const TrekCard = ({ trek, featured = false }: { trek: Trek; featured?: boolean }) => (
  <Link href={`/trek/${trek.slug}`} className="group block">
    <article className={`relative overflow-hidden rounded-2xl bg-card border border-border lift ${featured ? "h-[480px]" : "h-[420px]"}`}>
      <div className="absolute inset-0">
        <img src={trek.image} alt={trek.name} loading="lazy" width={800} height={1000} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/30 to-transparent" />
      </div>

      <div className="absolute top-4 left-4 right-4 flex justify-between">
        <div className="flex gap-1.5">
          {trek.beginner && (
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent text-accent-foreground">
              Beginner
            </span>
          )}
          <span className={`text-[10px] font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur ${diffColors[trek.difficulty]}`}>
            {trek.difficulty}
          </span>
        </div>
        <button onClick={(e) => e.preventDefault()} className="h-9 w-9 rounded-full glass-dark flex items-center justify-center text-surface hover:bg-accent transition-colors">
          <Bookmark className="h-4 w-4" />
        </button>
      </div>

      <div className="absolute inset-x-0 bottom-0 p-5 text-surface">
        <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-widest text-accent-glow mb-2">
          <Mountain className="h-3 w-3" /> {trek.state}
        </div>
        <h3 className="font-display text-2xl font-semibold leading-tight mb-2">{trek.name}</h3>
        <p className="text-sm text-surface/80 line-clamp-2 mb-3">{trek.description}</p>
        <div className="flex items-center gap-3 text-xs text-surface/85">
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {trek.duration}</span>
          <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" /> {trek.altitude}</span>
          <span className="ml-auto text-accent-glow">{trek.season}</span>
        </div>
      </div>
    </article>
  </Link>
);
