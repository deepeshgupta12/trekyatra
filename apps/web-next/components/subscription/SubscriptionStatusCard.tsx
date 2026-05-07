"use client";

import { useState } from "react";
import { Crown, Calendar, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import PremiumBadge from "./PremiumBadge";
import type { SubscriptionStatus } from "@/lib/api";

interface Props {
  status: SubscriptionStatus;
  onUpgrade: () => Promise<void>;
  onCancel: () => Promise<void>;
}

export default function SubscriptionStatusCard({ status, onUpgrade, onCancel }: Props) {
  const [cancelling, setCancelling] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [msg, setMsg] = useState("");

  async function handleCancel() {
    setCancelling(true);
    setMsg("");
    try {
      await onCancel();
      setMsg("Subscription will cancel at period end.");
    } catch {
      setMsg("Cancel failed — please try again.");
    } finally {
      setCancelling(false);
    }
  }

  async function handleUpgrade() {
    setUpgrading(true);
    try {
      await onUpgrade();
    } finally {
      setUpgrading(false);
    }
  }

  const isPremium = status.plan === "premium";
  const periodEndLabel = status.current_period_end
    ? new Date(status.current_period_end).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
    : null;

  return (
    <div className="bg-card rounded-2xl border border-border p-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Crown className="h-5 w-5 text-amber-500" />
            <h2 className="font-semibold text-foreground">Subscription</h2>
          </div>
          <div className="flex items-center gap-2">
            {isPremium ? (
              <PremiumBadge size="md" />
            ) : (
              <span className="text-sm text-muted-foreground font-medium">Free plan</span>
            )}
            {status.status && status.status !== "active" && (
              <span className="inline-flex items-center gap-1 text-xs text-amber-500 bg-amber-400/10 px-2 py-0.5 rounded-full border border-amber-400/20">
                <AlertCircle className="h-3 w-3" /> {status.status}
              </span>
            )}
          </div>
        </div>

        {!isPremium && (
          <Button variant="hero" size="sm" onClick={handleUpgrade} disabled={upgrading}>
            {upgrading ? "Redirecting…" : "Upgrade to Premium"}
          </Button>
        )}
      </div>

      {isPremium && periodEndLabel && (
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground mt-4">
          <Calendar className="h-3.5 w-3.5" />
          {status.status === "cancelled" ? "Access until" : "Renews"} {periodEndLabel}
        </p>
      )}

      {isPremium && status.status === "active" && (
        <button
          onClick={handleCancel}
          disabled={cancelling}
          className="text-xs text-muted-foreground hover:text-destructive underline mt-3 block"
        >
          {cancelling ? "Cancelling…" : "Cancel subscription"}
        </button>
      )}

      {msg && <p className="text-xs text-muted-foreground mt-2">{msg}</p>}
    </div>
  );
}
