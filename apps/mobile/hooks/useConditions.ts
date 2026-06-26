import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiGet } from "@/lib/mobileApi";

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

const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6 hours

function cacheKey(slug: string) {
  return `conditions_${slug}`;
}

async function readCache(slug: string): Promise<ConditionOut | null> {
  try {
    const raw = await AsyncStorage.getItem(cacheKey(slug));
    if (!raw) return null;
    const parsed: { data: ConditionOut; ts: number } = JSON.parse(raw);
    if (Date.now() - parsed.ts > CACHE_TTL_MS) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

async function writeCache(slug: string, data: ConditionOut) {
  try {
    await AsyncStorage.setItem(
      cacheKey(slug),
      JSON.stringify({ data, ts: Date.now() })
    );
  } catch {}
}

export function useConditions(slug: string) {
  const [data, setData] = useState<ConditionOut | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromCache, setFromCache] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiGet<ConditionOut>(
        `/api/v1/public/treks/${slug}/conditions`
      );
      setData(result);
      setFromCache(false);
      await writeCache(slug, result);
    } catch (err: unknown) {
      // Try offline cache on network error
      const cached = await readCache(slug);
      if (cached) {
        setData(cached);
        setFromCache(true);
      } else {
        const status = (err as { status?: number }).status;
        // 404 = no coords — not an error, just no data
        if (status !== 404) {
          setError("Could not load conditions");
        }
        setData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, loading, fromCache, error, reload: load };
}
