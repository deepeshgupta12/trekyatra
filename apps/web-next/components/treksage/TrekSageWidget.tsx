"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Mountain, Send, X, MessageSquare } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import { treksageChat, fetchTreksageChatHistory } from "@/lib/api";

const WIDGET_SESSION_KEY = "treksage_widget_session";

function getContextualPrompts(pathname: string): string[] {
  const trekMatch = pathname.match(/^\/trek\/([^/]+)$/);
  if (trekMatch) {
    const slug = trekMatch[1];
    const trekName = slug
      .split("-")
      .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
    return [
      `What permits are needed for ${trekName}?`,
      `Best time of year to do ${trekName}`,
      `What should I pack for ${trekName}?`,
      `Recommend treks similar to ${trekName}`,
    ];
  }
  if (pathname.startsWith("/compare")) {
    return [
      "Which trek is better for beginners?",
      "Which has a shorter duration?",
      "Compare by budget and difficulty",
      "Suggest a similar but easier trek",
    ];
  }
  if (pathname.startsWith("/plan")) {
    return [
      "Plan a 5-day trek under ₹12,000",
      "Best treks for March travel",
      "Solo-friendly trek with no permits",
      "Weekend trek from Delhi",
    ];
  }
  return [
    "Best treks for a complete beginner in India",
    "Compare Kedarkantha vs Brahmatal for January",
    "Which permits do Ladakh treks need?",
    "Plan a 5-day trek in Uttarakhand under ₹12,000",
  ];
}

interface Message {
  role: "user" | "assistant";
  content: string;
}

