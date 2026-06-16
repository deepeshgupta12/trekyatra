import { loadTokens, saveTokens } from "./authStorage";
import { refreshAccessToken } from "./authApi";

const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

export interface CMSPage {
  slug: string;
  title: string;
  page_type: string;
  hero_image_url: string | null;
  trek_state: string | null;
  trek_difficulty: string | null;
  trek_duration: string | null;
  trek_altitude: string | null;
  trek_season: string | null;
  body_json: unknown[] | null;
  content_html: string;
  content_json: { sections?: Record<string, string>; [key: string]: unknown } | null;
  seo_description: string | null;
  is_published: boolean;
  published_at: string | null;
  updated_at: string | null;
}

// Shape returned by /api/v1/public/news/by-trek/{trek_slug}
export interface NewsArticle {
  slug: string;
  title: string;
  seo_description: string | null;
  hero_image_url: string | null;
  published_at: string | null;
}

// Shape returned by /api/v1/links/suggestions/{slug}
export interface RelatedPage {
  id: string;
  slug: string;
  title: string;
  page_type: string;
}

export interface TrekListItem {
  slug: string;
  title: string;
  trek_state: string | null;
  trek_difficulty: string | null;
  trek_duration: string | null;
  hero_image_url: string | null;
  trek_season: string | null;
}

// Shape returned by /api/v1/treks/filter-facets
export interface FilterFacets {
  states: string[];
  difficulties: string[];
  seasons: string[];
  suitabilities: string[];
  durations: string[];
}

// Shape returned by /api/v1/search/suggestions
export interface SearchSuggestion {
  slug: string;
  title: string;
  page_type: string;
  hero_image_url: string | null;
  seo_description: string | null;
}

// Shape returned by POST /api/v1/search/semantic
export interface SemanticSearchResult {
  slug: string;
  title: string;
  page_type: string;
  hero_image_url: string | null;
  seo_description: string | null;
  trek_state: string | null;
  trek_difficulty: string | null;
  trek_duration: string | null;
  trek_season: string | null;
  trek_suitability: string | null;
  score: number;
  matched_by: "semantic" | "text" | "hybrid";
}

export interface ExploreFilters {
  trekState?: string | null;
  trekDifficulty?: string | null;
  trekSeason?: string | null;
  trekDurationMin?: number | null;
  trekDurationMax?: number | null;
}

// Shape returned by /api/v1/cms/pages and /api/v1/treks/seasonal
interface CMSPageResponseLike {
  slug: string;
  title: string;
  hero_image_url: string | null;
  trek_state: string | null;
  trek_difficulty: string | null;
  trek_duration: string | null;
  trek_season: string | null;
}

// Shape returned by /api/v1/recommendations and /api/v1/account/recommendations
interface RecommendationItem {
  id: string;
  slug: string;
  title: string;
  page_type: string;
  hero_image_url: string | null;
  seo_description: string | null;
  published_at: string | null;
  trek_difficulty: string | null;
  trek_state: string | null;
  trek_duration: string | null;
  trek_season: string | null;
}

interface RecommendationsResponse {
  personalised: boolean;
  items: RecommendationItem[];
}

// Shape returned by /api/v1/products
export interface Product {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  price_inr: number;
  preview_image_url: string | null;
  active: boolean;
  sales_count: number;
}

// Shape returned by /api/v1/operators
export interface Operator {
  id: string;
  name: string;
  slug: string;
  region: string | null;
  trek_types: string[] | null;
  phone: string | null;
  website_url: string | null;
  logo_url: string | null;
  description_long: string | null;
  rating_avg: number | null;
  review_count: number;
  active: boolean;
}

function mapCmsPageToTrekListItem(page: CMSPageResponseLike): TrekListItem {
  return {
    slug: page.slug,
    title: page.title,
    trek_state: page.trek_state,
    trek_difficulty: page.trek_difficulty,
    trek_duration: page.trek_duration,
    hero_image_url: page.hero_image_url,
    trek_season: page.trek_season,
  };
}

function mapRecommendationToTrekListItem(item: RecommendationItem): TrekListItem {
  return {
    slug: item.slug,
    title: item.title,
    trek_state: item.trek_state,
    trek_difficulty: item.trek_difficulty,
    trek_duration: item.trek_duration,
    hero_image_url: item.hero_image_url,
    trek_season: item.trek_season,
  };
}

async function getAccessToken(): Promise<string | null> {
  const { access } = await loadTokens();
  return access;
}

