"use client";

import { useState } from "react";
import { Sparkles, Check, ArrowRight, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import WizardStep from "@/components/plan/WizardStep";
import TrekPlanCard from "@/components/plan/TrekPlanCard";
import { generatePlan, emailPlan, type TripPlan, type TripPlanOutput } from "@/lib/api";

// Stable session ID for anonymous users (persists in component lifetime)
function makeSessionId() {
  return `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

const REGIONS = ["Open to suggestions", "Uttarakhand", "Himachal Pradesh", "Kashmir / Ladakh", "Sikkim / North East", "Sahyadris (Maharashtra)"];
const EXPERIENCE_LEVELS = ["Beginner — first trek", "Intermediate — a few treks done", "Advanced — experienced trekker"];
const DURATIONS = [3, 4, 5, 6, 7, 8, 10];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const GROUP_TYPES = ["Solo", "Couple", "Small group (3–6)", "Large group (7+)"];

const selectCls = "w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40";
const inputCls = "w-full px-4 py-2.5 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40";

export default function PlanPage() {
  const [sessionId] = useState(makeSessionId);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    region: "",
    duration_days: 5,
    experience: "",
    month: "",
    budget_inr: "",
    group_size: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [plan, setPlan] = useState<TripPlan | null>(null);

  const TOTAL_STEPS = 4;

  function setField(key: keyof typeof form, value: string | number) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit() {
    setLoading(true);
    setError("");
    try {
      const result = await generatePlan({
        session_id: sessionId,
        region: form.region || null,
        duration_days: form.duration_days || null,
        experience: form.experience || null,
        month: form.month || null,
        budget_inr: form.budget_inr ? parseInt(form.budget_inr) : null,
        group_size: form.group_size || null,
        email: form.email || null,
      });
      setPlan(result);
    } catch {
      setError("Could not generate your plan. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleEmailPlan(email: string) {
    if (!plan) return;
    await emailPlan(plan.id, email);
  }

  // Build a human-readable summary of the user's selections for the result header
  const selectionSummary = [
    form.region && form.region !== "" ? form.region : null,
    form.duration_days ? `${form.duration_days} days` : null,
    form.experience ? form.experience.charAt(0).toUpperCase() + form.experience.slice(1) : null,
    form.month ? form.month.charAt(0).toUpperCase() + form.month.slice(1) : null,
    form.group_size || null,
  ].filter(Boolean).join(" · ");

  if (plan?.output) {
    return (
      <div className="container-wide py-8 max-w-3xl mx-auto">
        {/* Result header — shows what the user selected */}
        <div className="mb-6 p-4 bg-card border border-border rounded-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Your plan is ready</p>
              {selectionSummary && (
                <p className="text-sm text-foreground font-medium">{selectionSummary}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { setPlan(null); setStep(1); }} className="gap-1.5">
                <ArrowLeft className="h-3.5 w-3.5" /> New plan
              </Button>
            </div>
          </div>
        </div>
        <TrekPlanCard
          plan={plan.output as TripPlanOutput}
          planId={plan.id}
          onEmailPlan={handleEmailPlan}
        />

        {/* Alternative options */}
        <div className="text-center py-4">
          <p className="text-sm text-muted-foreground mb-2">Not quite right?</p>
          <button
            onClick={() => { setPlan(null); setStep(1); }}
            className="text-sm text-accent hover:underline font-medium"
          >
            ← Try different preferences
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-twilight text-surface py-12 md:py-16">
        <div className="container-wide max-w-xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass-dark text-xs uppercase tracking-widest mb-4">
            <Sparkles className="h-3 w-3 text-accent-glow" /> AI Trek Planner
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight mb-4">
            Find your perfect trek
          </h1>
          <p className="text-surface/80 text-lg mb-4">
            Answer 4 quick questions. Get a personalised day-by-day itinerary in seconds.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-surface/70">
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> Free</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> No signup needed</span>
            <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-success" /> AI-powered</span>
          </div>
        </div>
      </section>

      {/* Wizard card */}
      <div className="container-wide py-10 max-w-lg mx-auto">
        <div className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-sm">
          {step === 1 && (
            <WizardStep step={1} totalSteps={TOTAL_STEPS} title="Where would you like to trek?">
              <div className="space-y-4">
                <select value={form.region} onChange={(e) => setField("region", e.target.value)} className={selectCls}>
                  {REGIONS.map((r) => <option key={r} value={r === "Open to suggestions" ? "" : r}>{r}</option>)}
                </select>
                <div>
                  <label className="text-xs text-muted-foreground font-medium block mb-1.5">Preferred month</label>
                  <select value={form.month} onChange={(e) => setField("month", e.target.value)} className={selectCls}>
                    <option value="">Any time</option>
                    {MONTHS.map((m) => <option key={m} value={m.toLowerCase()}>{m}</option>)}
                  </select>
                </div>
              </div>
            </WizardStep>
          )}

          {step === 2 && (
            <WizardStep step={2} totalSteps={TOTAL_STEPS} title="Your experience and fitness">
              <div className="space-y-2.5">
                {[
                  { val: "beginner", label: "Beginner", sub: "First trek ever", emoji: "🟢" },
                  { val: "intermediate", label: "Intermediate", sub: "A few treks done", emoji: "🟡" },
                  { val: "advanced", label: "Advanced", sub: "Experienced trekker", emoji: "🔴" },
                ].map(({ val, label, sub, emoji }) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setField("experience", val)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${form.experience === val ? "border-accent bg-accent/5 ring-1 ring-accent/30" : "border-border hover:border-accent/40 bg-card"}`}
                  >
                    <span className="text-2xl">{emoji}</span>
                    <div>
                      <div className="font-medium text-sm text-foreground">{label}</div>
                      <div className="text-xs text-muted-foreground">{sub}</div>
                    </div>
                    {form.experience === val && <Check className="h-4 w-4 text-accent ml-auto" />}
                  </button>
                ))}
              </div>
            </WizardStep>
          )}

          {step === 3 && (
            <WizardStep step={3} totalSteps={TOTAL_STEPS} title="Trip length and budget">
              <div className="space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground font-medium block mb-1.5">
                    Duration: <span className="text-foreground font-semibold">{form.duration_days} days</span>
                  </label>
                  <input
                    type="range"
                    min={3} max={14} step={1}
                    value={form.duration_days}
                    onChange={(e) => setField("duration_days", parseInt(e.target.value))}
                    className="w-full accent-accent"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-1">
                    <span>3 days</span><span>14 days</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground font-medium block mb-1.5">Budget (optional, ₹ per person)</label>
                  <input
                    type="number"
                    value={form.budget_inr}
                    onChange={(e) => setField("budget_inr", e.target.value)}
                    placeholder="e.g. 15000"
                    className={inputCls}
                  />
                </div>
              </div>
            </WizardStep>
          )}

          {step === 4 && (
            <WizardStep step={4} totalSteps={TOTAL_STEPS} title="Group type and your email">
              <div className="space-y-4">
                <select value={form.group_size} onChange={(e) => setField("group_size", e.target.value)} className={selectCls}>
                  <option value="">Select group type</option>
                  {GROUP_TYPES.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
                <div>
                  <label className="text-xs text-muted-foreground font-medium block mb-1.5">Email — get plan in your inbox (optional)</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setField("email", e.target.value)}
                    placeholder="you@trail.in"
                    className={inputCls}
                  />
                </div>
                {error && <p className="text-sm text-destructive">{error}</p>}
              </div>
            </WizardStep>
          )}

          {/* Navigation */}
          <div className="flex gap-3 mt-6">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep((s) => s - 1)} className="gap-1.5 flex-1 sm:flex-none">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
            )}
            {step < TOTAL_STEPS ? (
              <Button
                variant="hero"
                onClick={() => setStep((s) => s + 1)}
                className={`gap-1.5 ${step === 1 ? "w-full" : "flex-1"}`}
              >
                Continue <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button
                variant="hero"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 gap-1.5"
              >
                {loading ? (
                  <><Sparkles className="h-3.5 w-3.5 animate-spin" /> Generating your plan…</>
                ) : (
                  <><Sparkles className="h-3.5 w-3.5" /> Generate my trek plan</>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
