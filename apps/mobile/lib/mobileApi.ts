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

// Shape returned by /api/v1/operators (OperatorPublicResponse)
export interface OperatorSpecialization {
  id: string;
  operator_id: string;
  trek_slug: string;
  priority: number;
}

export interface Operator {
  id: string;
  name: string;
  slug: string;
  region: string[] | null;
  trek_types: string[] | null;
  phone: string | null;
  website_url: string | null;
  logo_url: string | null;
  description_long: string | null;
  rating_avg: number;
  review_count: number;
  active: boolean;
  created_at: string;
  specializations: OperatorSpecialization[];
}

export interface OperatorReview {
  id: string;
  operator_id: string;
  user_id: string | null;
  rating: number;
  body: string | null;
  created_at: string;
}

export interface InquiryPayload {
  name: string;
  email: string;
  phone?: string | null;
  trek_interest: string;
  message?: string | null;
  operator_slug?: string | null;
}

export interface InquiryResponse {
  id: string;
  name: string;
  email: string;
  trek_interest: string;
  status: string;
  created_at: string;
}

export const operatorsApi = {
  list: (region?: string) =>
    apiGet<Operator[]>(`/api/v1/operators${region ? `?region=${encodeURIComponent(region)}` : ""}`),

  getBySlug: (slug: string) =>
    apiGet<Operator>(`/api/v1/operators/${slug}`),

  getReviews: (slug: string, limit = 20) =>
    apiGet<OperatorReview[]>(`/api/v1/operators/${slug}/reviews?limit=${limit}`),

  submitInquiry: (payload: InquiryPayload) =>
    apiPost<InquiryResponse>("/api/v1/inquiries", payload),
};

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

export async function apiDelete(path: string): Promise<void> {
  const resp = await fetchWithAuth(path, { method: "DELETE" });
  if (!resp.ok && resp.status !== 204) {
    const data = await resp.json().catch(() => ({}));
    throw new Error((data as { detail?: string }).detail ?? `Request failed: ${resp.status}`);
  }
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const resp = await fetchWithAuth(path, {
    method: "PATCH",
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

  getOperators: (region?: string) => operatorsApi.list(region),

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

// ── TrekSage conversational AI ────────────────────────────────────────────────

export interface TreksageMobileTrekCard {
  slug: string;
  name: string;
  state: string | null;
  difficulty: string | null;
  duration: string | null;
  season: string | null;
  max_altitude_ft: number | null;
  budget_min: number | null;
  budget_max: number | null;
  hero_image_url: string | null;
}

export interface TreksageMobileChatResponse {
  session_key: string;
  reply: string;
  tool_calls: Record<string, unknown>[];
  trek_cards: TreksageMobileTrekCard[];
}

export interface TreksageMobileMessage {
  role: "user" | "assistant";
  content: string;
}

export async function treksageChatMobile(
  message: string,
  sessionKey?: string,
): Promise<TreksageMobileChatResponse> {
  const res = await fetch(`${API_BASE}/api/v1/treksage/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, session_key: sessionKey }),
  });
  if (!res.ok) throw new Error(`TrekSage API ${res.status}`);
  return res.json();
}

export async function fetchTreksageHistoryMobile(
  sessionKey: string,
): Promise<TreksageMobileMessage[]> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/treksage/chat/${sessionKey}/history`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

// ── Saved Comparisons ─────────────────────────────────────────────────────────

export interface SavedComparison {
  id: string;
  name: string;
  slugs: string[];
  created_at: string;
  updated_at: string;
}

// Bookmark (saved trek) shapes from /api/v1/account/bookmarks
export interface BookmarkResponse {
  id: string;
  user_id: string;
  trek_slug: string | null;
  slug: string | null;
  title: string | null;
  page_type: string | null;
  hero_image_url: string | null;
  created_at: string;
}

// Download (purchased digital product) shapes from /api/v1/account/downloads
export interface DownloadResponse {
  id: string;
  user_id: string;
  product_id: string | null;
  order_id: string | null;
  filename: string;
  download_url: string | null;
  downloaded_at: string;
}

export const accountApi = {
  listComparisons: () =>
    apiGet<SavedComparison[]>("/api/v1/account/comparisons"),

  saveComparison: (name: string, slugs: string[]) =>
    apiPost<SavedComparison>("/api/v1/account/comparisons", { name, slugs }),

  deleteComparison: (id: string) =>
    apiDelete(`/api/v1/account/comparisons/${id}`),

  // Bookmarks (saved treks)
  listBookmarks: () =>
    apiGet<BookmarkResponse[]>("/api/v1/account/bookmarks"),

  removeBookmarkBySlug: (slug: string) =>
    apiDelete(`/api/v1/account/bookmarks/by-slug/${slug}`),

  // Downloads (purchased digital products)
  listDownloads: () =>
    apiGet<DownloadResponse[]>("/api/v1/account/downloads"),

  getDownloadUrl: (orderId: string) =>
    apiPost<{ download_url: string }>(`/api/v1/account/downloads/${orderId}/url`, {}),
};

// Newsletter
export interface NewsletterSubscribeResponse {
  subscribed: boolean;
  email: string;
}

export const newsletterApi = {
  subscribe: (email: string) =>
    apiPost<NewsletterSubscribeResponse>("/api/v1/newsletter/subscribe", { email }),
};

// Auth/me — update name, DPDP data export and delete
export interface UserMeResponse {
  id: string;
  email: string | null;
  full_name: string | null;
  is_verified_email: boolean;
}

export const authMeApi = {
  getMe: () => apiGet<UserMeResponse>("/api/v1/auth/me"),

  updateMe: (payload: { full_name?: string }) =>
    apiPatch<UserMeResponse>("/api/v1/auth/me", payload),

  getDataExportUrl: () => `${process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000"}/api/v1/auth/me/data-export`,

  deleteMyData: () => apiDelete("/api/v1/auth/me/data"),
};

// ---------------------------------------------------------------------------
// Step M09 — Plan wizard lead capture
// ---------------------------------------------------------------------------

export interface OperatorHelpLeadPayload {
  name: string;
  email: string;
  phone?: string;
  trek_slug?: string;
  trek_interest: string;
  message?: string;
  consent: boolean;
  travel_month?: string;
  traveller_count?: number;
  city?: string;
  budget_preference?: string;
  transport_required?: boolean;
  source_page?: string;
}

export interface LeadResponse {
  id: string;
  name: string;
  email: string;
  status: string;
  created_at: string;
}

export const leadsApi = {
  submitOperatorHelp: (payload: OperatorHelpLeadPayload) =>
    apiPost<LeadResponse>("/api/v1/leads/operator-help", payload),
};