async function fetchWithAuth(path: string, options: RequestInit = {}): Promise<Response> {
  const token = await getAccessToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const resp = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (resp.status === 401 && token) {
    const { refresh } = await loadTokens();
    if (refresh) {
      try {
        const newAccess = await refreshAccessToken(refresh);
        await saveTokens(newAccess, refresh);
        headers["Authorization"] = `Bearer ${newAccess}`;
        return fetch(`${API_BASE}${path}`, { ...options, headers });
      } catch {
        // token refresh failed — return original 401
      }
    }
  }

  return resp;
}

export async function apiGet<T>(path: string): Promise<T> {
  const resp = await fetchWithAuth(path);
  if (!resp.ok) {
    if (resp.status === 404) throw new NotFoundError(path);
    const data = await resp.json().catch(() => ({}));
    throw new Error((data as { detail?: string }).detail ?? `Request failed: ${resp.status}`);
  }
  return resp.json() as Promise<T>;
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const resp = await fetchWithAuth(path, {
    method: "POST",
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error((data as { detail?: string }).detail ?? `Request failed: ${resp.status}`);
  }
  return resp.json() as Promise<T>;
}

export class NotFoundError extends Error {
  constructor(path: string) {
    super(`Not found: ${path}`);
    this.name = "NotFoundError";
  }
}

// Content API helpers
export const contentApi = {
  getCmsPage: (slug: string) => apiGet<CMSPage>(`/api/v1/cms/pages/${slug}`),

  getTrendingTreks: async () => {
    const pages = await apiGet<CMSPageResponseLike[]>("/api/v1/cms/pages/trending");
    return pages.map(mapCmsPageToTrekListItem);
  },

  getSeasonalTreks: async (month?: number) => {
    const m = month ?? new Date().getMonth() + 1;
    const pages = await apiGet<CMSPageResponseLike[]>(`/api/v1/treks/seasonal?month=${m}`);
    return pages.map(mapCmsPageToTrekListItem);
  },

  getAnonymousRecommendations: async () => {
    const res = await apiGet<RecommendationsResponse>("/api/v1/recommendations");
    return res.items.map(mapRecommendationToTrekListItem);
  },

  getPersonalisedRecommendations: async () => {
    const res = await apiGet<RecommendationsResponse>("/api/v1/account/recommendations");
    return res.items.map(mapRecommendationToTrekListItem);
  },

  saveTrek: (slug: string) =>
    apiPost<{ id: string }>("/api/v1/account/bookmarks/by-slug", { trek_slug: slug }),

  getCmsPagesByType: (pageType: string) =>
    apiGet<CMSPage[]>(`/api/v1/cms/pages?page_type=${encodeURIComponent(pageType)}`),

  getFilterFacets: () => apiGet<FilterFacets>("/api/v1/treks/filter-facets"),

  exploreTreks: async (filters: ExploreFilters, limit: number, offset: number) => {
    const params = new URLSearchParams({
      page_type: "trek_guide",
      status: "published",
      limit: String(limit),
      offset: String(offset),
    });
    if (filters.trekState) params.set("trek_state", filters.trekState);
    if (filters.trekDifficulty) params.set("trek_difficulty", filters.trekDifficulty);
    if (filters.trekSeason) params.set("trek_season", filters.trekSeason);
    if (filters.trekDurationMin != null) params.set("trek_duration_min", String(filters.trekDurationMin));
    if (filters.trekDurationMax != null) params.set("trek_duration_max", String(filters.trekDurationMax));

    const pages = await apiGet<CMSPageResponseLike[]>(`/api/v1/cms/pages?${params.toString()}`);
    return pages.map(mapCmsPageToTrekListItem);
  },

  getSearchSuggestions: (q: string) =>
    apiGet<SearchSuggestion[]>(`/api/v1/search/suggestions?q=${encodeURIComponent(q)}`),

  getTrendingSearches: (limit = 10) =>
    apiGet<string[]>(`/api/v1/search/trending?limit=${limit}`),

  semanticSearch: (q: string, pageType?: string, limit = 8) =>
    apiPost<SemanticSearchResult[]>("/api/v1/search/semantic", {
      q,
      page_type: pageType ?? null,
      limit,
    }),

  searchTreks: async (q: string, limit = 12) => {
    const results = await apiPost<SemanticSearchResult[]>("/api/v1/search/semantic", {
      q,
      page_type: "trek_guide",
      limit,
    });
    return results.map((r) => ({
      slug: r.slug,
      title: r.title,
      hero_image_url: r.hero_image_url ?? null,
      difficulty: r.trek_difficulty ?? null,
      state: r.trek_state ?? null,
      duration: r.trek_duration ?? null,
    }));
  },

  logSearch: (query: string, clickedSlug?: string, clickedPageType?: string) =>
    apiPost<null>("/api/v1/search/log", {
      query,
      clicked_slug: clickedSlug ?? null,
      clicked_page_type: clickedPageType ?? null,
    }).catch(() => undefined),

  getProducts: () => apiGet<Product[]>("/api/v1/products"),

  getOperators: (region?: string) =>
    apiGet<Operator[]>(`/api/v1/operators${region ? `?region=${encodeURIComponent(region)}` : ""}`),

  getNewsByTrek: (slug: string, limit = 5) =>
    apiGet<NewsArticle[]>(`/api/v1/public/news/by-trek/${slug}?limit=${limit}`),

  getRelatedPages: (slug: string, limit = 5) =>
    apiGet<RelatedPage[]>(`/api/v1/links/suggestions/${slug}?limit=${limit}`),
};

// Shape sent to /api/v1/plan/recommend
export interface PlanRecommendRequest {
  intent: string[];
  months: string[];
  duration_min: number;
  duration_max: number;
  experience_level: string;
  fitness_level: string;
  region?: string;
}

// Shape returned by /api/v1/plan/recommend
export interface TrekRecommendation {
  slug: string;
  name: string;
  match_score: number;
  category: string;
  why_this_matches: string;
  warnings: string[];
  state: string | null;
  difficulty: string | null;
  duration: string | null;
  season: string | null;
  hero_image_url?: string | null;
  // Step 73: structured trek intelligence fields
  budget_min?: number | null;
  budget_max?: number | null;
  themes?: string[] | null;
  permit_required?: boolean | null;
  crowd_level?: string | null;
  permits?: string | null;
}

export interface PlanRecommendResponse {
  recommendations: TrekRecommendation[];
  total_treks_scored: number;
  no_match: boolean;
  no_match_message: string | null;
}

export const planApi = {
  recommend: (payload: PlanRecommendRequest) =>
    apiPost<PlanRecommendResponse>("/api/v1/plan/recommend", payload),
};

// ---------------------------------------------------------------------------
// Step 72 — TrekSage trek intelligence: Trek Detail Q&A + compare
// ---------------------------------------------------------------------------

export interface TrekProfile {
  slug: string;
  name: string;
  title: string;
  state: string | null;
  region: string | null;
  difficulty: string | null;
  duration: string | null;
  duration_days_min: number | null;
  duration_days_max: number | null;
  season: string | null;
  best_months: number[] | null;
  open_months: number[] | null;
  avoid_months: number[] | null;
  max_altitude_ft: number | null;
  permit_required: boolean | null;
  permit_notes: string | null;
  budget_min: number | null;
  budget_max: number | null;
  themes: string[] | null;
  crowd_level: string | null;
  beginner_friendly: boolean | null;
  solo_friendly: boolean | null;
  family_friendly: boolean | null;
  operator_available: boolean;
  is_unsafe_closed: boolean;
  suitability: string | null;
  seo_description: string | null;
  hero_image_url: string | null;
  data_confidence: Record<string, string>;
  last_verified_at: string | null;
}

export interface AskTrekQuestionResponse {
  answer: string;
  cached: boolean;
  not_verified: boolean;
}

export interface MobileChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface TrekComparisonRow {
  field: string;
  label: string;
  values: (string | number | boolean | null)[];
}

export interface CompareTreksResponse {
  treks: TrekProfile[];
  rows: TrekComparisonRow[];
  ai_summary: string | null;
}

export const trekIntelligenceApi = {
  /** Ask TrekSage a question about one trek, optionally with conversation history. */
  ask: (slug: string, question: string, history?: MobileChatTurn[]) =>
    apiPost<AskTrekQuestionResponse>(`/api/v1/treks/${slug}/ask`, {
      question,
      history: history && history.length > 0 ? history : undefined,
    }),

  /** Compare 2-4 trek_guide pages side-by-side with a cached AI trade-off summary. */
  compare: (slugs: string[]) =>
    apiPost<CompareTreksResponse>("/api/v1/treks/compare", { slugs }),
};
