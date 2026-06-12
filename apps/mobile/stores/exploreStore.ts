import { create } from "zustand";

export interface DurationBucket {
  label: string;
  min: number;
  max: number;
}

// Matches the buckets used by GET /api/v1/treks/filter-facets
export const DURATION_BUCKETS: DurationBucket[] = [
  { label: "1–3 days", min: 1, max: 3 },
  { label: "4–6 days", min: 4, max: 6 },
  { label: "7–9 days", min: 7, max: 9 },
  { label: "10+ days", min: 10, max: 99 },
];

interface ExploreState {
  trekState: string | null;
  trekDifficulty: string | null;
  trekSeason: string | null;
  durationBucket: DurationBucket | null;

  setTrekState: (value: string | null) => void;
  setTrekDifficulty: (value: string | null) => void;
  setTrekSeason: (value: string | null) => void;
  setDurationBucket: (value: DurationBucket | null) => void;
  clearAll: () => void;
}

export const useExploreStore = create<ExploreState>((set) => ({
  trekState: null,
  trekDifficulty: null,
  trekSeason: null,
  durationBucket: null,

  setTrekState: (value) => set({ trekState: value }),
  setTrekDifficulty: (value) => set({ trekDifficulty: value }),
  setTrekSeason: (value) => set({ trekSeason: value }),
  setDurationBucket: (value) => set({ durationBucket: value }),
  clearAll: () =>
    set({ trekState: null, trekDifficulty: null, trekSeason: null, durationBucket: null }),
}));
