import Link from "next/link";
import type { Trek } from "@/components/trek/TrekCard";

/**
 * Comparison table of the treks on a hub page (season / region / category). Every row links to the
 * trek detail page, so it doubles as an interlinking + rich-content block and gives Google/AI a
 * scannable table of facts (difficulty, duration, best season, altitude).
 */
export function TrekComparisonTable({ treks, title, caption }: { treks: Trek[]; title: string; caption?: string }) {
  if (treks.length < 2) return null;
  return (
    <section className="py-12 bg-surface-muted">
      <div className="container-wide max-w-5xl">
        <h2 className="font-display text-2xl md:text-3xl font-semibold mb-2">{title}</h2>
        {caption && <p className="text-muted-foreground mb-6">{caption}</p>}
        <div className="overflow-x-auto bg-card border border-border rounded-2xl">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-widest">Trek</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-widest">Difficulty</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-widest">Duration</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-widest hidden sm:table-cell">Best season</th>
                <th className="text-left px-5 py-3 text-muted-foreground font-medium text-xs uppercase tracking-widest hidden md:table-cell">Max altitude</th>
              </tr>
            </thead>
            <tbody>
              {treks.map((t) => (
                <tr key={t.slug} className="border-b border-border/60 last:border-0 hover:bg-surface-muted/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link href={`/trek/${t.slug}`} className="font-semibold text-foreground hover:text-accent transition-colors">
                      {t.name}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-foreground/80">{t.difficulty || "Varies"}</td>
                  <td className="px-5 py-3.5 text-foreground/80 whitespace-nowrap">{t.duration && t.duration !== "—" ? t.duration : "Varies"}</td>
                  <td className="px-5 py-3.5 text-foreground/70 hidden sm:table-cell">{t.season && t.season !== "—" ? t.season : "Varies"}</td>
                  <td className="px-5 py-3.5 text-foreground/70 hidden md:table-cell whitespace-nowrap">{t.altitude && t.altitude !== "—" ? t.altitude : "Varies"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
