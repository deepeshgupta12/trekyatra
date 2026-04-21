"use client";

import { useState } from "react";
import { Logo } from "@/components/brand/Logo";
import { Button } from "@/components/ui/button";
import { ArrowRight, Check } from "lucide-react";

const EXPERIENCE_LEVELS = [
  { id: "beginner", label: "Just starting out", sub: "Never done a trek before" },
  { id: "casual", label: "Casual trekker", sub: "1–5 treks completed" },
  { id: "intermediate", label: "Regular trekker", sub: "More than 5 treks, some high altitude" },
  { id: "expert", label: "Expert", sub: "High-altitude, technical routes" },
];

const INTERESTS = [
  "Snow treks", "Monsoon treks", "Himalayan peaks", "Forest trails",
  "Desert landscapes", "Coastal treks", "Beginner-friendly", "Camping",
];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [experience, setExperience] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [name, setName] = useState("");

  const toggleInterest = (i: string) =>
    setInterests(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper-grain p-6">
      <div className="w-full max-w-lg">
        <div className="flex justify-center mb-8"><Logo /></div>

        {/* Step indicators */}
        <div className="flex items-center justify-center gap-2 mb-10">
          {[1, 2, 3].map(s => (
            <div key={s} className={`h-1.5 rounded-full transition-all ${s <= step ? "bg-accent w-8" : "bg-border w-4"}`} />
          ))}
        </div>

        {step === 1 && (
          <div>
            <h1 className="font-display text-3xl font-semibold mb-2 text-center">What should we call you?</h1>
            <p className="text-muted-foreground text-center mb-8">We&apos;ll personalise your trek recommendations.</p>
            <input
              type="text"
              placeholder="Your first name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full h-12 px-4 rounded-xl border border-border bg-surface focus:border-accent outline-none mb-4"
            />
            <Button variant="hero" size="lg" className="w-full" disabled={!name.trim()} onClick={() => setStep(2)}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="font-display text-3xl font-semibold mb-2 text-center">How experienced are you?</h1>
            <p className="text-muted-foreground text-center mb-8">This helps us recommend treks at the right level.</p>
            <div className="space-y-3 mb-6">
              {EXPERIENCE_LEVELS.map(l => (
                <button
                  key={l.id}
                  onClick={() => setExperience(l.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                    experience === l.id ? "border-accent bg-accent/5" : "border-border bg-surface hover:border-accent/50"
                  }`}
                >
                  <div>
                    <p className="font-medium">{l.label}</p>
                    <p className="text-sm text-muted-foreground">{l.sub}</p>
                  </div>
                  {experience === l.id && <Check className="h-4 w-4 text-accent flex-shrink-0" />}
                </button>
              ))}
            </div>
            <Button variant="hero" size="lg" className="w-full" disabled={!experience} onClick={() => setStep(3)}>
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="font-display text-3xl font-semibold mb-2 text-center">What excites you most?</h1>
            <p className="text-muted-foreground text-center mb-8">Pick as many as you like — we&apos;ll tune your feed.</p>
            <div className="flex flex-wrap gap-2 justify-center mb-8">
              {INTERESTS.map(i => (
                <button
                  key={i}
                  onClick={() => toggleInterest(i)}
                  className={`px-4 py-2 rounded-full text-sm font-medium border transition-all ${
                    interests.includes(i) ? "border-accent bg-accent text-white" : "border-border bg-surface hover:border-accent/50"
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>
            <Button variant="hero" size="lg" className="w-full" onClick={() => {}}>
              Start exploring <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
