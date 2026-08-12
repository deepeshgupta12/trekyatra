import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export interface HeroStat {
  icon: LucideIcon;
  label: string;
}

/**
 * Shared hub hero — one H1 per page, an intro paragraph tagged `.hub-intro` (used by the page's
 * SpeakableSpecification for voice/AEO), and an optional row of stat chips. Used by the difficulty
 * pages and the index hubs so they all share one hero treatment.
 */
export function HubHero({
  eyebrow,
  title,
  intro,
  stats,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: ReactNode;
  stats?: HeroStat[];
  children?: ReactNode;
}) {
  return (
    <section className="py-12 container-wide">
      <div className="max-w-2xl">
        <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">{eyebrow}</div>
        <h1 className="font-display text-4xl md:text-5xl font-semibold text-foreground mb-4 leading-tight">{title}</h1>
        <p className="hub-intro text-muted-foreground text-lg mb-6 leading-relaxed">{intro}</p>
        {stats && stats.length > 0 && (
          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            {stats.map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-accent" /> {label}
              </span>
            ))}
          </div>
        )}
      </div>
      {children && <div className="max-w-3xl mt-8">{children}</div>}
    </section>
  );
}

/**
 * Shared content section — consistent H2 (with optional leading icon) + body. Keeps the H1 → H2 → H3
 * hierarchy uniform across every hub page.
 */
export function HubSection({
  title,
  icon: Icon,
  children,
  className = "",
}: {
  title?: string;
  icon?: LucideIcon;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      {title && (
        <h2 className="font-display text-2xl font-semibold text-foreground mb-4 flex items-center gap-2">
          {Icon && <Icon className="h-5 w-5 text-accent" />}
          {title}
        </h2>
      )}
      {children}
    </div>
  );
}

/**
 * Shared FAQ block wrapper — renders the `.hub-faq` container (the FAQ half of the page's
 * SpeakableSpecification) with a consistent H2. The actual accordion UI is FAQAccordion, and the
 * FAQPage JSON-LD is emitted separately via buildFAQSchema so markup and UI never drift.
 */
export function HubFAQSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="hub-faq py-12 container-wide border-t border-border">
      <div className="max-w-3xl">
        <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground mb-6">{heading}</h2>
        {children}
      </div>
    </section>
  );
}
