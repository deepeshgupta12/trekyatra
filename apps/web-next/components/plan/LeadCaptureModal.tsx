"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TrekRecommendation } from "@/lib/api";

interface Props {
  topTrek?: TrekRecommendation;
  onClose: () => void;
  onSubmit: (data: LeadData) => Promise<void>;
}

export interface LeadData {
  name: string;
  phone: string;
  city: string;
  travel_month: string;
  group_size: string;
}

export default function LeadCaptureModal({ topTrek, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<LeadData>({
    name: "", phone: "", city: "", travel_month: "", group_size: "2",
  });
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function setField(k: keyof LeadData, v: string) {
    setForm(p => ({ ...p, [k]: v }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Name and phone number are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await onSubmit(form);
      setSent(true);
    } catch {
      setError("Failed to send. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputCls = "w-full px-3 py-2 rounded-xl border border-border bg-surface text-sm focus:outline-none focus:ring-2 focus:ring-accent/30 transition-colors";

  if (sent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
        <div className="bg-card rounded-2xl border border-border p-8 max-w-sm w-full text-center">
          <div className="text-4xl mb-4">✅</div>
          <h3 className="font-display text-xl font-semibold mb-2">Plan sent!</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Your trek recommendations will be shared with you. Our team will follow up within 48 hours.
          </p>
          <Button variant="default" onClick={onClose} className="w-full">Continue exploring</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/40 backdrop-blur-sm p-4">
      <div className="bg-card rounded-2xl border border-border w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-4 right-4 h-8 w-8 rounded-full hover:bg-muted flex items-center justify-center">
          <X className="h-4 w-4" />
        </button>
        <div className="p-6">
          <h3 className="font-display text-xl font-semibold mb-1">Want this plan on WhatsApp?</h3>
          {topTrek && (
            <p className="text-sm text-muted-foreground mb-5">
              We&apos;ll send your top match — <strong>{topTrek.name}</strong> ({topTrek.match_score}% match) — with operator details.
            </p>
          )}

          <form className="space-y-3" onSubmit={handleSubmit}>
            {error && <p className="text-xs text-destructive bg-destructive/5 rounded-lg px-3 py-2">{error}</p>}
            <input className={inputCls} placeholder="Your name" value={form.name} onChange={e => setField("name", e.target.value)} required />
            <input className={inputCls} placeholder="Phone number (WhatsApp)" type="tel" value={form.phone} onChange={e => setField("phone", e.target.value)} required />
            <input className={inputCls} placeholder="City" value={form.city} onChange={e => setField("city", e.target.value)} />
            <select className={inputCls} value={form.travel_month} onChange={e => setField("travel_month", e.target.value)}>
              <option value="">Preferred travel month</option>
              {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select className={inputCls} value={form.group_size} onChange={e => setField("group_size", e.target.value)}>
              <option value="1">Solo</option>
              <option value="2">2 people</option>
              <option value="3-5">3–5 people</option>
              <option value="6-10">6–10 people</option>
              <option value="10+">10+ people</option>
            </select>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
              {loading ? "Sending…" : "Send My Trek Plan on WhatsApp"}
            </Button>
            <button type="button" onClick={onClose} className="w-full text-xs text-muted-foreground hover:text-foreground py-2 transition-colors">
              Continue without sharing number
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
