import { create } from "zustand";

export interface WizardAnswers {
  intent: string[];
  months: string[];
  durationMin: number;
  durationMax: number;
  fitnessLevel: string;
  experienceLevel: string;
  region: string | null;
}

const DEFAULT: WizardAnswers = {
  intent: [],
  months: [],
  durationMin: 1,
  durationMax: 30,
  fitnessLevel: "average",
  experienceLevel: "moderate",
  region: null,
};

interface PlanWizardStore {
  answers: WizardAnswers;
  setIntent: (v: string[]) => void;
  setMonths: (v: string[]) => void;
  setDuration: (min: number, max: number) => void;
  setFitness: (v: string) => void;
  setExperience: (v: string) => void;
  setRegion: (v: string | null) => void;
  reset: () => void;
}

export const usePlanWizardStore = create<PlanWizardStore>((set) => ({
  answers: { ...DEFAULT },
  setIntent: (v) => set((s) => ({ answers: { ...s.answers, intent: v } })),
  setMonths: (v) => set((s) => ({ answers: { ...s.answers, months: v } })),
  setDuration: (min, max) => set((s) => ({ answers: { ...s.answers, durationMin: min, durationMax: max } })),
  setFitness: (v) => set((s) => ({ answers: { ...s.answers, fitnessLevel: v } })),
  setExperience: (v) => set((s) => ({ answers: { ...s.answers, experienceLevel: v } })),
  setRegion: (v) => set((s) => ({ answers: { ...s.answers, region: v } })),
  reset: () => set({ answers: { ...DEFAULT } }),
}));
