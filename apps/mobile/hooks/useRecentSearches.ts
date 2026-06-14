import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEY = "ty_recent_searches";
const MAX_RECENT = 8;

export function useRecentSearches() {
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setRecentSearches(JSON.parse(raw));
      })
      .catch(() => undefined);
  }, []);

  const persist = useCallback((next: string[]) => {
    setRecentSearches(next);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
  }, []);

  const addRecentSearch = useCallback(
    (query: string) => {
      const trimmed = query.trim();
      if (!trimmed) return;
      setRecentSearches((current) => {
        const deduped = current.filter((q) => q.toLowerCase() !== trimmed.toLowerCase());
        const next = [trimmed, ...deduped].slice(0, MAX_RECENT);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
        return next;
      });
    },
    []
  );

  const removeRecentSearch = useCallback(
    (query: string) => {
      setRecentSearches((current) => {
        const next = current.filter((q) => q !== query);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => undefined);
        return next;
      });
    },
    []
  );

  const clearRecentSearches = useCallback(() => {
    persist([]);
  }, [persist]);

  return { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches };
}
