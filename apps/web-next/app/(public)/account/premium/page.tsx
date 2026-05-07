"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Crown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import SubscriptionStatusCard from "@/components/subscription/SubscriptionStatusCard";
import {
  fetchSubscriptionStatus,
  createSubscriptionCheckout,
  cancelSubscription,
  type SubscriptionStatus,
} from "@/lib/api";

export default function AccountPremiumPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) {
      router.push("/auth/sign-in?next=/account/premium");
      return;
    }
    if (user) {
      fetchSubscriptionStatus()
        .then(setStatus)
        .catch(() => setStatus({ has_subscription: false, plan: user.subscription_plan ?? "free", status: null, current_period_end: null, stripe_customer_id: null }))
        .finally(() => setLoadingStatus(false));
    }
  }, [user, isLoading, router]);

  async function handleUpgrade() {
    const result = await createSubscriptionCheckout("monthly");
    window.location.href = result.checkout_url;
  }

  async function handleCancel() {
    await cancelSubscription();
    const updated = await fetchSubscriptionStatus();
    setStatus(updated);
  }

  if (isLoading || loadingStatus) {
    return (
      <div className="container-wide py-12 max-w-2xl mx-auto">
        <div className="animate-pulse h-40 bg-muted rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="container-wide py-10 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Crown className="h-5 w-5 text-amber-500" />
        <h1 className="font-display text-2xl font-semibold text-foreground">Premium</h1>
      </div>

      {status && (
        <SubscriptionStatusCard
          status={status}
          onUpgrade={handleUpgrade}
          onCancel={handleCancel}
        />
      )}

      {status?.plan !== "premium" && (
        <div className="bg-accent/5 rounded-2xl border border-accent/20 p-5">
          <h2 className="font-semibold text-foreground mb-1">Why go Premium?</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Access expert route compendiums, detailed altitude guides, and ad-free content.
          </p>
          <Link href="/premium" className="text-accent text-sm font-medium hover:underline">
            View pricing plans →
          </Link>
        </div>
      )}
    </div>
  );
}
