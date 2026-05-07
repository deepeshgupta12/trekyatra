"use client";

import { useState } from "react";
import { Check, Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

const FREE_FEATURES = [
  "All trek guides (basic view)",
  "Packing lists and permits",
  "Seasonal hubs",
  "Operator directory",
  "Trip planning wizard",
  "Newsletter",
];

const PREMIUM_FEATURES = [
  "Everything in Free",
  "Expert route compendiums",
  "Detailed altitude profiles",
  "Advanced gear guides",
  "Priority operator introductions",
  "Ad-free reading experience",
];

interface Props {
  onSubscribe: (interval: "monthly" | "annual") => Promise<void>;
}

export default function PricingTable({ onSubscribe }: Props) {
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly");
  const [loading, setLoading] = useState(false);

  async function handleSubscribe() {
    setLoading(true);
    try {
      await onSubscribe(interval);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Billing toggle */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setInterval("monthly")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${interval === "monthly" ? "bg-accent text-white" : "text-muted-foreground hover:text-foreground"}`}
        >
          Monthly
        </button>
        <button
          onClick={() => setInterval("annual")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${interval === "annual" ? "bg-accent text-white" : "text-muted-foreground hover:text-foreground"}`}
        >
          Annual <span className="text-xs text-success font-normal ml-1">Save 20%</span>
        </button>
      </div>

      {/* Tier cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-2xl mx-auto">
        {/* Free */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h3 className="font-semibold text-foreground mb-1">Free</h3>
          <p className="text-3xl font-display font-bold text-foreground mb-1">₹0</p>
          <p className="text-xs text-muted-foreground mb-5">Forever free</p>
          <ul className="space-y-2 mb-6">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" /> {f}
              </li>
            ))}
          </ul>
          <Button variant="outline" className="w-full" disabled>Current plan</Button>
        </div>

        {/* Premium */}
        <div className="bg-card rounded-2xl border-2 border-accent p-6 relative overflow-hidden">
          <div className="absolute top-3 right-3">
            <Crown className="h-5 w-5 text-amber-500" />
          </div>
          <h3 className="font-semibold text-foreground mb-1">Premium</h3>
          <p className="text-3xl font-display font-bold text-foreground mb-1">
            {interval === "monthly" ? "₹299" : "₹2,390"}
          </p>
          <p className="text-xs text-muted-foreground mb-5">
            {interval === "monthly" ? "per month" : "per year (₹199/mo)"}
          </p>
          <ul className="space-y-2 mb-6">
            {PREMIUM_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                <Check className="h-4 w-4 text-accent mt-0.5 flex-shrink-0" /> {f}
              </li>
            ))}
          </ul>
          <Button variant="hero" className="w-full" onClick={handleSubscribe} disabled={loading}>
            {loading ? "Redirecting to checkout…" : `Start ${interval} plan`}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Powered by Stripe. Cancel anytime. Test mode active when no Stripe keys are configured.
      </p>
    </div>
  );
}
