const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

export interface WeatherOut {
  temp_c: number | null;
  feels_like_c: number | null;
  humidity_pct: number | null;
  wind_kph: number | null;
  wmo_code: number | null;
  label: string;
  icon: string;
}

export interface ForecastDayOut {
  date: string;
  wmo_code: number | null;
  label: string;
  temp_max_c: number | null;
  temp_min_c: number | null;
}

export interface ConditionOut {
  slug: string;
  weather: WeatherOut | null;
  forecast: ForecastDayOut[];
  trail_status: "open" | "caution" | "closed" | string;
  permit_status: "not_required" | "required" | "check_locally" | string;
  permit_notes: string | null;
  condition_summary: string | null;
  weather_updated_at: string | null;
  last_updated_at: string | null;
}

export async function fetchConditions(slug: string): Promise<ConditionOut | null> {
  const res = await fetch(`${API_BASE}/api/v1/public/treks/${slug}/conditions`, {
    next: { revalidate: 3600 }, // ISR — revalidate every hour
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`conditions fetch failed: ${res.status}`);
  return res.json() as Promise<ConditionOut>;
}
