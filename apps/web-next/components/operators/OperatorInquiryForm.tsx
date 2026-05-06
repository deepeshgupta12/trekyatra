"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { submitInquiry } from "@/lib/api";

interface Props {
  operatorSlug?: string;
  operatorName?: string;
  defaultTrekInterest?: string;
}

export default function OperatorInquiryForm({ operatorSlug, operatorName, defaultTrekInterest }: Props) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    trek_interest: defaultTrekInterest ?? "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await submitInquiry({ ...form, operator_slug: operatorSlug });
      setSuccess(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="bg-pine/10 border border-pine/20 rounded-2xl p-6 text-center">
        <p className="text-pine font-semibold mb-1">Inquiry sent!</p>
        <p className="text-white/60 text-sm">
          {operatorName ? `${operatorName} will` : "A vetted operator will"} get back to you within 48 hours.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" id="inquiry">
      {operatorName && (
        <p className="text-sm text-white/50">
          Sending inquiry to <span className="text-white font-medium">{operatorName}</span>
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-white/50 font-medium block mb-1">Full name *</label>
          <input
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-accent/50"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="text-xs text-white/50 font-medium block mb-1">Email *</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-accent/50"
            placeholder="you@email.com"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-white/50 font-medium block mb-1">Phone</label>
          <input
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-accent/50"
            placeholder="+91 9876543210"
          />
        </div>
        <div>
          <label className="text-xs text-white/50 font-medium block mb-1">Trek interest *</label>
          <input
            required
            value={form.trek_interest}
            onChange={(e) => setForm((f) => ({ ...f, trek_interest: e.target.value }))}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-accent/50"
            placeholder="e.g. Kedarkantha, Roopkund"
          />
        </div>
      </div>
      <div>
        <label className="text-xs text-white/50 font-medium block mb-1">Message</label>
        <textarea
          rows={3}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-accent/50 resize-none"
          placeholder="Any specific questions or dates in mind?"
        />
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <Button type="submit" variant="hero" className="w-full" disabled={submitting}>
        {submitting ? "Sending…" : "Send inquiry"}
      </Button>
    </form>
  );
}
