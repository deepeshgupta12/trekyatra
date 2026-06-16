"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Bot, User, RefreshCw } from "lucide-react";
import { treksageChat, fetchTreksageChatHistory } from "@/lib/api";

const SESSION_KEY_STORAGE = "treksage_session_key";

const SUGGESTED_PROMPTS = [
  "Plan a Himalayan trek for July",
  "Compare Hampta Pass vs Kedarkantha",
  "What permits does Nubra Valley need?",
  "Best beginner-friendly treks in Uttarakhand",
  "I have 6 days and ₹15,000 budget — suggest a trek",
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function TreksageChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionKey, setSessionKey] = useState<string | undefined>(undefined);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Restore session on mount.
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(SESSION_KEY_STORAGE) : null;
    if (!stored) {
      setLoadingHistory(false);
      return;
    }
    setSessionKey(stored);
    fetchTreksageChatHistory(stored)
      .then((history) => {
        if (history.length > 0) {
          setMessages(history as Message[]);
        }
      })
      .finally(() => setLoadingHistory(false));
  }, []);

  // Auto-scroll on new messages.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setLoading(true);
    try {
      const res = await treksageChat(trimmed, sessionKey);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
      if (res.session_key !== sessionKey) {
        setSessionKey(res.session_key);
        if (typeof window !== "undefined") {
          localStorage.setItem(SESSION_KEY_STORAGE, res.session_key);
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't process that right now. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function clearSession() {
    setMessages([]);
    setSessionKey(undefined);
    if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY_STORAGE);
  }

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] min-h-[500px] max-h-[820px]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-accent" />
          </div>
          <div>
            <h2 className="font-display font-semibold text-white text-sm">Myra · TrekSage AI</h2>
            <p className="text-white/40 text-xs">Your personal Himalayan trek planner</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearSession}
            className="text-white/30 hover:text-white/60 transition-colors text-xs flex items-center gap-1"
          >
            <RefreshCw className="h-3 w-3" /> New chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {loadingHistory ? (
          <div className="flex justify-center py-8">
            <div className="text-white/30 text-sm">Restoring your conversation…</div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-8">
            <div className="text-center">
              <div className="h-16 w-16 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-8 w-8 text-accent" />
              </div>
              <h3 className="font-display text-white font-semibold text-lg mb-1">Ask me anything about Himalayan treks</h3>
              <p className="text-white/50 text-sm max-w-sm">
                I can help you plan a trip, compare treks, check permits, and find the perfect trek for your fitness and budget.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center max-w-lg">
              {SUGGESTED_PROMPTS.map((prompt) => (
                <button
                  key={prompt}
                  onClick={() => send(prompt)}
                  disabled={loading}
                  className="text-xs px-3 py-2 rounded-full border border-white/10 hover:border-accent/40 hover:text-accent text-white/60 transition-colors disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="h-7 w-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-accent" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-accent text-white rounded-tr-sm"
                      : "bg-[#14161f] border border-white/10 text-white/85 rounded-tl-sm"
                  }`}
                >
                  {msg.content}
                </div>
                {msg.role === "user" && (
                  <div className="h-7 w-7 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <User className="h-3.5 w-3.5 text-white/60" />
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="h-7 w-7 rounded-full bg-accent/10 border border-accent/20 flex items-center justify-center flex-shrink-0">
                  <Bot className="h-3.5 w-3.5 text-accent" />
                </div>
                <div className="bg-[#14161f] border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1.5 items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="h-1.5 w-1.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="border-t border-white/10 px-4 py-3">
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about treks, permits, packing, planning…"
            maxLength={1000}
            disabled={loading || loadingHistory}
            className="flex-1 text-sm px-4 py-3 rounded-xl border border-white/10 bg-[#14161f] text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-accent/40 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || loadingHistory || input.trim().length === 0}
            className="px-4 py-3 rounded-xl bg-accent text-white disabled:opacity-50 flex items-center justify-center"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
