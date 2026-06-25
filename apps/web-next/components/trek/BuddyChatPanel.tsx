"use client";

import { useEffect, useRef, useState } from "react";
import { fetchChatMessages, sendChatMessage } from "@/lib/buddies";
import type { ChatMessageOut } from "@/lib/buddies";
import { Send } from "lucide-react";

interface Props {
  requestId: string;
  otherPartyName: string;
}

function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function BuddyChatPanel({ requestId, otherPartyName }: Props) {
  const [messages, setMessages] = useState<ChatMessageOut[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function load() {
    try {
      const msgs = await fetchChatMessages(requestId);
      setMessages(msgs);
    } catch {
      // silently ignore polling errors
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    pollRef.current = setInterval(load, 10_000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const content = input.trim();
    if (!content) return;
    setSending(true);
    try {
      const msg = await sendChatMessage(requestId, content);
      setInput("");
      setMessages((prev) => [...prev, msg]);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return <div className="py-6 text-center text-sm text-foreground/40">Loading chat…</div>;
  }

  return (
    <div className="flex flex-col h-[420px] rounded-xl border border-foreground/10 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-foreground/8 bg-foreground/2 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
        <span className="text-sm font-medium">{otherPartyName}</span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.length === 0 && (
          <p className="text-center text-sm text-foreground/40 py-8">
            You&apos;re connected! Say hello.
          </p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.is_mine ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm leading-snug ${
                m.is_mine
                  ? "bg-accent text-white rounded-br-sm"
                  : "bg-foreground/8 text-foreground rounded-bl-sm"
              }`}
            >
              <p>{m.content}</p>
              <p className={`text-[10px] mt-0.5 ${m.is_mine ? "text-white/60" : "text-foreground/40"} text-right`}>
                {fmt(m.created_at)}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <form onSubmit={handleSend} className="border-t border-foreground/8 px-3 py-2 flex gap-2 items-end">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(e as unknown as React.FormEvent); }
          }}
          rows={1}
          maxLength={2000}
          placeholder="Type a message…"
          className="flex-1 text-sm rounded-lg border border-foreground/15 bg-background px-3 py-2 focus:outline-none focus:ring-1 focus:ring-accent resize-none"
        />
        <button
          type="submit"
          disabled={sending || !input.trim()}
          className="p-2 rounded-lg bg-accent text-white hover:bg-accent/90 transition-colors disabled:opacity-40"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
