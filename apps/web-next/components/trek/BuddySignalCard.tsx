"use client";

import { useState } from "react";
import Link from "next/link";
import type { SignalOut } from "@/lib/buddies";
import { sendRequest } from "@/lib/buddies";

const EXPERIENCE_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  expert: "Expert",
};

interface Props {
  signal: SignalOut;
  onRequestSent?: () => void;
}

export function BuddySignalCard({ signal, onRequestSent }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const initials = signal.display_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  async function handleSend() {
    setSending(true);
    setError("");
    try {
      await sendRequest({ signal_id: signal.id, message: message.trim() || undefined });
      setSent(true);
      setExpanded(false);
      onRequestSent?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send request");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-xl border border-foreground/10 bg-background/50 p-4">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <Link href={`/trekker/${signal.id}`} className="shrink-0">
          {signal.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={signal.avatar_url}
              alt={signal.display_name}
              className="w-10 h-10 rounded-full object-cover"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-accent/15 text-accent flex items-center justify-center text-sm font-semibold">
              {initials}
            </div>
          )}
        </Link>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Link href={`/trekker/${signal.id}`} className="font-semibold text-sm hover:text-accent transition-colors">
              {signal.display_name}
            </Link>
            <span className="text-foreground/40 text-xs">·</span>
            <span className="text-xs text-foreground/60">{signal.month_year}</span>
            {signal.experience && (
              <>
                <span className="text-foreground/40 text-xs">·</span>
                <span className="text-xs text-foreground/60">{EXPERIENCE_LABELS[signal.experience] ?? signal.experience}</span>
              </>
            )}
            {signal.group_size > 1 && (
              <>
                <span className="text-foreground/40 text-xs">·</span>
                <span className="text-xs text-foreground/60">Group of {signal.group_size}</span>
              </>
            )}
          </div>
          {signal.notes && (
            <p className="text-sm text-foreground/70 mt-1 leading-snug">{signal.notes}</p>
          )}
        </div>

        {/* Action */}
        {!signal.is_own && (
          <div className="shrink-0">
            {sent ? (
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Sent ✓</span>
            ) : (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="text-xs font-semibold text-accent hover:text-accent/80 transition-colors border border-accent/30 rounded-lg px-3 py-1.5"
              >
                Connect
              </button>
            )}
          </div>
        )}
        {signal.is_own && (
          <span className="text-xs text-foreground/40 font-medium shrink-0">You</span>
        )}
      </div>

      {/* Inline message composer */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-foreground/8">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={2}
            maxLength={500}
            placeholder="Add a short message (optional)…"
            className="w-full text-sm rounded-lg border border-foreground/15 bg-background px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent resize-none"
          />
          {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSend}
              disabled={sending}
              className="px-4 py-1.5 rounded-lg bg-accent text-white text-xs font-semibold hover:bg-accent/90 transition-colors disabled:opacity-50"
            >
              {sending ? "Sending…" : "Send request"}
            </button>
            <button
              onClick={() => { setExpanded(false); setError(""); }}
              className="px-4 py-1.5 rounded-lg border border-foreground/15 text-foreground/60 text-xs hover:text-foreground transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
