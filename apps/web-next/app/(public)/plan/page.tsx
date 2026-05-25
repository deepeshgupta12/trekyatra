"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft, Mountain, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import WizardStep from "@/components/plan/WizardStep";
import AuthGateModal from "@/components/plan/AuthGateModal";
import { planRecommendTreks, type PlanRecommendRequest } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";

// ── Wizard data ──────────────────────────────────────────────────────────────

const INTENT_OPTIONS = [
  { value: "beginner",     label: "Beginner-friendly trek",       emoji: "🌱" },
  { value: "snow",         label: "Snow trek",                    emoji: "❄️" },
  { value: "valley",       label: "Valley / meadow trek",         emoji: "🌸" },
  { value: "adventure",    label: "Adventure / challenging trek",  emoji: "⛰️" },
  { value: "weekend",      label: "Weekend trek (1–3 days)",       emoji: "🏕️" },
  { value: "family",       label: "Family-friendly trek",          emoji: "👨‍👩‍👧" },
  { value: "solo",         label: "Solo traveller-friendly",       emoji: "🧑" },
  { value: "photography",  label: "Scenic photography trek",       emoji: "📸" },
  { value: "spiritual",    label: "Spiritual / temple trek",       emoji: "🙏" },
];

const MONTH_OPTIONS = [
  { value: "Jan,Feb",     label: "Jan – Feb",   hint: "Winter" },
  { value: "Mar,Apr",     label: "Mar – Apr",   hint: "Spring" },
  { value: "May,Jun",     label: "May – Jun",   hint: "Summer" },
  { value: "Jul,Aug",     label: "Jul – Aug",   hint: "Monsoon" },
  { value: "Sep,Oct",     label: "Sep – Oct",   hint: "Autumn" },
  { value: "Nov,Dec",     label: "Nov – Dec",   hint: "Early winter" },
];

const DURATION_OPTIONS = [
  { value: "1,3",   label: "1–3 days",  hint: "Weekend" },
  { value: "4,5",   label: "4–5 days",  hint: "Long weekend" },
  { value: "6,7",   label: "6–7 days",  hint: "1 week" },
  { value: "8,10",  label: "8–10 days", hint: "Extended" },
  { value: "1,30",  label: "Flexible",  hint: "Any duration" },
];

const EXPERIENCE_OPTIONS = [
  { value: "never",       label: "Never trekked before",           diff: "Easy only" },
  { value: "easy",        label: "Done 1–2 easy treks",            diff: "Easy–Moderate" },
  { value: "moderate",    label: "Comfortable with moderate treks", diff: "Moderate" },
  { value: "experienced", label: "Experienced trekker",             diff: "Any" },
  { value: "expert",      label: "Expert / expedition-style",       diff: "Challenging" },
];

const FITNESS_OPTIONS = [
  { value: "low",      label: "Low",      hint: "Mostly sedentary" },
  { value: "average",  label: "Average",  hint: "Some activity" },
  { value: "good",     label: "Good",     hint: "Regular exercise" },
  { value: "very_good", label: "Very good", hint: "Athlete / gym-goer" },
];

const REGION_OPTIONS = [
  "Uttarakhand", "Himachal Pradesh", "Kashmir", "Ladakh",
  "Sikkim", "Maharashtra / Sahyadris", "Karnataka / Western Ghats", "North East",
];

const BUDGET_OPTIONS = [
  { value: "0,5000",       label: "Under ₹5,000" },
  { value: "5000,10000",   label: "₹5,000–₹10,000" },
  { value: "10000,15000",  label: "₹10,000–₹15,000" },
  { value: "15000,25000",  label: "₹15,000–₹25,000" },
  { value: "25000,99999",  label: "₹25,000+" },
  { value: "0,99999",      label: "Flexible" },
];

// ── Component ────────────────────────────────────────────────────────────────

const pillCls = (active: boolean) =>
  `px-4 py-2.5 rounded-xl border text-sm font-medium transition-all cursor-pointer select-none
   ${active
     ? "bg-accent text-accent-foreground border-accent shadow-sm"
     : "bg-surface border-border text-foreground/80 hover:border-accent/50 hover:bg-accent/5"}`;

