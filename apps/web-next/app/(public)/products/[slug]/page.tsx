import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check, Download, Star, Shield, FileText, CreditCard, Lock, Sparkles } from "lucide-react";

export default function ProductDetail() {
  return (
    <>
      <section className="py-12 md:py-20 bg-gradient-paper">
        <div className="container-wide grid lg:grid-cols-2 gap-12 items-start">
          <div className="relative">
            <div className="aspect-[4/5] rounded-3xl overflow-hidden stack-shadow">
              <img src="/images/hero-himalaya-dawn.jpg" alt="" className="w-full h-full object-cover" />
            </div>
            <div className="absolute -bottom-4 -right-4 bg-card border border-border rounded-2xl p-4 stack-shadow">
              <div className="flex items-center gap-1 text-warning mb-1">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}
              </div>
              <div className="text-xs text-muted-foreground">4.9 · 1,247 trekkers</div>
            </div>
          </div>
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border text-xs uppercase tracking-widest mb-4">
              <Sparkles className="h-3 w-3 text-accent" /> Bestseller
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-4">The Himalayan Packing System</h1>
            <p className="text-lg text-muted-foreground mb-6">A 24-page printable PDF planner that turns Himalayan trek packing from anxiety into a 30-minute checklist.</p>
            <div className="flex items-baseline gap-3 mb-8">
              <div className="font-display text-4xl font-semibold">₹299</div>
              <div className="text-lg text-muted-foreground line-through">₹599</div>
              <div className="text-xs px-2 py-1 rounded-full bg-success/15 text-success font-medium">50% off · 2 days left</div>
            </div>
            <div className="space-y-2 mb-8">
              {["Season-tuned checklists (winter, summer, monsoon)", "Beginner & advanced versions", "Printable A4 + Notion template", "Lifetime updates"].map(b => (
                <div key={b} className="flex items-center gap-2.5 text-sm"><Check className="h-4 w-4 text-success" /> {b}</div>
              ))}
            </div>
            <div className="flex gap-3 mb-6">
              <Button variant="hero" size="lg" className="flex-1"><CreditCard className="h-4 w-4" /> Buy now · ₹299</Button>
              <Button variant="outline" size="lg">Preview</Button>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><Lock className="h-3.5 w-3.5" /> Secure checkout</span>
              <span className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> 7-day refund</span>
              <span className="flex items-center gap-1.5"><Download className="h-3.5 w-3.5" /> Instant download</span>
            </div>
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="container-narrow">
          <h2 className="font-display text-3xl font-semibold mb-6">What&apos;s inside</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { t: "Master checklist", d: "120+ items across 8 categories" },
              { t: "Season modifiers", d: "Add/remove for winter, summer, monsoon" },
              { t: "Trek-specific add-ons", d: "Snow treks, monsoon Sahyadris, high-altitude" },
              { t: "Printable & digital", d: "A4 PDF + Notion template + Google Sheet" },
            ].map(x => (
              <div key={x.t} className="p-5 bg-card border border-border rounded-xl">
                <FileText className="h-5 w-5 text-accent mb-2" />
                <div className="font-display text-lg font-semibold">{x.t}</div>
                <div className="text-sm text-muted-foreground mt-1">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
