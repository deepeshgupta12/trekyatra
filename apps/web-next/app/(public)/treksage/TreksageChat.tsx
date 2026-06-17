"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Send, Mountain, MapPin, RefreshCw, Headphones } from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { treksageChat, fetchTreksageChatHistory } from "@/lib/api";
import PlanWizard from "@/components/treksage/PlanWizard";
import LeadCaptureModal from "@/components/treksage/LeadCaptureModal";

const SESSION_KEY_STORAGE = "treksage_session_key";

// ─── Category tabs & prompt suggestions ──────────────────────────────────────

type TabType = "Discover" | "Compare" | "Plan";
const TABS: TabType[] = ["Discover", "Compare", "Plan"];

const TAB_PROMPTS: Record<TabType, Array<{ icon: string; text: string; tag: TabType }>> = {
  Discover: [
    { icon: "⛰", text: "Best snowfall treks for December", tag: "Discover" },
    { icon: "🌄", text: "Top beginner-friendly treks in Uttarakhand", tag: "Discover" },
    { icon: "🎒", text: "Most scenic treks in Himachal Pradesh", tag: "Discover" },
    { icon: "🏕", text: "Best solo treks under 7 days", tag: "Discover" },
    { icon: "🗓", text: "Safe treks to do during monsoon season", tag: "Discover" },
  ],
  Compare: [
    { icon: "⚖", text: "Kedarkantha vs Brahmatal — which is better?", tag: "Compare" },
    { icon: "⚖", text: "Hampta Pass vs Beas Kund difficulty", tag: "Compare" },
    { icon: "⚖", text: "Valley of Flowers vs Roopkund for beginners", tag: "Compare" },
    { icon: "⚖", text: "Best winter trek: Kedarkantha vs Kuari Pass", tag: "Compare" },
    { icon: "⚖", text: "Spiti Valley vs Ladakh treks comparison", tag: "Compare" },
  ],
  Plan: [
    { icon: "📋", text: "Plan a 6-day trek for July under ₹15,000", tag: "Plan" },
    { icon: "📋", text: "Trek under ₹10,000 for first-time trekkers", tag: "Plan" },
    { icon: "📋", text: "Weekend trek from Delhi — plan it for me", tag: "Plan" },
    { icon: "📋", text: "Family-friendly 5-day trek in May", tag: "Plan" },
    { icon: "📋", text: "Solo trek itinerary for a complete beginner", tag: "Plan" },
  ],
};

const TAG_STYLES: Record<TabType, string> = {
  Discover: "bg-[#E8702A]/10 text-[#E8702A]",
  Compare:  "bg-[#1D3A2E]/10 text-[#1D3A2E]",
  Plan:     "bg-purple-100 text-purple-600",
};

const LOADING_MESSAGES = [
  "Searching trek database…",
  "Analysing best options for you…",
  "Checking permits and seasons…",
  "Comparing trail conditions…",
  "Preparing your recommendation…",
];

// ─── Interfaces ───────────────────────────────────────────────────────────────

interface TrekCard {
  slug: string;
  name: string;
  state: string | null;
  difficulty: string | null;
  duration: string | null;
  season: string | null;
  max_altitude_ft: number | null;
  budget_min: number | null;
  budget_max: number | null;
  hero_image_url: string | null;
}

interface Message {
  role: "user" | "assistant";
  content: string;
  trek_cards?: TrekCard[];
}

// ─── Markdown components (light-mode pine palette) ────────────────────────────

