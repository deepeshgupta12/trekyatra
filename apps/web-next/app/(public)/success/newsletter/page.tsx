import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail, Calendar, Sparkles, Mountain, ArrowRight } from "lucide-react";
import { SuccessHero } from "@/components/success/SuccessHero";

export default function NewsletterSuccess() {
  return (
    <SuccessHero icon={Mail} eyebrow="You're in" title="Welcome to The Trail Letter" sub="Confirm your email — we just sent a single-tap verification link to your inbox.">
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
        <Button variant="hero" size="lg">Open email app</Button>
        <Link href="/explore"><Button variant="outline" size="lg">Browse treks <ArrowRight className="h-4 w-4" /></Button></Link>
      </div>
      <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left">
        {[
          { i: Calendar, t: "First letter", d: "Arrives next Sunday" },
          { i: Sparkles, t: "Curation", d: "Seasonal picks for your region" },
          { i: Mountain, t: "No spam", d: "One slow email a month" },
        ].map(b => (
          <div key={b.t} className="p-5 bg-card border border-border rounded-2xl">
            <b.i className="h-5 w-5 text-accent mb-2" />
            <div className="font-display font-semibold mb-1">{b.t}</div>
            <div className="text-sm text-muted-foreground">{b.d}</div>
          </div>
        ))}
      </div>
    </SuccessHero>
  );
}
