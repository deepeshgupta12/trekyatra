import { useCallback, useEffect, useState } from "react";
import { accountApi, type SavedComparison } from "@/lib/mobileApi";

export function useComparisons(enabled: boolean) {
  const [comparisons, setComparisons] = useState<SavedComparison[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    try {
      const data = await accountApi.listComparisons();
      setComparisons(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load comparisons");
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => { load(); }, [load]);

  const save = useCallback(async (name: string, slugs: string[]) => {
    const item = await accountApi.saveComparison(name, slugs);
    setComparisons((prev) => [item, ...prev]);
    return item;
  }, []);

  const remove = useCallback(async (id: string) => {
    await accountApi.deleteComparison(id);
    setComparisons((prev) => prev.filter((c) => c.id !== id));
  }, []);

  return { comparisons, loading, error, save, remove, reload: load };
}