export default function PlanPage() {
  const router = useRouter();
  const { user } = useAuth();

  const [step, setStep] = useState(0); // 0 = welcome
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Wizard state
  const [intents, setIntents] = useState<string[]>([]);
  const [monthChunk, setMonthChunk] = useState<string>("");
  const [durationChunk, setDurationChunk] = useState<string>("6,7");
  const [experience, setExperience] = useState<string>("moderate");
  const [fitness, setFitness] = useState<string>("average");
  const [region, setRegion] = useState<string>("");
  const [budget, setBudget] = useState<string>("5000,15000");

  const TOTAL_STEPS = 6;

  // Keep a ref to the pending payload so auth-success can fire it immediately
  const pendingPayload = useRef<PlanRecommendRequest | null>(null);

  function toggleIntent(v: string) {
    setIntents(prev => prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]);
  }

  function buildPayload(): PlanRecommendRequest {
    const months = monthChunk ? monthChunk.split(",") : [];
    const [dur_min, dur_max] = durationChunk.split(",").map(Number);
    const [bud_min, bud_max] = budget.split(",").map(Number);
    return {
      intent: intents,
      months,
      duration_min: dur_min || 1,
      duration_max: dur_max || 30,
      experience_level: experience,
      fitness_level: fitness,
      region: region || undefined,
      budget_min: bud_min || undefined,
      budget_max: bud_max || undefined,
      comfort_preferences: [],
    };
  }

  // Calls the API and navigates to results — always has a valid session when reached
  const callApi = useCallback(async (payload: PlanRecommendRequest) => {
    setLoading(true);
    setError("");
    try {
      sessionStorage.setItem("plan_request", JSON.stringify(payload));
      const result = await planRecommendTreks(payload);
      sessionStorage.setItem("plan_results", JSON.stringify(result));
      router.push("/plan/results");
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }, [router]);

  // Called when user clicks "Show My Trek Recommendations"
  async function handleSubmit() {
    const payload = buildPayload();
    pendingPayload.current = payload;

    if (!user) {
      // Not logged in — show the auth gate modal; API call deferred to handleAuthSuccess
      setShowAuthModal(true);
      return;
    }

    await callApi(payload);
  }

  // Called by AuthGateModal after successful sign-in or sign-up
  const handleAuthSuccess = useCallback(async () => {
    setShowAuthModal(false);
    if (pendingPayload.current) {
      await callApi(pendingPayload.current);
    }
  }, [callApi]);

  // Welcome screen
  if (step === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/5 flex items-center justify-center p-6">
        <div className="max-w-lg w-full text-center">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-accent/10 mb-6">
            <Mountain className="h-8 w-8 text-accent" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold mb-4 leading-tight">
            Find your ideal trek in under 60 seconds.
          </h1>
          <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
            Tell us your travel style, fitness level, preferred season, and budget.
            TrekYatra will recommend treks that match your intent.
          </p>
          <Button variant="hero" size="lg" className="w-full sm:w-auto px-12" onClick={() => setStep(1)}>
            <Sparkles className="h-4 w-4 mr-2" /> Start Planning
          </Button>
          <div className="mt-4">
            <Link href="/explore" className="text-sm text-muted-foreground hover:text-accent transition-colors">
              Browse all treks instead →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-background to-accent/5 flex items-center justify-center p-6">
        <div className="max-w-xl w-full">
          <WizardStep step={step} totalSteps={TOTAL_STEPS} title={[
            "", // 0 = welcome
            "What kind of trek are you looking for?",
            "When are you planning to go?",
            "How many days do you have?",
            "What is your trekking experience and fitness?",
            "What is your budget and preferred region?",
            "Almost done — confirm your preferences",
          ][step]}>
            {/* Step 1: Trek Intent */}
            {step === 1 && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Select all that apply.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {INTENT_OPTIONS.map(opt => (
                    <button key={opt.value} className={pillCls(intents.includes(opt.value))} onClick={() => toggleIntent(opt.value)}>
                      <span className="mr-2">{opt.emoji}</span>{opt.label}
                    </button>
                  ))}
                  <button className={pillCls(intents.length === 0)} onClick={() => setIntents([])}>
                    🎲 Not sure — recommend for me
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Month / Season */}
            {step === 2 && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {MONTH_OPTIONS.map(opt => (
                    <button key={opt.value} className={pillCls(monthChunk === opt.value)} onClick={() => setMonthChunk(opt.value)}>
                      <div className="font-medium">{opt.label}</div>
                      <div className="text-[10px] opacity-60">{opt.hint}</div>
                    </button>
                  ))}
                  <button className={pillCls(!monthChunk)} onClick={() => setMonthChunk("")}>
                    <div className="font-medium">Not decided</div>
                    <div className="text-[10px] opacity-60">Show all</div>
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Duration */}
            {step === 3 && (
              <div className="grid grid-cols-2 gap-2">
                {DURATION_OPTIONS.map(opt => (
                  <button key={opt.value} className={pillCls(durationChunk === opt.value)} onClick={() => setDurationChunk(opt.value)}>
                    <div className="font-medium">{opt.label}</div>
                    <div className="text-[10px] opacity-60">{opt.hint}</div>
                  </button>
                ))}
              </div>
            )}

            {/* Step 4: Experience + Fitness */}
            {step === 4 && (
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-medium mb-2">Trekking experience</p>
                  <div className="space-y-2">
                    {EXPERIENCE_OPTIONS.map(opt => (
                      <button key={opt.value} onClick={() => setExperience(opt.value)}
                        className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all ${experience === opt.value ? "border-accent bg-accent/5" : "border-border hover:border-accent/40"}`}>
                        <span className="font-medium">{opt.label}</span>
                        <span className="text-muted-foreground ml-2 text-xs">→ {opt.diff}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Fitness level</p>
                  <div className="grid grid-cols-2 gap-2">
                    {FITNESS_OPTIONS.map(opt => (
                      <button key={opt.value} className={pillCls(fitness === opt.value)} onClick={() => setFitness(opt.value)}>
                        <div className="font-medium">{opt.label}</div>
                        <div className="text-[10px] opacity-60">{opt.hint}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 5: Budget + Region */}
            {step === 5 && (
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-medium mb-2">Estimated budget (per person)</p>
                  <div className="grid grid-cols-2 gap-2">
                    {BUDGET_OPTIONS.map(opt => (
                      <button key={opt.value} className={pillCls(budget === opt.value)} onClick={() => setBudget(opt.value)}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Preferred region <span className="text-muted-foreground font-normal">(optional)</span></p>
                  <div className="grid grid-cols-2 gap-2">
                    {REGION_OPTIONS.map(r => (
                      <button key={r} className={pillCls(region === r)} onClick={() => setRegion(region === r ? "" : r)}>
                        {r}
                      </button>
                    ))}
                    <button className={pillCls(!region)} onClick={() => setRegion("")}>
                      No preference
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Step 6: Confirm */}
            {step === 6 && (
              <div className="space-y-3">
                <div className="bg-muted rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Trek type</span><span className="font-medium">{intents.length > 0 ? intents.join(", ") : "Any"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Season</span><span className="font-medium">{monthChunk || "Any"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-medium">{durationChunk.replace(",", "–")} days</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Experience</span><span className="font-medium">{experience}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Region</span><span className="font-medium">{region || "No preference"}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Budget</span><span className="font-medium">₹{budget.replace(",", "–₹")}</span></div>
                </div>
                {!user && (
                  <p className="text-xs text-muted-foreground text-center bg-accent/5 border border-accent/20 rounded-lg px-3 py-2">
                    You&apos;ll be asked to sign in or create a free account to view your results.
                  </p>
                )}
                {error && <p className="text-xs text-destructive bg-destructive/5 rounded-lg px-3 py-2">{error}</p>}
                <Button variant="hero" size="lg" className="w-full" onClick={handleSubmit} disabled={loading}>
                  {loading ? "Finding your best treks…" : <><Sparkles className="h-4 w-4 mr-2" /> Show My Trek Recommendations</>}
                </Button>
              </div>
            )}

            {/* Navigation */}
            <div className="flex justify-between mt-6">
              <Button variant="outline" size="sm" onClick={() => setStep(s => s - 1)} className="gap-1">
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
              {step < 6 && (
                <Button variant="default" size="sm" onClick={() => setStep(s => s + 1)} className="gap-1">
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </WizardStep>
        </div>
      </div>

      {/* Auth gate — shown only when user is not logged in and tries to submit */}
      <AuthGateModal
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
      />
    </>
  );
}
