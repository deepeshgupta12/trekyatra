import { useState, useCallback } from "react";
import { apiPost, apiGet } from "@/lib/mobileApi";

export interface CheckinIn {
  trek_slug: string;
  trek_title?: string;
  completion_date: string; // ISO date YYYY-MM-DD
  duration_days?: number;
  rating?: number;
  notes?: string;
  trek_state?: string;
  max_altitude_ft?: number;
}

export interface CheckinOut {
  id: string;
  trek_slug: string;
  trek_title?: string;
  completion_date: string;
  duration_days?: number;
  rating?: number;
  notes?: string;
  trek_state?: string;
  max_altitude_ft?: number;
  created_at: string;
}

export interface TrekHistoryStats {
  total_treks: number;
  total_days: number;
  states_visited: string[];
  favourite_state?: string;
  badges: string[];
}

export function useCheckin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createCheckin = useCallback(async (data: CheckinIn): Promise<CheckinOut | null> => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiPost<CheckinOut>("/api/v1/mobile/checkin", data);
      return result;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save check-in");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getHistory = useCallback(async (limit = 50, offset = 0): Promise<CheckinOut[]> => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiGet<CheckinOut[]>(
        `/api/v1/mobile/checkin?limit=${limit}&offset=${offset}`
      );
      return result ?? [];
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load history");
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getStats = useCallback(async (): Promise<TrekHistoryStats | null> => {
    try {
      return await apiGet<TrekHistoryStats>("/api/v1/mobile/checkin/stats");
    } catch {
      return null;
    }
  }, []);

  const isDone = useCallback(async (trekSlug: string): Promise<boolean> => {
    try {
      const res = await apiGet<{ done: boolean }>(`/api/v1/mobile/checkin/done/${trekSlug}`);
      return res?.done ?? false;
    } catch {
      return false;
    }
  }, []);

  return { createCheckin, getHistory, getStats, isDone, loading, error };
}
