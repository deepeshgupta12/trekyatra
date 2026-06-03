// ─── Trek ────────────────────────────────────────────────────────────────────

export interface TrekRegion {
  name: string;
  state: string;
}

export interface TrekDifficulty {
  label: "Easy" | "Moderate" | "Difficult" | "Very Difficult";
  rating: 1 | 2 | 3 | 4 | 5;
}

export interface Trek {
  id: string;
  slug: string;
  name: string;
  region: TrekRegion;
  difficulty: TrekDifficulty;
  durationDays: number;
  maxAltitudeM: number;
  heroImageUrl: string | null;
  tagline: string | null;
  permitRequired: boolean;
  bestMonths: string[];
  costInrMin: number | null;
  costInrMax: number | null;
  isPublished: boolean;
}

export interface TrekListItem {
  id: string;
  slug: string;
  name: string;
  region: TrekRegion;
  difficulty: TrekDifficulty;
  durationDays: number;
  maxAltitudeM: number;
  heroImageUrl: string | null;
  tagline: string | null;
}

// ─── CMS ─────────────────────────────────────────────────────────────────────

export type CMSPageType =
  | "trek_guide"
  | "gear_review"
  | "destination"
  | "safety"
  | "trip_report"
  | "editorial";

export interface CMSPage {
  id: string;
  slug: string;
  title: string;
  pageType: CMSPageType;
  heroImageUrl: string | null;
  excerpt: string | null;
  publishedAt: string | null;
  trekSlug: string | null;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  fullName: string | null;
  isVerified: boolean;
  createdAt: string;
}

// ─── Recommendation ───────────────────────────────────────────────────────────

export interface RecommendationItem {
  id: string;
  trekSlug: string;
  trekName: string;
  score: number;
  reason: string;
  heroImageUrl: string | null;
  difficulty: TrekDifficulty;
  durationDays: number;
}

// ─── API responses ────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface APIError {
  detail: string;
  code?: string;
}
