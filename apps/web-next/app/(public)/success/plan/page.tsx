import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight } from "lucide-react";
import { SuccessHero } from "@/components/success/SuccessHero";

export default function PlanSuccess() {
  return (
    <SuccessHero icon={CheckCircle2} eyebrow="Enquiry received" title="We've got it. Now it's our turn." sub="A real human from our planning team will reach out within 48 hours.">
      <div className="bg-card border border-border rounded-2xl p-6 max-w-xl mx-auto text-left mb-8">
        <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">What happens next</div>
        <div className="space-y-4">
          {[
            { n: "01", t: "Within 4 hours", d: "Confirmation email with your enquiry summary" },
            { n: "02", t: "Within 48 hours", d: "3 vetted operator quotes + an editor recommendation" },
            { n: "03", t: "Within 5 days", d: "Curated itinerary, packing list and permit checklist" },
          ].map(s => (
            <div key={s.n} className="flex gap-4">
              <div className="font-display text-2xl font-semibold text-accent w-10 flex-shrink-0">{s.n}</div>
              <div><div className="font-semibold">{s.t}</div><div className="text-sm text-muted-foreground">{s.d}</div></div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/account/enquiries"><Button variant="hero" size="lg">Track your enquiry</Button></Link>
        <Link href="/explore"><Button variant="outline" size="lg">Keep exploring</Button></Link>
      </div>
    </SuccessHero>
  );
}
