const apiBase = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:8000";

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

// ── Public endpoints ──────────────────────────────────────────────────────────

export async function fetchBuddyCount(slug: string): Promise<BuddyCountOut> {
  const res = await fetch(`${apiBase}/api/v1/public/treks/${slug}/buddy-count`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Failed to fetch buddy count: ${res.status}`);
  return res.json();
}

export async function fetchTrekkerProfile(signalId: string): Promise<TrekkerProfileOut> {
  const res = await fetch(`${apiBase}/api/v1/public/trekkers/${signalId}`, {
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Failed to fetch trekker profile: ${res.status}`);
  return res.json();
}

// ── Auth endpoints ────────────────────────────────────────────────────────────

export async function fetchSignals(trekSlug: string): Promise<SignalOut[]> {
  const res = await fetch(`${apiBase}/api/v1/buddies/signals/${trekSlug}`, {
    credentials: "include",
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Failed to fetch signals: ${res.status}`);
  return res.json();
}

export async function createSignal(payload: {
  trek_slug: string;
  month_year: string;
  group_size?: number;
  experience?: string;
  notes?: string;
}): Promise<SignalOut> {
  const res = await fetch(`${apiBase}/api/v1/buddies/signals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Failed to create signal: ${res.status}`);
  }
  return res.json();
}

export async function deleteSignal(signalId: string): Promise<void> {
  const res = await fetch(`${apiBase}/api/v1/buddies/signals/${signalId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error(`Failed to delete signal: ${res.status}`);
}

export async function sendRequest(payload: {
  signal_id: string;
  message?: string;
}): Promise<BuddyRequestOut> {
  const res = await fetch(`${apiBase}/api/v1/buddies/requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { detail?: string }).detail ?? `Failed to send request: ${res.status}`);
  }
  return res.json();
}

export async function fetchReceivedRequests(): Promise<BuddyRequestOut[]> {
  const res = await fetch(`${apiBase}/api/v1/buddies/requests/received`, {
    credentials: "include",
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Failed to fetch received requests: ${res.status}`);
  return res.json();
}

export async function fetchSentRequests(): Promise<BuddyRequestOut[]> {
  const res = await fetch(`${apiBase}/api/v1/buddies/requests/sent`, {
    credentials: "include",
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Failed to fetch sent requests: ${res.status}`);
  return res.json();
}

export async function respondToRequest(
  requestId: string,
  action: "accept" | "reject",
): Promise<BuddyRequestOut> {
  const res = await fetch(`${apiBase}/api/v1/buddies/requests/${requestId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ action }),
  });
  if (!res.ok) throw new Error(`Failed to respond to request: ${res.status}`);
  return res.json();
}

export async function fetchChatMessages(requestId: string): Promise<ChatMessageOut[]> {
  const res = await fetch(`${apiBase}/api/v1/buddies/requests/${requestId}/messages`, {
    credentials: "include",
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error(`Failed to fetch messages: ${res.status}`);
  return res.json();
}

export async function sendChatMessage(
  requestId: string,
  content: string,
): Promise<ChatMessageOut> {
  const res = await fetch(`${apiBase}/api/v1/buddies/requests/${requestId}/messages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ content }),
  });
  if (!res.ok) throw new Error(`Failed to send message: ${res.status}`);
  return res.json();
}

export async function markMessagesRead(requestId: string): Promise<void> {
  await fetch(`${apiBase}/api/v1/buddies/requests/${requestId}/messages/read`, {
    method: "POST",
    credentials: "include",
  });
}
