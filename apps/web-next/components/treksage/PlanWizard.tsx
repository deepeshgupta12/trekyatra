"use client";

import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Map } from "lucide-react";

interface PlanWizardProps {
  onComplete: (prompt: string) => void;
  onClose: () => void;
}

// ── Wizard step definitions ───────────────────────────────────────────────────

const STEPS = [
  {
    id: "region",
    title: "Where do you want to trek?",
    subtitle: "Pick a region in India",
    multi: false,
    options: ["Himachal Pradesh", "Uttarakhand", "Ladakh / Jammu & Kashmir", "Sikkim / North East", "Maharashtra / Western Ghats", "Anywhere in India"],
  },
  {
    id: "duration",
    title: "How long is your trip?",
    subtitle: "Including travel days",
    multi: false,
    options: ["Weekend (2–3 days)", "Short (4–5 days)", "Week (6–7 days)", "Extended (8+ days)"],
  },
  {
    id: "difficulty",
    title: "What difficulty level?",
    subtitle: "Be honest — safety first!",
    multi: false,
    options: ["Easy (first timer)", "Moderate (some hiking experience)", "Difficult (regular trekker)", "Expert (high-altitude experience)"],
  },
  {
    id: "budget",
    title: "What's your budget per person?",
    subtitle: "Including trek fee, transport & gear",
    multi: false,
    options: ["Under ₹5,000", "₹5,000 – ₹10,000", "₹10,000 – ₹20,000", "₹20,000+"],
  },
  {
    id: "month",
    title: "Which month are you planning?",
    subtitle: "Seasons matter a lot in India",
    multi: false,
    options: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  },
  {
    id: "group",
    title: "Who's going?",
    subtitle: "Group size affects operator options",
    multi: false,
    options: ["Solo", "Couple (2 people)", "Small group (3–8)", "Large group (9+)"],
  },
  {
    id: "preferences",
    title: "Any special preferences?",
    subtitle: "Select all that apply",
    multi: true,
    options: ["Beginner-friendly trail", "Family-friendly (kids OK)", "No permit required", "High altitude (above 14,000 ft)", "Photography focus", "No preference"],
  },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export default function PlanWizard({ onComplete, onClose }: PlanWizardProps) {
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, string[]>>({});

  const current = STEPS[step];
  const currentSelections = selections[current.id] ?? [];
  const canProceed = currentSelections.length > 0;
  const isLast = step === STEPS.length - 1;

  function toggle(option: string) {
    setSelections((prev) => {
      const cur = prev[current.id] ?? [];
      if (current.multi) {
        if (option === "No preference") return { ...prev, [current.id]: ["No preference"] };
        const filtered = cur.filter((v) => v !== "No preference");
        return {
          ...prev,
          [current.id]: filtered.includes(option)
            ? filtered.filter((v) => v !== option)
            : [...filtered, option],
        };
      }
      return { ...prev, [current.id]: [option] };
    });
  }

  function buildPrompt(): string {
    const r = selections;
    const parts: string[] = [];
    if (r.region?.[0]) parts.push(`in ${r.region[0]}`);
    if (r.duration?.[0]) parts.push(`for a ${r.duration[0].toLowerCase()}`);
    if (r.difficulty?.[0]) parts.push(`at ${r.difficulty[0].toLowerCase()} difficulty`);
    if (r.budget?.[0]) parts.push(`with a budget of ${r.budget[0].toLowerCase()} per person`);
    if (r.month?.[0]) parts.push(`in ${r.month[0]}`);
    if (r.group?.[0]) parts.push(`for ${r.group[0].toLowerCase()}`);
    const prefs = (r.preferences ?? []).filter((p) => p !== "No preference");
    if (prefs.length > 0) parts.push(`with preferences: ${prefs.join(", ").toLowerCase()}`);

    return `Plan a trek ${parts.join(", ")}. Give me your top 3 recommendations with trek name, difficulty, duration, budget estimate, and why it matches my profile. Include any permit notes and safety tips.`;
  }

  function handleNext() {
    if (isLast) {
      onComplete(buildPrompt());
    } else {
      setStep((s) => s + 1);
    }
  }

  // Month step uses a grid layout
  const isMonthStep = current.id === "month";
  const isPreferencesStep = current.id === "preferences";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1D3A2E]/8">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-[#1D3A2E] flex items-center justify-center">
              <Map className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-display font-semibold text-[#1D3A2E] text-sm">Plan My Trek</p>
              <p className="text-[#1D3A2E]/40 text-[10px]">Step {step + 1} of {STEPS.length}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#1D3A2E]/40 hover:text-[#1D3A2E] transition-colors p-1 rounded-xl hover:bg-[#1D3A2E]/5">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress bar */}
        <div className="h-1 bg-[#1D3A2E]/8">
          <div
            className="h-1 bg-[#E8702A] transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Step content */}
        <div className="px-6 py-5">
          <h3 className="font-display font-semibold text-[#1D3A2E] text-lg mb-0.5">{current.title}</h3>
          <p className="text-[#1D3A2E]/45 text-sm mb-4">{current.subtitle}</p>

          <div className={isMonthStep ? "grid grid-cols-4 gap-1.5" : isPreferencesStep ? "grid grid-cols-2 gap-1.5" : "space-y-1.5"}>
            {current.options.map((option) => {
              const selected = currentSelections.includes(option);
              return (
                <button
                  key={option}
                  onClick={() => toggle(option)}
                  className={`text-left text-sm font-medium transition-all rounded-xl border px-3 py-2.5 ${
                    isMonthStep ? "text-center text-xs" : ""
                  } ${
                    selected
                      ? "bg-[#1D3A2E] text-white border-[#1D3A2E] shadow-sm"
                      : "bg-[#FAF5EE] text-[#1D3A2E]/70 border-[#1D3A2E]/12 hover:border-[#1D3A2E]/25 hover:bg-[#FAF5EE]"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#1D3A2E]/8 bg-[#FAF5EE]/50">
          <button
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-1.5 text-sm font-medium text-[#1D3A2E]/50 hover:text-[#1D3A2E] disabled:opacity-30 disabled:cursor-not-allowed transition-colors px-3 py-2 rounded-xl hover:bg-[#1D3A2E]/5"
          >
            <ChevronLeft className="h-4 w-4" /> Back
          </button>

          <button
            onClick={handleNext}
            disabled={!canProceed}
            className="flex items-center gap-1.5 text-sm font-semibold px-5 py-2.5 rounded-xl bg-[#E8702A] text-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#d4621f] transition-colors shadow-sm"
          >
            {isLast ? "Find My Trek ✨" : (<>Next <ChevronRight className="h-4 w-4" /></>)}
          </button>
        </div>
      </div>
    </div>
  );
}
