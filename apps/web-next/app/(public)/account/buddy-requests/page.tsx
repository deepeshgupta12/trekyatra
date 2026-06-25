"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchReceivedRequests,
  fetchSentRequests,
  respondToRequest,
} from "@/lib/buddies";
import type { BuddyRequestOut } from "@/lib/buddies";
import { BuddyChatPanel } from "@/components/trek/BuddyChatPanel";
import { Users, ChevronRight } from "lucide-react";

type Tab = "received" | "sent";

const STATUS_STYLE: Record<string, string> = {
  pending: "text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800",
  accepted: "text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800",
  rejected: "text-foreground/40 bg-foreground/5 border border-foreground/10",
};

function RequestCard({
  req,
  perspective,
  onAction,
}: {
  req: BuddyRequestOut;
  perspective: Tab;
  onAction: (id: string, action: "accept" | "reject") => Promise<void>;
}) {
  const [chatOpen, setChatOpen] = useState(false);
  const [actioning, setActioning] = useState(false);

  async function act(action: "accept" | "reject") {
    setActioning(true);
    await onAction(req.id, action);
    setActioning(false);
  }

  return (
    <div className="rounded-xl border border-foreground/10 p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-accent/15 text-accent flex items-center justify-center text-sm font-semibold shrink-0">
          {req.other_party_name.slice(0, 2).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link href={`/trekker/${req.signal.id}`} className="font-semibold text-sm hover:text-accent transition-colors">
              {req.other_party_name}
            </Link>
            <span className="text-foreground/30 text-xs">·</span>
            <Link href={`/trek/${req.trek_slug}`} className="text-xs text-foreground/50 hover:text-accent transition-colors">
              {req.trek_slug.replace(/-/g, " ")}
            </Link>
            <span className="text-foreground/30 text-xs">·</span>
            <span className="text-xs text-foreground/50">{req.month_year}</span>
          </div>
          {req.message && (
            <p className="text-sm text-foreground/60 mt-0.5 italic">&ldquo;{req.message}&rdquo;</p>
          )}
        </div>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${STATUS_STYLE[req.status]}`}>
          {req.status}
        </span>
      </div>

      {/* Actions for received + pending */}
      {perspective === "received" && req.status === "pending" && (
        <div className="flex gap-2">
          <button
            onClick={() => act("accept")}
            disabled={actioning}
            className="px-4 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            {actioning ? "…" : "Accept"}
          </button>
          <button
            onClick={() => act("reject")}
            disabled={actioning}
            className="px-4 py-1.5 rounded-lg border border-foreground/15 text-foreground/50 text-xs hover:text-foreground transition-colors disabled:opacity-50"
          >
            Decline
          </button>
        </div>
      )}

      {/* Chat for accepted */}
      {req.status === "accepted" && (
        <div>
          <button
            onClick={() => setChatOpen((v) => !v)}
            className="text-xs font-medium text-accent hover:underline flex items-center gap-1"
          >
            {chatOpen ? "Hide chat" : "Open chat"} <ChevronRight className={`h-3 w-3 transition-transform ${chatOpen ? "rotate-90" : ""}`} />
          </button>
          {chatOpen && (
            <div className="mt-3">
              <BuddyChatPanel requestId={req.id} otherPartyName={req.other_party_name} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function BuddyRequestsPage() {
  const [tab, setTab] = useState<Tab>("received");
  const [received, setReceived] = useState<BuddyRequestOut[]>([]);
  const [sent, setSent] = useState<BuddyRequestOut[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([fetchReceivedRequests(), fetchSentRequests()])
      .then(([r, s]) => { setReceived(r); setSent(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function handleAction(id: string, action: "accept" | "reject") {
    const updated = await respondToRequest(id, action);
    setReceived((prev) => prev.map((r) => (r.id === id ? updated : r)));
  }

  const current = tab === "received" ? received : sent;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <Users className="h-5 w-5 text-accent" />
          <h1 className="font-display text-2xl font-semibold">Buddy Requests</h1>
        </div>
        <p className="text-foreground/50 text-sm">Connect with trekkers planning the same routes.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-foreground/8">
        {(["received", "sent"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
              tab === t
                ? "border-accent text-accent"
                : "border-transparent text-foreground/50 hover:text-foreground"
            }`}
          >
            {t}
            {t === "received" && received.filter((r) => r.status === "pending").length > 0 && (
              <span className="ml-1.5 bg-accent text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {received.filter((r) => r.status === "pending").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-10 text-center text-foreground/40 text-sm">Loading…</div>
      ) : current.length === 0 ? (
        <div className="py-10 text-center text-foreground/40 text-sm">
          {tab === "received"
            ? "No connection requests yet. Post your trek signal to start receiving them."
            : "You haven't sent any buddy requests yet."}
        </div>
      ) : (
        <div className="space-y-3">
          {current.map((req) => (
            <RequestCard
              key={req.id}
              req={req}
              perspective={tab}
              onAction={handleAction}
            />
          ))}
        </div>
      )}
    </div>
  );
}
