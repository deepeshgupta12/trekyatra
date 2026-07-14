import type { Trek } from "@/components/trek/TrekCard";
import { apiFetch } from "@/lib/api";

// CMS is the sole source of trek data (#4 / Step 81). No static fallback: on API
// error we return empty/undefined rather than hardcoded stubs.
const DEFAULT_TREK_IMAGE = "/images/trek-forest.jpg";

interface ApiTrek {
  slug: string;
  name: string;
  region: string;
  state: string;
  duration: string;
  altitude: string;
  difficulty: "Easy" | "Moderate" | "Difficult" | "Challenging";
  season: string;
  description: string;
  beginner: boolean;
  image?: string | null;
}

interface ApiTrekListResponse {
  treks: ApiTrek[];
  total: number;
}

function mergeImage(api: ApiTrek): Trek {
  // The API now returns the real CMS hero image (PT4 / Step 81); fall back to the
  // universal default only when a trek has no image set.
  const { image, ...rest } = api;
  return { ...rest, image: image ?? DEFAULT_TREK_IMAGE };
}

export async function fetchTreks(params?: Record<string, string>): Promise<Trek[]> {
  try {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    const data = await apiFetch<ApiTrekListResponse>(`/treks${query}`);
    return data.treks.map(mergeImage);
  } catch {
    return [];
  }
}

export async function fetchTrekBySlug(slug: string): Promise<Trek | undefined> {
  try {
    const data = await apiFetch<ApiTrek>(`/treks/${slug}`);
    return mergeImage(data);
  } catch {
    return undefined;
  }
}