const mdComponents: Components = {
  p:      ({ children }) => <p className="mb-1.5 last:mb-0 text-[#1D3A2E]/80">{children}</p>,
  strong: ({ children }) => <strong className="font-semibold text-[#1D3A2E]">{children}</strong>,
  em:     ({ children }) => <em className="italic">{children}</em>,
  ul:     ({ children }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5">{children}</ul>,
  ol:     ({ children }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5">{children}</ol>,
  li:     ({ children }) => <li className="text-[#1D3A2E]/75">{children}</li>,
  h2:     ({ children }) => <h2 className="font-semibold text-[#1D3A2E] mt-3 mb-1 first:mt-0">{children}</h2>,
  h3:     ({ children }) => <h3 className="font-semibold text-[#1D3A2E] mt-2 mb-0.5 first:mt-0">{children}</h3>,
  table:  ({ children }) => (
    <div className="overflow-x-auto my-2 rounded-xl border border-[#1D3A2E]/10">
      <table className="w-full text-xs border-collapse">{children}</table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-[#1D3A2E]/5">{children}</thead>,
  th:    ({ children }) => (
    <th className="text-left px-3 py-2 font-semibold text-[#1D3A2E]/55 text-[10px] uppercase tracking-wide border-b border-[#1D3A2E]/10">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="px-3 py-2 text-[#1D3A2E]/75 border-b border-[#1D3A2E]/5 last-row:border-0">
      {children}
    </td>
  ),
  code: ({ children }) => (
    <code className="font-mono text-xs bg-[#1D3A2E]/8 px-1.5 py-0.5 rounded text-[#1D3A2E]">
      {children}
    </code>
  ),
};

// ─── Trek result card ─────────────────────────────────────────────────────────

function TrekResultCard({ card, index }: { card: TrekCard; index: number }) {
  const matchPercent = Math.max(72, 96 - index * 5);
  const budgetText = card.budget_min && card.budget_max
    ? `₹${Math.round(card.budget_min / 1000)}k–₹${Math.round(card.budget_max / 1000)}k`
    : card.budget_min
    ? `From ₹${Math.round(card.budget_min / 1000)}k`
    : card.budget_max
    ? `Up to ₹${Math.round(card.budget_max / 1000)}k`
    : null;

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-[#1D3A2E]/10 shadow-sm">
      {/* Hero image */}
      <div className="relative h-36 bg-[#FAF5EE]">
        {card.hero_image_url ? (
          <Image
            src={card.hero_image_url}
            alt={card.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 560px"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Mountain className="h-10 w-10 text-[#1D3A2E]/20" />
          </div>
        )}
        <div className="absolute top-2.5 right-2.5 bg-[#E8702A] text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow">
          {matchPercent}% Match
        </div>
      </div>

      <div className="p-4">
        <h4 className="font-display font-semibold text-[#1D3A2E] text-sm leading-tight mb-0.5">
          {card.name}
        </h4>
        {card.state && (
          <p className="flex items-center gap-1 text-[#1D3A2E]/45 text-xs mb-3">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            {card.state}, India
          </p>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 bg-[#FAF5EE] rounded-xl p-2.5 mb-3">
          <div className="text-center">
            <p className="text-[#1D3A2E]/40 text-[9px] font-semibold uppercase tracking-wide">Duration</p>
            <p className="text-[#1D3A2E] text-xs font-semibold mt-0.5">{card.duration || "—"}</p>
          </div>
          <div className="text-center border-x border-[#1D3A2E]/10">
            <p className="text-[#1D3A2E]/40 text-[9px] font-semibold uppercase tracking-wide">Altitude</p>
            <p className="text-[#1D3A2E] text-xs font-semibold mt-0.5">
              {card.max_altitude_ft ? `${card.max_altitude_ft.toLocaleString()} ft` : "—"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[#1D3A2E]/40 text-[9px] font-semibold uppercase tracking-wide">Best Season</p>
            <p className="text-[#1D3A2E] text-xs font-semibold mt-0.5">{card.season || "—"}</p>
          </div>
        </div>

        {/* Difficulty + Budget */}
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {card.difficulty && (
            <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-[#1D3A2E]/8 text-[#1D3A2E] border border-[#1D3A2E]/15 capitalize">
              {card.difficulty}
            </span>
          )}
          {budgetText && (
            <span className="text-[10px] font-semibold text-[#E8702A]">{budgetText}</span>
          )}
        </div>

        {/* CTA row */}
        <div className="flex gap-2">
          <Link
            href={`/trek/${card.slug}`}
            className="flex-1 text-center text-xs font-semibold py-2 rounded-xl bg-[#E8702A] text-white hover:bg-[#d4621f] transition-colors"
          >
            View Details
          </Link>
          <Link
            href={`/plan?q=${encodeURIComponent(card.name)}`}
            className="flex-1 text-center text-xs font-semibold py-2 rounded-xl border border-[#1D3A2E]/20 text-[#1D3A2E] hover:bg-[#1D3A2E]/5 transition-colors"
          >
            Plan Trip
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── Loading bubble with rotating contextual messages ─────────────────────────

function LoadingBubble({ message }: { message: string }) {
  return (
    <div className="flex gap-3 justify-start">
      <div className="h-8 w-8 rounded-full bg-[#1D3A2E] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
        <Mountain className="h-4 w-4 text-white" />
      </div>
      <div className="bg-white border border-[#1D3A2E]/10 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#E8702A] animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="h-1.5 w-1.5 rounded-full bg-[#E8702A] animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="h-1.5 w-1.5 rounded-full bg-[#E8702A] animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
          <span className="text-xs text-[#1D3A2E]/40">{message}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main chat component ──────────────────────────────────────────────────────

export default function TreksageChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionKey, setSessionKey] = useState<string | undefined>(undefined);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>("Discover");
  const [loadingMsg, setLoadingMsg] = useState(LOADING_MESSAGES[0]);
  const [showWizard, setShowWizard] = useState(false);
  const [showLeadModal, setShowLeadModal] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const loadingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Only auto-scroll after the user has sent at least one message (not during history restore)
  const userSentRef = useRef(false);

  // Restore prior session on mount
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem(SESSION_KEY_STORAGE) : null;
    if (!stored) { setLoadingHistory(false); return; }
    setSessionKey(stored);
    fetchTreksageChatHistory(stored)
      .then((history) => { if (history.length > 0) setMessages(history as Message[]); })
      .finally(() => setLoadingHistory(false));
  }, []);

  // Auto-scroll to latest message — only after user sends (not on history restore)
  useEffect(() => {
    if (!userSentRef.current) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Rotate loading messages while the bot is thinking
  useEffect(() => {
    if (loading) {
      let idx = 0;
      loadingTimerRef.current = setInterval(() => {
        idx = (idx + 1) % LOADING_MESSAGES.length;
        setLoadingMsg(LOADING_MESSAGES[idx]);
      }, 1800);
    } else {
      if (loadingTimerRef.current) clearInterval(loadingTimerRef.current);
      setLoadingMsg(LOADING_MESSAGES[0]);
    }
    return () => { if (loadingTimerRef.current) clearInterval(loadingTimerRef.current); };
  }, [loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    userSentRef.current = true;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setLoading(true);
    try {
      const res = await treksageChat(trimmed, sessionKey);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: res.reply,
          trek_cards: (res.trek_cards as TrekCard[] | undefined) ?? [],
        },
      ]);
      if (res.session_key !== sessionKey) {
        setSessionKey(res.session_key);
        if (typeof window !== "undefined") localStorage.setItem(SESSION_KEY_STORAGE, res.session_key);
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
    <>
    {showWizard && (
      <PlanWizard
        onComplete={(prompt) => { setShowWizard(false); send(prompt); }}
        onClose={() => setShowWizard(false)}
      />
    )}
    {showLeadModal && (
      <LeadCaptureModal onClose={() => setShowLeadModal(false)} />
    )}
    <div className="flex flex-col h-[calc(100vh-120px)] min-h-[560px] max-h-[880px] bg-[#FAF5EE] rounded-2xl overflow-hidden border border-[#1D3A2E]/10 shadow-xl">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-[#1D3A2E]/8 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-[#1D3A2E] flex items-center justify-center flex-shrink-0 shadow-sm">
            <Mountain className="h-[18px] w-[18px] text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display font-semibold text-[#1D3A2E] text-sm">TrekSage</h2>
              <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-medium">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Online
              </span>
            </div>
            <p className="text-[#1D3A2E]/35 text-[10px]">Powered by TrekYatra Intelligence</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearSession}
            className="flex items-center gap-1.5 text-[#1D3A2E]/40 hover:text-[#1D3A2E] transition-colors text-xs border border-[#1D3A2E]/15 hover:border-[#1D3A2E]/30 rounded-xl px-3 py-1.5"
          >
            <RefreshCw className="h-3 w-3" /> New Chat
          </button>
        )}
      </div>

      {/* ── Messages area ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4">
        {loadingHistory ? (
          <div className="flex justify-center py-12">
            <p className="text-[#1D3A2E]/30 text-sm">Restoring your conversation…</p>
          </div>

        ) : messages.length === 0 ? (
          /* ── Empty / welcome state ── */
          <div className="flex flex-col items-center pt-4 pb-2 gap-5">
            {/* Logo */}
            <div className="text-center">
              <div className="h-16 w-16 rounded-full bg-[#1D3A2E] flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Mountain className="h-8 w-8 text-white" />
              </div>
              <h3 className="font-display text-2xl font-semibold text-[#1D3A2E] mb-1">TrekSage</h3>
              <p className="text-[#1D3A2E]/55 text-sm">Your AI trekking companion for India.</p>
              <p className="text-[#1D3A2E]/35 text-xs mt-0.5">
                Ask about treks, compare routes, plan your journey.
              </p>
            </div>

            {/* Category tabs */}
            <div className="flex gap-2">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`text-[11px] font-semibold px-4 py-2 rounded-full transition-all ${
                    activeTab === tab
                      ? "bg-[#1D3A2E] text-white shadow-sm"
                      : "bg-white text-[#1D3A2E]/45 border border-[#1D3A2E]/15 hover:border-[#1D3A2E]/30 hover:text-[#1D3A2E]/70"
                  }`}
                >
                  {tab === "Discover" ? "⛰ " : tab === "Compare" ? "⚖ " : "📋 "}
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Prompt suggestions */}
            <div className="w-full max-w-md">
              <p className="text-[#1D3A2E]/25 text-[10px] font-semibold uppercase tracking-widest mb-3 text-center">
                Try Asking
              </p>
              <div className="space-y-1">
                {TAB_PROMPTS[activeTab].map((prompt) => (
                  <button
                    key={prompt.text}
                    onClick={() => send(prompt.text)}
                    disabled={loading}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white transition-colors text-left group border border-transparent hover:border-[#1D3A2E]/8 hover:shadow-sm"
                  >
                    <span className="text-base flex-shrink-0 w-6">{prompt.icon}</span>
                    <span className="flex-1 text-sm text-[#1D3A2E]/60 group-hover:text-[#1D3A2E]/80 transition-colors">
                      {prompt.text}
                    </span>
                    <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${TAG_STYLES[prompt.tag]}`}>
                      {prompt.tag.toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>
              {/* Guided wizard CTA — only on Plan tab */}
              {activeTab === "Plan" && (
                <button
                  onClick={() => setShowWizard(true)}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#1D3A2E] text-white text-sm font-semibold hover:bg-[#1D3A2E]/90 transition-colors shadow-sm"
                >
                  🗺 Use Guided Planner (7-step)
                </button>
              )}
            </div>
          </div>

        ) : (
          /* ── Conversation ── */
          <>
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>

                {/* Bot avatar */}
                {msg.role === "assistant" && (
                  <div className="h-8 w-8 rounded-full bg-[#1D3A2E] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                    <Mountain className="h-[15px] w-[15px] text-white" />
                  </div>
                )}

                <div className={msg.role === "user" ? "max-w-[75%]" : "max-w-[85%] min-w-0"}>
                  {/* Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[#1D3A2E] text-white rounded-tr-sm"
                        : "bg-white border border-[#1D3A2E]/10 text-[#1D3A2E]/80 rounded-tl-sm shadow-sm"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <ReactMarkdown components={mdComponents} remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )}
                  </div>

                  {/* Trek cards below assistant message */}
                  {msg.role === "assistant" && msg.trek_cards && msg.trek_cards.length > 0 && (
                    <div className="mt-3 space-y-3">
                      {msg.trek_cards.slice(0, 4).map((card, idx) => (
                        <TrekResultCard key={card.slug} card={card} index={idx} />
                      ))}
                    </div>
                  )}
                </div>

                {/* User avatar */}
                {msg.role === "user" && (
                  <div className="h-8 w-8 rounded-full bg-[#1D3A2E]/10 border border-[#1D3A2E]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[11px] font-semibold text-[#1D3A2E]/50">U</span>
                  </div>
                )}
              </div>
            ))}

            {loading && <LoadingBubble message={loadingMsg} />}
          </>
        )}

        <div ref={bottomRef} />
      </div>

      {/* ── Input bar ── */}
      <div className="bg-white border-t border-[#1D3A2E]/8 px-4 py-3 flex-shrink-0">
        <form
          onSubmit={(e) => { e.preventDefault(); send(input); }}
          className="flex gap-2 items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask TrekSage about treks, seasons, permits, safety…"
            maxLength={1000}
            disabled={loading || loadingHistory}
            className="flex-1 text-sm px-4 py-3 rounded-xl bg-[#FAF5EE] border border-[#1D3A2E]/15 text-[#1D3A2E] placeholder:text-[#1D3A2E]/30 focus:outline-none focus:ring-2 focus:ring-[#E8702A]/20 focus:border-[#E8702A]/40 disabled:opacity-50 transition-colors"
          />
          <button
            type="submit"
            disabled={loading || loadingHistory || input.trim().length === 0}
            className="h-11 w-11 rounded-xl bg-[#E8702A] text-white disabled:opacity-40 flex items-center justify-center hover:bg-[#d4621f] transition-colors flex-shrink-0 shadow-sm"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>

      {/* ── Expert help CTA — shown after any conversation ── */}
      {messages.length > 0 && !loading && (
        <div className="bg-[#1D3A2E]/4 border-t border-[#1D3A2E]/8 px-4 py-2.5 flex-shrink-0 flex items-center justify-between gap-3">
          <p className="text-[#1D3A2E]/50 text-xs">Want personalised help from a trek specialist?</p>
          <button
            onClick={() => setShowLeadModal(true)}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#E8702A] hover:text-[#d4621f] transition-colors flex-shrink-0"
          >
            <Headphones className="h-3.5 w-3.5" /> Get Expert Help
          </button>
        </div>
      )}
    </div>
    </>
  );
}
