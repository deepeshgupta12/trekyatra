import { useState, useEffect, useCallback } from "react";
import { apiGet, apiPost, apiDelete, apiPatch } from "@/lib/mobileApi";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SignalOut {
  id: string;
  display_name: string;
  avatar_url?: string;
  trek_slug: string;
  month_year: string;
  group_size: number;
  experience?: string;
  notes?: string;
  is_own: boolean;
  created_at: string;
}

export interface MonthCount {
  month_year: string;
  count: number;
}

export interface BuddyCountOut {
  count: number;
  upcoming_months: MonthCount[];
}

export interface BuddyRequestOut {
  id: string;
  signal: SignalOut;
  other_party_name: string;
  other_party_avatar?: string;
  message?: string;
  status: "pending" | "accepted" | "rejected";
  trek_slug: string;
  month_year: string;
  created_at: string;
  responded_at?: string;
}

export interface ChatMessageOut {
  id: string;
  is_mine: boolean;
  content: string;
  created_at: string;
  read_at?: string;
}

export interface TrekkerProfileOut {
  display_name: string;
  avatar_url?: string;
  bio?: string;
  experience?: string;
  trek_count: number;
  joined_year: number;
  signal_id: string;
  trek_slug: string;
  month_year: string;
}

export interface SignalIn {
  trek_slug: string;
  month_year: string;
  group_size?: number;
  experience?: string;
  notes?: string;
}

// ── API helpers ───────────────────────────────────────────────────────────────

export const buddyApi = {
  getCount: (slug: string) =>
    apiGet<BuddyCountOut>(`/api/v1/public/treks/${slug}/buddy-count`),

  getTrekkerProfile: (signalId: string) =>
    apiGet<TrekkerProfileOut>(`/api/v1/public/trekkers/${signalId}`),

  listSignals: (trekSlug: string) =>
    apiGet<SignalOut[]>(`/api/v1/buddies/signals/${trekSlug}`),

  createSignal: (data: SignalIn) =>
    apiPost<SignalOut>("/api/v1/buddies/signals", data),

  deleteSignal: (signalId: string) =>
    apiDelete(`/api/v1/buddies/signals/${signalId}`),

  sendRequest: (signalId: string, message?: string) =>
    apiPost<BuddyRequestOut>("/api/v1/buddies/requests", { signal_id: signalId, message }),

  getReceived: () =>
    apiGet<BuddyRequestOut[]>("/api/v1/buddies/requests/received"),

  getSent: () =>
    apiGet<BuddyRequestOut[]>("/api/v1/buddies/requests/sent"),

  respond: (requestId: string, action: "accept" | "reject") =>
    apiPatch<BuddyRequestOut>(`/api/v1/buddies/requests/${requestId}`, { action }),

  getMessages: (requestId: string) =>
    apiGet<ChatMessageOut[]>(`/api/v1/buddies/requests/${requestId}/messages`),

  sendMessage: (requestId: string, content: string) =>
    apiPost<ChatMessageOut>(`/api/v1/buddies/requests/${requestId}/messages`, { content }),

  markRead: (requestId: string) =>
    apiPost<void>(`/api/v1/buddies/requests/${requestId}/messages/read`, {}),
};

// ── useTrekBuddies hook ───────────────────────────────────────────────────────

export function useTrekBuddies(trekSlug: string) {
  const [count, setCount] = useState<BuddyCountOut | null>(null);
  const [signals, setSignals] = useState<SignalOut[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    buddyApi.getCount(trekSlug).then(setCount).catch(() => {});
  }, [trekSlug]);

  const loadSignals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await buddyApi.listSignals(trekSlug);
      setSignals(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load signals");
    } finally {
      setLoading(false);
    }
  }, [trekSlug]);

  const createSignal = useCallback(async (data: SignalIn): Promise<SignalOut> => {
    const signal = await buddyApi.createSignal(data);
    setSignals((prev) => (prev ? [signal, ...prev.filter((s) => s.id !== signal.id)] : [signal]));
    setCount((prev) => prev ? { ...prev, count: (prev.count || 0) + 1 } : prev);
    return signal;
  }, []);

  const removeSignal = useCallback(async (signalId: string) => {
    await buddyApi.deleteSignal(signalId);
    setSignals((prev) => prev?.filter((s) => s.id !== signalId) ?? null);
    setCount((prev) => prev ? { ...prev, count: Math.max(0, prev.count - 1) } : prev);
  }, []);

  const mySignal = signals?.find((s) => s.is_own) ?? null;

  return { count, signals, mySignal, loading, error, loadSignals, createSignal, removeSignal };
}

// ── useBuddyRequests hook ─────────────────────────────────────────────────────

export function useBuddyRequests() {
  const [received, setReceived] = useState<BuddyRequestOut[]>([]);
  const [sent, setSent] = useState<BuddyRequestOut[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, s] = await Promise.all([buddyApi.getReceived(), buddyApi.getSent()]);
      setReceived(r);
      setSent(s);
    } catch {
      // silently ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const respond = useCallback(async (requestId: string, action: "accept" | "reject") => {
    const updated = await buddyApi.respond(requestId, action);
    setReceived((prev) => prev.map((r) => (r.id === requestId ? updated : r)));
  }, []);

  const pendingCount = received.filter((r) => r.status === "pending").length;

  return { received, sent, loading, respond, pendingCount, refresh: load };
}
