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
  seo_description: string | null;
  is_published: boolean;
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

  getTrendingTreks: () => apiGet<TrekListItem[]>("/api/v1/treks/trending"),

  getSeasonalTreks: (month?: number) => {
    const m = month ?? new Date().getMonth() + 1;
    return apiGet<TrekListItem[]>(`/api/v1/treks/seasonal?month=${m}`);
  },

  getAnonymousRecommendations: (regions: string[], difficulties: string[]) =>
    apiGet<TrekListItem[]>(
      `/api/v1/recommendations/anonymous?regions=${regions.join(",")}&difficulties=${difficulties.join(",")}`
    ),

  getPersonalisedRecommendations: () =>
    apiGet<TrekListItem[]>("/api/v1/recommendations/personalised"),

  saveTrek: (slug: string) => apiPost<{ saved: boolean }>("/api/v1/account/saved", { slug }),
};
