import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Download, Mountain } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type Block = {
  eyebrow?: string;
  title: string;
  body?: string;
  bullets?: string[];
  cards?: { title: string; body: string; value?: string }[];
  cta?: { label: string; to: string };
};

export function ContentPage({
  eyebrow,
  title,
  subtitle,
  icon: Icon = Mountain,
  tone = "default",
  blocks = [],
  showDownload = false,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  icon?: LucideIcon;
  tone?: "default" | "trust" | "monetize" | "calm";
  blocks?: Block[];
  showDownload?: boolean;
}) {
  const heroBg = tone === "trust" ? "bg-gradient-pine text-surface" : tone === "calm" ? "bg-mist" : tone === "monetize" ? "bg-gradient-twilight text-surface" : "bg-gradient-paper";
  const isLight = tone === "trust" || tone === "monetize";

  return (
    <>
      <section className={`${heroBg} py-16 md:py-24 relative overflow-hidden`}>
        <div className="container-wide relative">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${isLight ? "glass-dark" : "bg-card border border-border"} text-xs uppercase tracking-widest mb-5`}>
            <Icon className={`h-3 w-3 ${isLight ? "text-accent-glow" : "text-accent"}`} /> {eyebrow}
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-semibold leading-[0.95] mb-5 max-w-4xl">{title}</h1>
          <p className={`text-lg max-w-2xl ${isLight ? "text-surface/85" : "text-muted-foreground"}`}>{subtitle}</p>
          {showDownload && (
            <div className="flex flex-wrap gap-3 mt-8">
              <Button variant="hero" size="lg"><Download className="h-4 w-4" /> Download PDF</Button>
              <Button variant={isLight ? "glass" : "outline"} size="lg">Save for later</Button>
            </div>
          )}
        </div>
      </section>

      <section className="py-16">
        <div className="container-narrow space-y-16">
          {blocks.map((b, i) => (
            <div key={i}>
              {b.eyebrow && <div className="text-xs uppercase tracking-[0.25em] text-accent mb-2">{b.eyebrow}</div>}
              <h2 className="font-display text-3xl md:text-4xl font-semibold leading-tight mb-5">{b.title}</h2>
              {b.body && <p className="text-foreground/85 text-lg leading-relaxed mb-5">{b.body}</p>}
              {b.bullets && (
                <ul className="grid md:grid-cols-2 gap-3 mb-5">
                  {b.bullets.map(x => (
                    <li key={x} className="flex items-start gap-2.5 p-4 bg-card border border-border rounded-xl">
                      <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{x}</span>
                    </li>
                  ))}
                </ul>
              )}
              {b.cards && (
                <div className="grid md:grid-cols-3 gap-4">
                  {b.cards.map(c => (
                    <div key={c.title} className="p-6 bg-card border border-border rounded-2xl">
                      {c.value && <div className="font-display text-3xl font-semibold text-accent mb-2">{c.value}</div>}
                      <div className="font-display text-lg font-semibold mb-2">{c.title}</div>
                      <div className="text-sm text-muted-foreground">{c.body}</div>
                    </div>
                  ))}
                </div>
              )}
              {b.cta && (
                <Link href={b.cta.to} className="inline-flex items-center gap-1 text-accent font-medium mt-4">
                  {b.cta.label} <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
