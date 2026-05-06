"use client";

import { useState } from "react";
import Link from "next/link";
import { Mountain, Calendar, Wallet, AlertCircle, Printer, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import ItineraryDay from "./ItineraryDay";
import OperatorInquiryForm from "@/components/operators/OperatorInquiryForm";
import type { TripPlanOutput } from "@/lib/api";

interface Props {
  plan: TripPlanOutput;
  planId: string;
  onEmailPlan: (email: string) => Promise<void>;
}

function EmailPlanSection({ onEmailPlan }: { onEmailPlan: (email: string) => Promise<void> }) {
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSend() {
    if (!email) return;
    setSending(true);
    try {
      await onEmailPlan(email);
      setSent(true);
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <p className="text-sm text-success flex items-center gap-2">
        <Mail className="h-4 w-4" /> Plan sent to {email}
      </p>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email me this plan"
        className="flex-1 px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
      />
      <Button
        variant="outline"
        size="sm"
        onClick={handleSend}
        disabled={!email || sending}
        className="gap-1.5 sm:w-auto w-full"
      >
        <Mail className="h-3.5 w-3.5" /> {sending ? "Sending…" : "Send"}
      </Button>
    </div>
  );
}

export default function TrekPlanCard({ plan, planId, onEmailPlan }: Props) {
  return (
    <div className="space-y-6 print:space-y-4">
      {/* Trek header */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-1">
              {plan.trek_title}
            </h2>
            {plan.difficulty && (
              <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
                {plan.difficulty}
              </span>
            )}
          </div>
          <div className="flex gap-2 print:hidden">
            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
            {plan.trek_slug && (
              <Link href={`/trek/${plan.trek_slug}`}>
                <Button variant="outline" size="sm">View full guide →</Button>
              </Link>
            )}
          </div>
        </div>

        {/* Meta chips */}
        <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
          {plan.best_month && (
            <span className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" /> {plan.best_month}
            </span>
          )}
          {plan.cost_estimate && (
            <span className="flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5" /> {plan.cost_estimate}
            </span>
          )}
          {plan.permit_note && (
            <span className="flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5" /> {plan.permit_note}
            </span>
          )}
        </div>
      </div>

      {/* Itinerary */}
      {plan.itinerary.length > 0 && (
        <div>
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Mountain className="h-4 w-4 text-accent" /> Day-by-day itinerary
          </h3>
          <div className="space-y-2">
            {plan.itinerary.map((day) => (
              <ItineraryDay key={day.day} day={day} />
            ))}
          </div>
        </div>
      )}

      {/* Gear essentials */}
      {plan.gear_essentials.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-3">Essential gear</h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {plan.gear_essentials.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm text-foreground/80">
                <span className="text-accent">✓</span> {item}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Email plan */}
      <div className="print:hidden">
        <EmailPlanSection onEmailPlan={onEmailPlan} />
      </div>

      {/* Operator CTA */}
      <div className="bg-accent/5 rounded-2xl border border-accent/20 p-5 print:hidden">
        <h3 className="font-semibold text-foreground mb-1">Want help booking?</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Connect with a vetted operator for this trek. Free, no pressure.
        </p>
        <OperatorInquiryForm defaultTrekInterest={plan.trek_title} />
      </div>
    </div>
  );
}
