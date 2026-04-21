"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, Check, ArrowRight } from "lucide-react";

export default function Plan() {
  return (
    <section className="bg-gradient-twilight text-surface py-16 md:py-24 relative overflow-hidden">
      <div className="container-wide grid lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-dark text-xs uppercase tracking-widest mb-5">
            <Sparkles className="h-3 w-3 text-accent-glow" /> Plan My Trek
          </div>
          <h1 className="font-display text-5xl md:text-6xl font-semibold leading-[0.95] mb-5">
            Tell us where you want to go. We&apos;ll handle the rest.
          </h1>
          <p className="text-surface/80 text-lg max-w-xl mb-6">Free planning help in 48 hours. Vetted operators, honest pricing, real human guidance.</p>
          <div className="flex items-center gap-6 text-sm text-surface/70">
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> No spam</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> No pressure</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> Vetted operators only</span>
          </div>
        </div>
        <form className="bg-card text-foreground rounded-2xl p-7 stack-shadow space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="text-xs uppercase tracking-widest text-accent mb-2">Step 1 of 3 · Your trek</div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Where would you like to trek?</label>
            <select className="w-full h-12 px-4 rounded-xl border border-border bg-surface mt-1.5">
              <option>Open to suggestions</option>
              <option>Himachal Pradesh</option>
              <option>Uttarakhand</option>
              <option>Kashmir / Ladakh</option>
              <option>Sahyadris</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Fitness level</label>
              <select className="w-full h-12 px-4 rounded-xl border border-border bg-surface mt-1.5">
                <option>Beginner</option><option>Intermediate</option><option>Advanced</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Trip length</label>
              <select className="w-full h-12 px-4 rounded-xl border border-border bg-surface mt-1.5">
                <option>3-5 days</option><option>6-8 days</option><option>9+ days</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Email</label>
            <input type="email" placeholder="you@trail.in" className="w-full h-12 px-4 rounded-xl border border-border bg-surface mt-1.5" />
          </div>
          <Button variant="hero" size="lg" className="w-full">Continue <ArrowRight className="h-4 w-4" /></Button>
        </form>
      </div>
    </section>
  );
}
