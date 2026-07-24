"use client";

import { useState } from "react";
import Link from "next/link";
import { Newspaper, ArrowRight } from "lucide-react";
import type { NewsArticle } from "@/lib/api";

interface Props {
  /** Published news articles, newest-first (from GET /public/news). */
  articles: NewsArticle[];
  /** trek_slug → trek display name (from the trek catalog). */
  trekNameMap: Record<string, string>;
}

function slugToName(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

interface NewsGroup {
  trekSlug: string;
  label: string;
  items: NewsArticle[];
}

/**
 * Recent News — news articles grouped into per-trek tabs. Tabs are ordered by most-recent
 * news (articles arrive newest-first). Each tab shows up to 5 articles (latest→oldest); a
 * trek needs ≥1 article to get a tab. "View all News Articles" → /news.
 */
export default function RecentNewsSection({ articles, trekNameMap }: Props) {
  const groups: NewsGroup[] = [];
  const indexBySlug: Record<string, number> = {};
  for (const a of articles) {
    const ts = a.content_json?.trek_slug;
    if (!ts) continue; // news with no trek association is still reachable via "View all"
    if (indexBySlug[ts] === undefined) {
      indexBySlug[ts] = groups.length;
      groups.push({ trekSlug: ts, label: trekNameMap[ts] ?? slugToName(ts), items: [] });
    }
    const g = groups[indexBySlug[ts]];
    if (g.items.length < 5) g.items.push(a); // max 5 per tab, newest-first preserved
  }

  const [active, setActive] = useState(0);
  if (groups.length === 0) return null;
  const activeGroup = groups[Math.min(active, groups.length - 1)];

  return (
    <section className="py-12 md:py-16">
      <div className="container-wide">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-6">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-accent mb-2">Fresh from the trails</div>
            <h2 className="font-display text-3xl md:text-4xl font-semibold">Recent news</h2>
          </div>
          <Link href="/news" className="text-accent text-sm font-medium flex items-center gap-1 hover:underline w-fit">
            View all News Articles <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {/* Per-trek tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-5 -mx-1 px-1">
          {groups.map((g, i) => (
            <button
              key={g.trekSlug}
              onClick={() => setActive(i)}
              className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                i === active
                  ? "bg-accent text-accent-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>

        {/* Articles for the active trek tab */}
        <div className="grid gap-3 sm:grid-cols-2">
          {activeGroup.items.map((a) => (
            <Link
              key={a.id}
              href={`/news/${a.slug}`}
              className="group flex items-start gap-3 p-4 rounded-2xl border border-border bg-card hover:border-accent/40 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Newspaper className="h-5 w-5 text-accent" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-widest text-accent font-medium mb-0.5">News article</p>
                <p className="font-semibold text-sm leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                  {a.title}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
