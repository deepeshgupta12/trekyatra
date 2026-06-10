import { useState, useCallback } from "react";
import { useAuth } from "./useAuth";
import { triggerSyncNow } from "../services/backgroundSync";
import { getLastSyncAt } from "../services/syncService";

export interface SyncState {
  isSyncing: boolean;
  lastSyncAt: string | null;
  syncProgress: number; // 0–1; only meaningful while isSyncing
  error: string | null;
}

export function useSync() {
  const { accessToken } = useAuth();
  const [state, setState] = useState<SyncState>({
    isSyncing: false,
    lastSyncAt: null,
    syncProgress: 0,
    error: null,
  });

  const triggerSync = useCallback(async () => {
    if (!accessToken) return;
    setState((prev) => ({ ...prev, isSyncing: true, error: null, syncProgress: 0 }));
    try {
      const result = await triggerSyncNow(accessToken);
      setState({
        isSyncing: false,
        lastSyncAt: result.timestamp,
        syncProgress: 1,
        error: null,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isSyncing: false,
        error: err instanceof Error ? err.message : "Sync failed",
      }));
    }
  }, [accessToken]);

  const refreshLastSync = useCallback(async () => {
    const ts = await getLastSyncAt();
    setState((prev) => ({ ...prev, lastSyncAt: ts }));
  }, []);

  return { ...state, triggerSync, refreshLastSync };
}
