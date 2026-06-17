"use client";

import { useState } from "react";
import { X, CheckCircle, Loader2 } from "lucide-react";

interface LeadCaptureModalProps {
  onClose: () => void;
  prefillTrekInterest?: string;
  prefillMonth?: string;
}

const MONTHS = ["January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"];

export default function LeadCaptureModal({ onClose, prefillTrekInterest = "", prefillMonth = "" }: LeadCaptureModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [trekInterest, setTrekInterest] = useState(prefillTrekInterest);
  const [month, setMonth] = useState(prefillMonth);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !trekInterest.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${apiBase}/api/v1/leads/operator-help`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim() || null,
          trek_interest: trekInterest.trim(),
          travel_month: month || null,
          consent: true,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { detail?: string }).detail ?? `Error ${res.status}`);
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#1D3A2E]">
          <div>
            <p className="font-display font-semibold text-white text-sm">Get Expert Help</p>
            <p className="text-white/50 text-[10px]">A TrekYatra specialist will reach out within 24 hours</p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white transition-colors p-1 rounded-xl hover:bg-white/10">
            <X className="h-4 w-4" />
          </button>
        </div>

        {success ? (
          <div className="px-6 py-10 flex flex-col items-center gap-4 text-center">
            <CheckCircle className="h-12 w-12 text-emerald-500" />
            <div>
              <p className="font-display font-semibold text-[#1D3A2E] text-lg mb-1">You're all set!</p>
              <p className="text-[#1D3A2E]/55 text-sm">
                Our trek specialists will review your details and get in touch within 24 hours.
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2.5 rounded-xl bg-[#E8702A] text-white text-sm font-semibold hover:bg-[#d4621f] transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1 space-y-1">
                <label className="text-xs font-semibold text-[#1D3A2E]/50 uppercase tracking-wide">Name *</label>
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full text-sm px-3 py-2.5 rounded-xl bg-[#FAF5EE] border border-[#1D3A2E]/12 text-[#1D3A2E] placeholder:text-[#1D3A2E]/30 focus:outline-none focus:ring-2 focus:ring-[#E8702A]/20 focus:border-[#E8702A]/40"
                />
              </div>
              <div className="col-span-2 sm:col-span-1 space-y-1">
                <label className="text-xs font-semibold text-[#1D3A2E]/50 uppercase tracking-wide">Email *</label>
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full text-sm px-3 py-2.5 rounded-xl bg-[#FAF5EE] border border-[#1D3A2E]/12 text-[#1D3A2E] placeholder:text-[#1D3A2E]/30 focus:outline-none focus:ring-2 focus:ring-[#E8702A]/20 focus:border-[#E8702A]/40"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#1D3A2E]/50 uppercase tracking-wide">Phone (optional)</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full text-sm px-3 py-2.5 rounded-xl bg-[#FAF5EE] border border-[#1D3A2E]/12 text-[#1D3A2E] placeholder:text-[#1D3A2E]/30 focus:outline-none focus:ring-2 focus:ring-[#E8702A]/20 focus:border-[#E8702A]/40"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#1D3A2E]/50 uppercase tracking-wide">Trek Interest *</label>
              <input
                required
                value={trekInterest}
                onChange={(e) => setTrekInterest(e.target.value)}
                placeholder="e.g. Kedarkantha, Ladakh treks, beginner trek in Himachal…"
                className="w-full text-sm px-3 py-2.5 rounded-xl bg-[#FAF5EE] border border-[#1D3A2E]/12 text-[#1D3A2E] placeholder:text-[#1D3A2E]/30 focus:outline-none focus:ring-2 focus:ring-[#E8702A]/20 focus:border-[#E8702A]/40"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-[#1D3A2E]/50 uppercase tracking-wide">Travel Month</label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full text-sm px-3 py-2.5 rounded-xl bg-[#FAF5EE] border border-[#1D3A2E]/12 text-[#1D3A2E] focus:outline-none focus:ring-2 focus:ring-[#E8702A]/20 focus:border-[#E8702A]/40"
              >
                <option value="">I'm flexible</option>
                {MONTHS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>

            {error && (
              <p className="text-red-500 text-xs bg-red-50 px-3 py-2 rounded-xl border border-red-100">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !name.trim() || !email.trim() || !trekInterest.trim()}
              className="w-full py-3 rounded-xl bg-[#E8702A] text-white font-semibold text-sm hover:bg-[#d4621f] disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {loading ? "Sending…" : "Request Expert Help"}
            </button>

            <p className="text-[#1D3A2E]/30 text-[10px] text-center">
              By submitting, you agree to be contacted by TrekYatra. No spam — just trek help.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
