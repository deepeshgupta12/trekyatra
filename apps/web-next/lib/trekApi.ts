import type { Trek } from "@/components/trek/TrekCard";
import { treks as staticTreks } from "@/data/treks";
import { apiFetch } from "@/lib/api";

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
}

interface ApiTrekListResponse {
  treks: ApiTrek[];
  total: number;
}

function mergeImage(api: ApiTrek): Trek {
  const local = staticTreks.find((t) => t.slug === api.slug);
  return { ...api, image: local?.image ?? staticTreks[0].image };
}

export async function fetchTreks(params?: Record<string, string>): Promise<Trek[]> {
  try {
    const query = params ? "?" + new URLSearchParams(params).toString() : "";
    const data = await apiFetch<ApiTrekListResponse>(`/treks${query}`);
    return data.treks.map(mergeImage);
  } catch {
    return staticTreks;
  }
}

export async function fetchTrekBySlug(slug: string): Promise<Trek | undefined> {
  try {
    const data = await apiFetch<ApiTrek>(`/treks/${slug}`);
    return mergeImage(data);
  } catch {
    return staticTreks.find((t) => t.slug === slug);
  }
}
