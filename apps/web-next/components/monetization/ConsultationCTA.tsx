import { Sparkles } from "lucide-react";
import LeadForm from "./LeadForm";

interface Props {
  sourcePage: string;
  preselectedTrek?: string;
  variant?: "inline" | "card";
}

export default function ConsultationCTA({ sourcePage, preselectedTrek, variant = "card" }: Props) {
  if (variant === "inline") {
    return (
      <div className="my-8 p-5 bg-gradient-pine rounded-2xl text-surface">
        <div className="text-xs uppercase tracking-widest text-accent-glow mb-1">Free consultation</div>
        <p className="font-display text-xl font-semibold mb-3 leading-tight">Get matched with a vetted trek operator</p>
        <p className="text-sm text-surface/80 mb-4">Free planning help. We respond within 48 hours.</p>
        <LeadForm sourcePage={sourcePage} preselectedTrek={preselectedTrek} ctaType="consultation_cta" compact />
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center">
          <Sparkles className="h-4 w-4 text-accent" />
        </div>
        <div>
          <p className="font-semibold text-sm">Plan this trek</p>
          <p className="text-xs text-muted-foreground">Free consultation — 48hr response</p>
        </div>
      </div>
      <LeadForm sourcePage={sourcePage} preselectedTrek={preselectedTrek} ctaType="consultation_cta" compact />
    </div>
  );
}
