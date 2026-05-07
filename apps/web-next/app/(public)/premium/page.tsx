"use client";

import { Crown } from "lucide-react";
import PricingTable from "@/components/subscription/PricingTable";
import { createSubscriptionCheckout } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";

export default function PremiumPage() {
  const { user } = useAuth();
  const router = useRouter();

  async function handleSubscribe(interval: "monthly" | "annual") {
    if (!user) {
      router.push("/auth/sign-in?next=/premium");
      return;
    }
    try {
      const result = await createSubscriptionCheckout(interval);
      window.location.href = result.checkout_url;
    } catch {
      // fallback
    }
  }

  return (
    <div className="container-wide py-12 max-w-3xl mx-auto">
      {/* Hero */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-400/10 text-amber-500 text-xs font-medium border border-amber-400/20 mb-4">
          <Crown className="h-3.5 w-3.5" /> TrekYatra Premium
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-semibold text-foreground mb-3">
          Unlock expert trek intelligence
        </h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Detailed route compendiums, expert gear guides, altitude profiles, and ad-free reading — everything a serious trekker needs.
        </p>
      </div>

      <PricingTable onSubscribe={handleSubscribe} />
    </div>
  );
}
