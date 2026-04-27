"use client";

import { useState } from "react";
import { subscribeNewsletter } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle } from "lucide-react";

interface Props {
  sourcePage: string;
  leadMagnet?: string;
  title?: string;
  subtitle?: string;
}

export default function NewsletterCapture({
  sourcePage,
  leadMagnet,
  title = "Stay updated on treks",
  subtitle = "Get seasonal trek recommendations, permit updates, and gear guides straight to your inbox.",
}: Props) {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [alreadySubscribed, setAlreadySubscribed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (typeof window !== "undefined" && localStorage.getItem("newsletter_subscribed") === "1") {
      setDone(true);
      setAlreadySubscribed(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await subscribeNewsletter({ email, name: name || undefined, source_page: sourcePage, lead_magnet: leadMagnet });
      if (typeof window !== "undefined") localStorage.setItem("newsletter_subscribed", "1");
      setAlreadySubscribed(res.already_subscribed);
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="bg-card border border-border rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
        <CheckCircle className="h-9 w-9 text-success" />
        <p className="font-semibold">{alreadySubscribed ? "You're already subscribed!" : "You're in!"}</p>
        <p className="text-sm text-muted-foreground">
          {alreadySubscribed ? "We have your details already. Stay tuned." : "Watch your inbox for seasonal trek picks and updates."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-2xl p-6">
      <p className="font-display text-xl font-semibold mb-1">{title}</p>
      <p className="text-sm text-muted-foreground mb-4">{subtitle}</p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Your first name (optional)"
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
        {error && <p className="text-xs text-destructive">{error}</p>}
        <Button type="submit" variant="hero" className="w-full" disabled={loading}>
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Subscribing…</> : "Subscribe — it's free"}
        </Button>
        <p className="text-[10px] text-muted-foreground text-center">No spam. Unsubscribe any time.</p>
      </form>
    </div>
  );
}
