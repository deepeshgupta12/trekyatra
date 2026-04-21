import { SiteLayout } from "@/components/layout/SiteLayout";
import type { LucideIcon } from "lucide-react";

export function SuccessHero({ icon: Icon, eyebrow, title, sub, children }: {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  sub: string;
  children?: React.ReactNode;
}) {
  return (
    <SiteLayout>
      <section className="py-20 md:py-28 bg-gradient-paper relative overflow-hidden min-h-[80vh] flex items-center">
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none">
          <svg width="100%" height="100%" viewBox="0 0 1200 600" preserveAspectRatio="none">
            <path d="M0,500 L150,420 L300,460 L450,360 L600,420 L750,300 L900,380 L1050,320 L1200,400 L1200,600 L0,600 Z" fill="hsl(var(--primary))" />
          </svg>
        </div>
        <div className="container-narrow relative text-center">
          <div className="relative inline-flex items-center justify-center mb-7">
            <div className="absolute inset-0 bg-success/30 blur-2xl rounded-full" />
            <div className="relative h-20 w-20 rounded-full bg-success/15 border border-success/30 flex items-center justify-center">
              <Icon className="h-10 w-10 text-success" strokeWidth={2.25} />
            </div>
          </div>
          <div className="text-xs uppercase tracking-[0.25em] text-accent mb-3">{eyebrow}</div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-4 max-w-2xl mx-auto">{title}</h1>
          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">{sub}</p>
          {children}
        </div>
      </section>
    </SiteLayout>
  );
}
