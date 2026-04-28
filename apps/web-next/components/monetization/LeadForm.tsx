"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { submitLead } from "@/lib/api";
import { trackEvent } from "@/lib/analytics";
import { Loader2, CheckCircle } from "lucide-react";

const TREK_OPTIONS = [
  "Kedarkantha", "Valley of Flowers", "Hampta Pass", "Triund",
  "Brahmatal", "Sandakphu", "Kuari Pass", "Roopkund",
  "Pin Parvati Pass", "Bali Pass", "Har Ki Dun", "Nag Tibba",
  "Other",
];

interface Props {
  sourcePage: string;
  sourceCluster?: string;
  ctaType?: string;
  preselectedTrek?: string;
  compact?: boolean;
}

export default function LeadForm({ sourcePage, sourceCluster, ctaType = "lead_form", preselectedTrek, compact }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [trekInterest, setTrekInterest] = useState(preselectedTrek ?? "");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await submitLead({ name, email, phone: phone || undefined, trek_interest: trekInterest, message: message || undefined, source_page: sourcePage, source_cluster: sourceCluster, cta_type: ctaType });
      trackEvent("lead_form_submit", { source_page: sourcePage, cta_type: ctaType, trek_interest: trekInterest });
      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle className="h-10 w-10 text-success" />
        <p className="font-semibold">We&apos;ve received your enquiry!</p>
        <p className="text-sm text-muted-foreground">Our team will reach out within 48 hours.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-3 ${compact ? "text-sm" : ""}`}>
      <div className="grid sm:grid-cols-2 gap-3">
        <input
          required
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
        <input
          required
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
        />
      </div>
      <input
        type="tel"
        placeholder="Phone (optional)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
      />
      <select
        required
        value={trekInterest}
        onChange={(e) => setTrekInterest(e.target.value)}
        className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 text-muted-foreground"
      >
        <option value="" disabled>Select trek interest</option>
        {TREK_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      {!compact && (
        <textarea
          placeholder="Any specific questions or requirements? (optional)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 resize-none"
        />
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <Button type="submit" variant="hero" size={compact ? "sm" : "default"} className="w-full" disabled={loading}>
        {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</> : "Send enquiry"}
      </Button>
      <p className="text-[10px] text-muted-foreground text-center">No spam. We respond within 48 hours.</p>
    </form>
  );
}
