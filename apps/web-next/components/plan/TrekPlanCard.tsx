"use client";

import { useState } from "react";
import Link from "next/link";
import { Mountain, Calendar, Wallet, AlertCircle, Printer, Mail, Share2, Backpack, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import ItineraryDay from "./ItineraryDay";
import OperatorInquiryForm from "@/components/operators/OperatorInquiryForm";
import { treks as staticTreks } from "@/data/treks";
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
  const trekData = plan.trek_slug ? staticTreks.find((t) => t.slug === plan.trek_slug) : null;

  async function handleShare() {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (navigator.share) {
      await navigator.share({ title: `My ${plan.trek_title} plan`, text: `Check out my personalised ${plan.trek_title} itinerary on TrekYatra`, url }).catch(() => {});
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url).catch(() => {});
    }
  }

  return (
    <div className="space-y-6 print:space-y-4">

      {/* Hero image + title card */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        {trekData?.image && (
          <div className="relative h-48 sm:h-56 overflow-hidden">
            <img src={trekData.image} alt={plan.trek_title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" />
            <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
              <div>
                <h2 className="font-display text-2xl sm:text-3xl font-semibold text-surface leading-tight">
                  {plan.trek_title}
                </h2>
                {plan.difficulty && (
                  <span className="inline-block mt-1 text-xs px-2.5 py-1 rounded-full bg-accent text-accent-foreground font-semibold">
                    {plan.difficulty}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="p-5">
          {!trekData?.image && (
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div>
                <h2 className="font-display text-2xl font-semibold text-foreground mb-1">{plan.trek_title}</h2>
                {plan.difficulty && (
                  <span className="inline-block text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">{plan.difficulty}</span>
                )}
              </div>
            </div>
          )}

          {/* Match tags — why we picked this */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-pine/10 text-pine border border-pine/20">
              <CheckCircle2 className="h-3 w-3" /> Matched your criteria
            </span>
            {plan.best_month && (
              <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-blue-400/10 text-blue-500 border border-blue-400/20">
                <Calendar className="h-3 w-3" /> {plan.best_month}
              </span>
            )}
            {plan.difficulty && (
              <span className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
                <Mountain className="h-3 w-3" /> {plan.difficulty}
              </span>
            )}
          </div>

          {/* Cost estimate — render as HTML (LLM returns formatted markdown/HTML) */}
          {plan.cost_estimate && (
            <div className="p-4 bg-accent/5 border border-accent/20 rounded-xl mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Wallet className="h-4 w-4 text-accent flex-shrink-0" />
                <span className="text-xs text-muted-foreground font-medium">Estimated cost per person</span>
              </div>
              {plan.cost_estimate.includes("<") ? (
                // LLM returned HTML — render safely (content is from our own trusted LLM)
                <div
                  className="prose prose-sm max-w-none text-foreground/80 [&_h3]:text-sm [&_h3]:font-semibold [&_table]:text-xs [&_td]:p-1 [&_th]:p-1"
                  dangerouslySetInnerHTML={{ __html: plan.cost_estimate }}
                />
              ) : (
                <div className="font-semibold text-foreground text-sm">{plan.cost_estimate}</div>
              )}
            </div>
          )}

          {plan.permit_note && (
            <div className="flex items-start gap-2 text-sm text-muted-foreground mb-4">
              <AlertCircle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <span>{plan.permit_note}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2 print:hidden">
            {plan.trek_slug && (
              <Link href={`/trek/${plan.trek_slug}`}>
                <Button variant="hero" size="sm" className="gap-1.5">
                  View full trek guide <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
            <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5">
              <Share2 className="h-3.5 w-3.5" /> Share plan
            </Button>
            <Button variant="outline" size="sm" onClick={() => window.print()} className="gap-1.5">
              <Printer className="h-3.5 w-3.5" /> Print
            </Button>
          </div>
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

      {/* Gear essentials — visual pills */}
      {plan.gear_essentials.length > 0 && (
        <div className="bg-card rounded-2xl border border-border p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <Backpack className="h-4 w-4 text-accent" /> Essential gear
          </h3>
          <div className="flex flex-wrap gap-2">
            {plan.gear_essentials.map((item, i) => {
              // Strip HTML tags (LLM sometimes adds <br /> or other tags)
              const clean = item.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
              return clean ? (
                <span key={i} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-card border border-border text-foreground/80">
                  <CheckCircle2 className="h-3 w-3 text-accent flex-shrink-0" /> {clean}
                </span>
              ) : null;
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Full packing list →{" "}
            <Link href="/packing" className="text-accent hover:underline">Packing guides</Link>
          </p>
        </div>
      )}

      {/* Operator CTA — improved */}
      <div className="bg-gradient-twilight text-surface rounded-2xl p-6 print:hidden">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h3 className="font-display text-lg font-semibold mb-1">Book this trek with a vetted operator</h3>
            <p className="text-surface/70 text-sm">
              TrekYatra only lists operators we have verified. Get matched in 48 hours — free, no commitment.
            </p>
          </div>
        </div>
        <OperatorInquiryForm defaultTrekInterest={plan.trek_title} />
      </div>

      {/* Email plan */}
      <div className="print:hidden bg-card rounded-2xl border border-border p-5">
        <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
          <Mail className="h-4 w-4 text-accent" /> Email this plan to yourself
        </h3>
        <EmailPlanSection onEmailPlan={onEmailPlan} />
      </div>

    </div>
  );
}