const mdComponents: Components = {
  p:      ({ children }) => <p className="mb-1 last:mb-0 text-[#1D3A2E]/80 text-xs leading-relaxed">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-[#1D3A2E]">{children}</strong>,
  ul:     ({ children }) => <ul className="list-disc pl-3 mb-1 space-y-0.5">{children}</ul>,
  ol:     ({ children }) => <ol className="list-decimal pl-3 mb-1 space-y-0.5">{children}</ol>,
  li:     ({ children }) => <li className="text-[#1D3A2E]/75 text-xs">{children}</li>,
  h3:     ({ children }) => <h3 className="font-semibold text-[#1D3A2E] text-xs mt-2 mb-0.5 first:mt-0">{children}</h3>,
};

export default function TrekSageWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionKey, setSessionKey] = useState<string | undefined>(undefined);
  const bottomRef = useRef<HTMLDivElement>(null);
  const userSentRef = useRef(false);

  // Restore session on panel open
  useEffect(() => {
    if (!open) return;
    const stored = typeof window !== "undefined" ? localStorage.getItem(WIDGET_SESSION_KEY) : null;
    if (!stored) return;
    setSessionKey(stored);
    fetchTreksageChatHistory(stored)
      .then((h) => { if (h.length > 0) setMessages(h as Message[]); })
      .catch(() => {});
  }, [open]);

  // Auto-scroll only after the user has sent at least one message (not on history restore)
  useEffect(() => {
    if (!userSentRef.current) return;
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading, open]);

  // ALL hooks above — conditional return must be after all hooks (Rules of Hooks)
  if (pathname === "/treksage") return null;

  const starterPrompts = getContextualPrompts(pathname);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    userSentRef.current = true;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setLoading(true);

    // Prefix trek page context so the agent knows the slug without having to infer it.
    let messageToSend = trimmed;
    const trekPageMatch = pathname.match(/^\/trek\/([^/]+)$/);
    if (trekPageMatch) {
      const slug = trekPageMatch[1];
      const name = slug.split("-").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      messageToSend = `[Trek page context: ${name} (${slug})] ${trimmed}`;
    }

    try {
      const res = await treksageChat(messageToSend, sessionKey);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
      if (res.session_key !== sessionKey) {
        setSessionKey(res.session_key);
        if (typeof window !== "undefined") localStorage.setItem(WIDGET_SESSION_KEY, res.session_key);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, couldn't reach TrekSage right now. Try the full chat at /treksage." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* ── Compact chat panel ── */}
      {open && (
        <div className="fixed bottom-24 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] max-w-[380px] h-[480px] flex flex-col bg-[#FAF5EE] rounded-2xl border border-[#1D3A2E]/20 shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-[#1D3A2E] flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-white/15 flex items-center justify-center">
                <Mountain className="h-3.5 w-3.5 text-white" />
              </div>
              <div>
                <p className="text-white font-semibold text-xs">TrekSage</p>
                <p className="text-white/45 text-[9px]">Powered by TrekYatra Intelligence</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-white/50 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
            {messages.length === 0 ? (
              <div className="space-y-3 pt-2">
                <div className="flex gap-2">
                  <div className="h-6 w-6 rounded-full bg-[#1D3A2E] flex items-center justify-center flex-shrink-0">
                    <Mountain className="h-3 w-3 text-white" />
                  </div>
                  <div className="bg-white rounded-xl rounded-tl-sm px-3 py-2 border border-[#1D3A2E]/10 text-xs text-[#1D3A2E]/75 shadow-sm">
                    Hi! I&apos;m TrekSage. Ask me about Indian treks, permits, planning, or anything about trekking.
                  </div>
                </div>
                <p className="text-[#1D3A2E]/25 text-[10px] font-semibold uppercase tracking-widest text-center">
                  Quick Asks
                </p>
                <div className="space-y-1">
                  {starterPrompts.map((p) => (
                    <button
                      key={p}
                      onClick={() => send(p)}
                      disabled={loading}
                      className="w-full text-left text-xs text-[#1D3A2E]/60 hover:text-[#1D3A2E]/80 px-3 py-2 rounded-xl hover:bg-white border border-transparent hover:border-[#1D3A2E]/10 transition-all"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="h-6 w-6 rounded-full bg-[#1D3A2E] flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Mountain className="h-3 w-3 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[82%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-[#1D3A2E] text-white rounded-tr-sm"
                          : "bg-white border border-[#1D3A2E]/10 rounded-tl-sm shadow-sm"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <ReactMarkdown components={mdComponents}>{msg.content}</ReactMarkdown>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex gap-2">
                    <div className="h-6 w-6 rounded-full bg-[#1D3A2E] flex items-center justify-center flex-shrink-0">
                      <Mountain className="h-3 w-3 text-white" />
                    </div>
                    <div className="bg-white border border-[#1D3A2E]/10 rounded-xl rounded-tl-sm px-3 py-2 shadow-sm">
                      <div className="flex gap-1 items-center">
                        <span className="h-1.5 w-1.5 rounded-full bg-[#E8702A] animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-[#E8702A] animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="h-1.5 w-1.5 rounded-full bg-[#E8702A] animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          {/* Full chat link + input */}
          <div className="bg-white border-t border-[#1D3A2E]/8 px-3 py-2.5 flex-shrink-0 space-y-2">
            <a href="/treksage" className="block text-center text-[10px] text-[#E8702A] font-medium hover:underline">
              Open full TrekSage experience →
            </a>
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex gap-2 items-center"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about treks, seasons, permits…"
                maxLength={500}
                disabled={loading}
                className="flex-1 text-xs px-3 py-2.5 rounded-xl bg-[#FAF5EE] border border-[#1D3A2E]/15 text-[#1D3A2E] placeholder:text-[#1D3A2E]/30 focus:outline-none focus:ring-2 focus:ring-[#E8702A]/20 focus:border-[#E8702A]/40 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={loading || input.trim().length === 0}
                className="h-9 w-9 rounded-xl bg-[#E8702A] text-white disabled:opacity-40 flex items-center justify-center hover:bg-[#d4621f] transition-colors flex-shrink-0"
                aria-label="Send"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── FAB button ── */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open TrekSage AI assistant"
        className="fixed bottom-6 right-4 sm:right-6 z-50 h-14 w-14 rounded-full bg-[#1D3A2E] text-white shadow-xl hover:bg-[#1D3A2E]/90 transition-all flex items-center justify-center"
        style={{ boxShadow: "0 8px 24px rgba(29,58,46,0.35)" }}
      >
        {open ? (
          <X className="h-5 w-5" />
        ) : (
          <>
            <MessageSquare className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#E8702A] flex items-center justify-center">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
            </span>
          </>
        )}
      </button>
    </>
  );
}
