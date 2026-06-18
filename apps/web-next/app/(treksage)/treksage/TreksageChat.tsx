"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Send, Square, Mountain, MapPin, RefreshCw, Headphones, Mic, X,
  Plus, MessageSquare, Menu, Check, GitCompare, ArrowUpRight, Loader2,
} from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { treksageChat, fetchTreksageChatHistory, fetchTrekProfile, type TrekProfile } from "@/lib/api";
import PlanWizard from "@/components/treksage/PlanWizard";
import LeadCaptureModal from "@/components/treksage/LeadCaptureModal";
import TrekDetailPanel from "./TrekDetailPanel";

const SESSION_KEY_STORAGE    = "treksage_session_key";
const SESSIONS_LIST_STORAGE  = "treksage_sessions";
const CANVAS_CARDS_STORAGE   = "treksage_canvas";  // per-session canvas persistence

// ─── Types ────────────────────────────────────────────────────────────────────

type TabType = "Discover" | "Compare" | "Plan";
const TABS: TabType[] = ["Discover", "Compare", "Plan"];

interface StoredSession { key: string; title: string; ts: number; }

export interface TrekCard {
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

// ─── Constants ────────────────────────────────────────────────────────────────

const TAB_PROMPTS: Record<TabType, Array<{ icon: string; text: string; tag: TabType }>> = {
  Discover: [
    { icon: "⛰",  text: "Best snowfall treks for December",           tag: "Discover" },
    { icon: "🌄",  text: "Top beginner-friendly treks in Uttarakhand", tag: "Discover" },
    { icon: "🎒",  text: "Most scenic treks in Himachal Pradesh",      tag: "Discover" },
    { icon: "⛺",  text: "Best solo treks under 7 days",               tag: "Discover" },
    { icon: "📅",  text: "Safe treks to do during monsoon season",     tag: "Discover" },
  ],
  Compare: [
    { icon: "⚖", text: "Kedarkantha vs Brahmatal — which is better?", tag: "Compare" },
    { icon: "⚖", text: "Hampta Pass vs Beas Kund difficulty",          tag: "Compare" },
    { icon: "⚖", text: "Valley of Flowers vs Roopkund for beginners", tag: "Compare" },
    { icon: "⚖", text: "Best winter trek: Kedarkantha vs Kuari Pass", tag: "Compare" },
    { icon: "⚖", text: "Spiti Valley vs Ladakh treks comparison",     tag: "Compare" },
  ],
  Plan: [
    { icon: "📋", text: "Plan a 6-day trek for July under ₹15,000",   tag: "Plan" },
    { icon: "📋", text: "Trek under ₹10,000 for first-time trekkers", tag: "Plan" },
    { icon: "📋", text: "Weekend trek from Delhi — plan it for me",    tag: "Plan" },
    { icon: "📋", text: "Family-friendly 5-day trek in May",           tag: "Plan" },
    { icon: "📋", text: "Solo trek itinerary for a complete beginner", tag: "Plan" },
  ],
};

const TAG_STYLES: Record<TabType, string> = {
  Discover: "bg-[#E8702A]/10 text-[#E8702A]",
  Compare:  "bg-[#1D3A2E]/10 text-[#1D3A2E]",
  Plan:     "bg-purple-100 text-purple-600",
};

const THINKING_STAGES = [
  "Searching TrekYatra database…",
  "Analysing best options…",
  "Checking seasons & permits…",
  "Preparing your recommendations…",
];

// ─── Markdown renderer ────────────────────────────────────────────────────────

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
    <td className="px-3 py-2 text-[#1D3A2E]/75 border-b border-[#1D3A2E]/5">{children}</td>
  ),
  code: ({ children }) => (
    <code className="font-mono text-xs bg-[#1D3A2E]/8 px-1.5 py-0.5 rounded text-[#1D3A2E]">
      {children}
    </code>
  ),
};

// ─── Canvas trek card (right pane) ────────────────────────────────────────────

function CanvasTrekCard({
  card, index, isSelected, onViewDetails, onToggleCompare,
}: {
  card: TrekCard;
  index: number;
  isSelected: boolean;
  onViewDetails: (c: TrekCard) => void;
  onToggleCompare: (slug: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const budgetText = card.budget_min && card.budget_max
    ? `₹${Math.round(card.budget_min / 1000)}k–₹${Math.round(card.budget_max / 1000)}k`
    : card.budget_min
    ? `From ₹${Math.round(card.budget_min / 1000)}k`
    : card.budget_max
    ? `Up to ₹${Math.round(card.budget_max / 1000)}k`
    : null;

  return (
    <div
      className="bg-white rounded-2xl overflow-hidden border border-[#1D3A2E]/10 shadow-sm"
      style={{
        animation: "tsStaggerFade 0.4s ease-out both",
        animationDelay: `${index * 0.08}s`,
      }}
    >
      {/* Hero image */}
      <div className="relative h-36 bg-gradient-to-br from-[#E8F4EE] to-[#D4EAD9]">
        {card.hero_image_url && !imgError ? (
          <Image
            src={card.hero_image_url}
            alt={card.name}
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 50vw, 400px"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
            <Mountain className="h-8 w-8 text-[#1D3A2E]/40" />
            <span className="text-[9px] font-medium text-[#1D3A2E]/30 uppercase tracking-wide">Trek photo</span>
          </div>
        )}
        {card.difficulty && (
          <span className="absolute top-2.5 left-2.5 bg-[#1D3A2E]/80 backdrop-blur-sm text-white text-[9px] font-semibold px-2 py-0.5 rounded-full capitalize">
            {card.difficulty}
          </span>
        )}
      </div>

      <div className="p-3.5">
        {/* Trek name — analytics link, opens in new tab */}
        <Link
          href={`/trek/${card.slug}?ref=treksage`}
          target="_blank"
          rel="noopener"
          className="group flex items-start gap-1 mb-0.5"
        >
          <h4 className="font-display font-semibold text-[#1D3A2E] text-sm leading-tight group-hover:text-[#E8702A] transition-colors">
            {card.name}
          </h4>
          <ArrowUpRight className="h-3 w-3 text-[#1D3A2E]/25 group-hover:text-[#E8702A]/60 flex-shrink-0 mt-0.5 transition-colors" />
        </Link>
        {card.state && (
          <p className="flex items-center gap-1 text-[#1D3A2E]/40 text-[11px] mb-2.5">
            <MapPin className="h-3 w-3 flex-shrink-0" />{card.state}, India
          </p>
        )}

        {/* Stats row */}
        <div className="grid grid-cols-3 bg-[#FAF5EE] rounded-xl p-2 mb-3 gap-0.5">
          <div className="text-center">
            <p className="text-[#1D3A2E]/35 text-[9px] font-semibold uppercase tracking-wide">Duration</p>
            <p className="text-[#1D3A2E] text-[11px] font-semibold mt-0.5 leading-tight">{card.duration || "—"}</p>
          </div>
          <div className="text-center border-x border-[#1D3A2E]/8">
            <p className="text-[#1D3A2E]/35 text-[9px] font-semibold uppercase tracking-wide">Altitude</p>
            <p className="text-[#1D3A2E] text-[11px] font-semibold mt-0.5 leading-tight">
              {card.max_altitude_ft ? `${card.max_altitude_ft.toLocaleString()} ft` : "—"}
            </p>
          </div>
          <div className="text-center">
            <p className="text-[#1D3A2E]/35 text-[9px] font-semibold uppercase tracking-wide">Season</p>
            <p className="text-[#1D3A2E] text-[11px] font-semibold mt-0.5 leading-tight truncate">{card.season || "—"}</p>
          </div>
        </div>

        {budgetText && (
          <p className="text-[#E8702A] text-[11px] font-semibold mb-2.5">{budgetText}</p>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onViewDetails(card)}
            className="flex-1 text-center text-[11px] font-semibold py-2 rounded-xl bg-[#E8702A] text-white hover:bg-[#d4621f] transition-colors"
          >
            View Details
          </button>
          <button
            onClick={() => onToggleCompare(card.slug)}
            className={[
              "flex-1 flex items-center justify-center gap-1 text-[11px] font-semibold py-2 rounded-xl border transition-all",
              isSelected
                ? "bg-[#1D3A2E] text-white border-[#1D3A2E]"
                : "border-[#1D3A2E]/20 text-[#1D3A2E]/70 hover:bg-[#1D3A2E]/5",
            ].join(" ")}
          >
            {isSelected ? <><Check className="h-3 w-3" /> Added</> : "+ Compare"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Thinking bubble — multi-stage cascade ────────────────────────────────────

function ThinkingBubble({ stage }: { stage: number }) {
  return (
    <div className="flex gap-3 justify-start" style={{ animation: "tsSlideUp 0.2s ease-out" }}>
      <div className="h-8 w-8 rounded-full bg-[#1D3A2E] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
        <Mountain className="h-[15px] w-[15px] text-white" />
      </div>
      <div className="bg-white border border-[#1D3A2E]/10 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        {/* Pulsing dots */}
        <div className="flex gap-1 mb-2">
          <span className="h-1.5 w-1.5 rounded-full bg-[#E8702A]" style={{ animation: "tsBounce 1.2s ease-in-out infinite 0ms" }} />
          <span className="h-1.5 w-1.5 rounded-full bg-[#E8702A]" style={{ animation: "tsBounce 1.2s ease-in-out infinite 200ms" }} />
          <span className="h-1.5 w-1.5 rounded-full bg-[#E8702A]" style={{ animation: "tsBounce 1.2s ease-in-out infinite 400ms" }} />
        </div>
        {/* Stage cascade */}
        <div className="space-y-1">
          {THINKING_STAGES.slice(0, stage + 1).map((s, i) => (
            <div
              key={s}
              className="flex items-center gap-2"
              style={{ animation: "tsSlideUp 0.25s ease-out both" }}
            >
              {i < stage ? (
                <Check className="h-3 w-3 text-emerald-500 flex-shrink-0" />
              ) : (
                <span className="h-2 w-2 rounded-full bg-[#E8702A]/50 flex-shrink-0" style={{ animation: "tsPulse 1s ease-in-out infinite" }} />
              )}
              <span className={`text-[11px] ${i < stage ? "text-[#1D3A2E]/35 line-through" : "text-[#1D3A2E]/60"}`}>
                {s}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Inline trek card (chat pane — mobile only) ───────────────────────────────

function ChatTrekCard({ card, index }: { card: TrekCard; index: number }) {
  const [imgError, setImgError] = useState(false);
  return (
    <div
      className="bg-white rounded-xl overflow-hidden border border-[#1D3A2E]/10 shadow-sm flex gap-3 p-3"
      style={{ animation: "tsStaggerFade 0.4s ease-out both", animationDelay: `${index * 0.08}s` }}
    >
      <div className="relative h-16 w-16 flex-shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-[#E8F4EE] to-[#D4EAD9]">
        {card.hero_image_url && !imgError ? (
          <Image
            src={card.hero_image_url}
            alt={card.name}
            fill
            className="object-cover"
            sizes="64px"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Mountain className="h-6 w-6 text-[#1D3A2E]/40" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <Link
          href={`/trek/${card.slug}?ref=treksage`}
          target="_blank"
          rel="noopener"
          className="font-semibold text-[#1D3A2E] text-xs hover:text-[#E8702A] transition-colors line-clamp-1"
        >
          {card.name} <ArrowUpRight className="inline h-3 w-3 opacity-40" />
        </Link>
        {card.state && (
          <p className="text-[#1D3A2E]/40 text-[10px] mt-0.5">{card.state}</p>
        )}
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {card.difficulty && (
            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full bg-[#1D3A2E]/8 text-[#1D3A2E]/60 capitalize">
              {card.difficulty}
            </span>
          )}
          {card.duration && (
            <span className="text-[9px] text-[#1D3A2E]/40">{card.duration}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function TreksageChat({ initialQuery }: { initialQuery?: string }) {
  // ── Chat state ──
  const [messages, setMessages]               = useState<Message[]>([]);
  const [input, setInput]                     = useState("");
  const [loading, setLoading]                 = useState(false);
  const [sessionKey, setSessionKey]           = useState<string | undefined>(undefined);
  const [loadingHistory, setLoadingHistory]   = useState(true);
  const [activeTab, setActiveTab]             = useState<TabType>("Discover");
  const [thinkingStage, setThinkingStage]     = useState(0);

  // ── Canvas state ──
  const [canvasCards, setCanvasCards]         = useState<TrekCard[]>([]);
  const [canvasMode, setCanvasMode]           = useState<"cards" | "detail">("cards");
  const [detailCard, setDetailCard]           = useState<TrekCard | null>(null);
  const [detailProfile, setDetailProfile]     = useState<TrekProfile | null>(null);
  const [loadingDetail, setLoadingDetail]     = useState(false);
  const [compareSet, setCompareSet]           = useState<Set<string>>(new Set());

  // ── Sidebar / modals ──
  const [showWizard, setShowWizard]           = useState(false);
  const [showLeadModal, setShowLeadModal]     = useState(false);
  const [sessions, setSessions]               = useState<StoredSession[]>([]);
  const [sidebarOpen, setSidebarOpen]         = useState(false);
  const [voiceOpen, setVoiceOpen]             = useState(false);

  // ── Refs ──
  const messagesContainerRef   = useRef<HTMLDivElement>(null);
  const stageTimerRef          = useRef<ReturnType<typeof setInterval> | null>(null);
  const userSentRef            = useRef(false);
  const initialQueryFiredRef   = useRef(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef         = useRef<any>(null);

  const showCanvas = canvasCards.length > 0 && messages.length > 0;

  // ── Canvas card persistence helpers ──

  function saveCanvasCards(key: string, cards: TrekCard[]) {
    try {
      localStorage.setItem(`${CANVAS_CARDS_STORAGE}_${key}`, JSON.stringify(cards));
    } catch { /* ignore */ }
  }

  function loadCanvasCards(key: string): TrekCard[] {
    try {
      const raw = localStorage.getItem(`${CANVAS_CARDS_STORAGE}_${key}`);
      return raw ? (JSON.parse(raw) as TrekCard[]) : [];
    } catch { return []; }
  }

  // ── Scroll ──
  function scrollToBottom(smooth = true) {
    const el = messagesContainerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? "smooth" : "instant" });
  }

  // Restore session on mount
  useEffect(() => {
    try {
      const storedList = localStorage.getItem(SESSIONS_LIST_STORAGE);
      if (storedList) setSessions(JSON.parse(storedList));
    } catch { /* ignore */ }

    const stored = typeof window !== "undefined" ? localStorage.getItem(SESSION_KEY_STORAGE) : null;
    if (!stored) { setLoadingHistory(false); return; }
    setSessionKey(stored);
    fetchTreksageChatHistory(stored)
      .then((history) => {
        if (history.length > 0) {
          setMessages(history as Message[]);
        }
        // Restore canvas cards from localStorage (persisted per session)
        const saved = loadCanvasCards(stored);
        if (saved.length > 0) setCanvasCards(saved);
      })
      .finally(() => setLoadingHistory(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-send initialQuery (from ?q= param) once history is loaded and not loading
  useEffect(() => {
    if (!loadingHistory && !loading && initialQuery && !initialQueryFiredRef.current) {
      initialQueryFiredRef.current = true;
      send(initialQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingHistory, initialQuery]);

  // Auto-scroll after user sends
  useEffect(() => {
    if (!userSentRef.current) return;
    scrollToBottom();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, loading]);

  // Thinking stage advance
  useEffect(() => {
    if (loading) {
      setThinkingStage(0);
      stageTimerRef.current = setInterval(() => {
        setThinkingStage(prev => Math.min(prev + 1, THINKING_STAGES.length - 1));
      }, 1800);
    } else {
      if (stageTimerRef.current) clearInterval(stageTimerRef.current);
      setThinkingStage(0);
    }
    return () => { if (stageTimerRef.current) clearInterval(stageTimerRef.current); };
  }, [loading]);

  // ── Session helpers ──

  function pushSessionToList(key: string, title: string) {
    try {
      const existing: StoredSession[] = JSON.parse(localStorage.getItem(SESSIONS_LIST_STORAGE) || "[]");
      if (existing.find(s => s.key === key)) return;
      const updated = [{ key, title: title.slice(0, 55), ts: Date.now() }, ...existing].slice(0, 25);
      localStorage.setItem(SESSIONS_LIST_STORAGE, JSON.stringify(updated));
      setSessions(updated);
    } catch { /* ignore */ }
  }

  function switchSession(key: string) {
    if (key === sessionKey) { setSidebarOpen(false); return; }
    setMessages([]);
    setCanvasCards([]);
    setCanvasMode("cards");
    setDetailCard(null);
    setDetailProfile(null);
    setCompareSet(new Set());
    userSentRef.current = false;
    setLoadingHistory(true);
    setSidebarOpen(false);
    setSessionKey(key);
    localStorage.setItem(SESSION_KEY_STORAGE, key);
    fetchTreksageChatHistory(key)
      .then((history) => {
        if (history.length > 0) setMessages(history as Message[]);
        const saved = loadCanvasCards(key);
        if (saved.length > 0) setCanvasCards(saved);
        setTimeout(() => {
          const el = messagesContainerRef.current;
          if (el) el.scrollTo({ top: el.scrollHeight, behavior: "instant" });
        }, 60);
      })
      .finally(() => setLoadingHistory(false));
  }

  function clearSession() {
    setMessages([]);
    setCanvasCards([]);
    setCanvasMode("cards");
    setDetailCard(null);
    setDetailProfile(null);
    setCompareSet(new Set());
    setSessionKey(undefined);
    userSentRef.current = false;
    if (typeof window !== "undefined") localStorage.removeItem(SESSION_KEY_STORAGE);
  }

  // ── View Details — fetches full profile ──

  async function openDetail(card: TrekCard) {
    setDetailCard(card);
    setDetailProfile(null);
    setCanvasMode("detail");
    setLoadingDetail(true);
    const profile = await fetchTrekProfile(card.slug);
    setDetailProfile(profile);
    setLoadingDetail(false);
  }

  // ── Send ──

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const isNewSession = !sessionKey;
    userSentRef.current = true;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: trimmed }]);
    setLoading(true);
    try {
      const res = await treksageChat(trimmed, sessionKey);
      const cards = (res.trek_cards as TrekCard[] | undefined) ?? [];
      setMessages(prev => [...prev, { role: "assistant", content: res.reply, trek_cards: cards }]);
      if (cards.length > 0) {
        setCanvasCards(cards);
        setCanvasMode("cards");
        setDetailCard(null);
        setDetailProfile(null);
        // Persist cards so they survive navigation / page reload
        if (res.session_key) saveCanvasCards(res.session_key, cards);
      }
      if (res.session_key !== sessionKey) {
        setSessionKey(res.session_key);
        if (typeof window !== "undefined") localStorage.setItem(SESSION_KEY_STORAGE, res.session_key);
        if (isNewSession) pushSessionToList(res.session_key, trimmed);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "Sorry, I couldn't process that right now. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // ── Compare ──

  function toggleCompare(slug: string) {
    setCompareSet(prev => {
      const next = new Set(prev);
      if (next.has(slug)) { next.delete(slug); }
      else if (next.size < 4) { next.add(slug); }
      return next;
    });
  }

  function sendCompare() {
    const names = Array.from(compareSet)
      .map(slug => canvasCards.find(c => c.slug === slug)?.name ?? slug)
      .join(", ");
    setCompareSet(new Set());
    send(`Compare these treks: ${names}`);
  }

  // ── Voice input ──

  const startVoice = useCallback(() => {
    if (typeof window === "undefined") return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) {
      alert("Voice input requires Chrome or Edge. Please type your question instead.");
      return;
    }
    const recognition = new SR();
    recognition.lang = "en-IN";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognitionRef.current = recognition;
    setVoiceOpen(true);
    recognition.start();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (e: any) => {
      const text = (e.results[0][0].transcript as string).trim();
      setInput(text);
      setVoiceOpen(false);
    };
    recognition.onerror = () => setVoiceOpen(false);
    recognition.onend   = () => setVoiceOpen(false);
  }, []);

  // ── Sidebar groups ──

  const todayStart     = new Date().setHours(0, 0, 0, 0);
  const yesterdayStart = todayStart - 86_400_000;
  const grouped = {
    today:     sessions.filter(s => s.ts >= todayStart),
    yesterday: sessions.filter(s => s.ts >= yesterdayStart && s.ts < todayStart),
    earlier:   sessions.filter(s => s.ts < yesterdayStart),
  };

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Keyframe definitions */}
      <style>{`
        @keyframes tsSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes tsStaggerFade {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes tsCanvasSlideIn {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes tsBounce {
          0%, 80%, 100% { transform: translateY(0); }
          40%            { transform: translateY(-5px); }
        }
        @keyframes tsPulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 1; }
        }
        @keyframes tsVoicePulse {
          0%, 100% { transform: scale(1);   opacity: 0.5; }
          50%      { transform: scale(1.2); opacity: 1; }
        }
        .ts-input-focus:focus {
          outline: none;
          box-shadow: 0 0 0 3px rgba(232, 112, 42, 0.18), 0 0 12px rgba(232, 112, 42, 0.12);
          border-color: rgba(232, 112, 42, 0.5);
        }
      `}</style>

      {/* Modals */}
      {showWizard && (
        <PlanWizard
          onComplete={(prompt) => { setShowWizard(false); send(prompt); }}
          onClose={() => setShowWizard(false)}
        />
      )}
      {showLeadModal && <LeadCaptureModal onClose={() => setShowLeadModal(false)} />}

      {/* Voice modal */}
      {voiceOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-5 w-[320px] mb-6 sm:mb-0"
            style={{ animation: "tsSlideUp 0.25s ease-out" }}>
            <div className="relative h-24 w-24 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-[#E8702A]/15"
                style={{ animation: "tsVoicePulse 1.4s ease-in-out infinite" }} />
              <span className="absolute inset-3 rounded-full bg-[#E8702A]/25"
                style={{ animation: "tsVoicePulse 1.4s ease-in-out infinite 0.35s" }} />
              <div className="absolute inset-6 rounded-full bg-[#E8702A] flex items-center justify-center shadow-lg">
                <Mic className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-[#1D3A2E] font-semibold text-base mb-1">Listening…</p>
              <p className="text-[#1D3A2E]/40 text-sm">Speak your trek question clearly</p>
            </div>
            <button
              onClick={() => { recognitionRef.current?.stop(); setVoiceOpen(false); }}
              className="flex items-center gap-2 text-sm text-[#1D3A2E]/40 hover:text-[#1D3A2E] transition-colors px-4 py-2 rounded-xl hover:bg-[#1D3A2E]/5"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
          </div>
        </div>
      )}

      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/25 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex h-full">

        {/* ══ Sessions sidebar ══ */}
        <aside className={[
          "fixed left-0 top-0 bottom-0 z-40 w-[260px] bg-white border-r border-[#1D3A2E]/8",
          "flex flex-col overflow-hidden transition-transform duration-300 ease-in-out",
          "lg:relative lg:z-auto lg:translate-x-0 lg:flex-shrink-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
        ].join(" ")}>
          <div className="px-4 py-4 border-b border-[#1D3A2E]/8 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-full bg-[#1D3A2E] flex items-center justify-center flex-shrink-0">
                <Mountain className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="font-display font-semibold text-[#1D3A2E] text-sm">TrekSage</span>
            </div>
            <button onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-[#1D3A2E]/30 hover:text-[#1D3A2E] transition-colors p-1">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-3 pt-3 pb-2 flex-shrink-0">
            <button
              onClick={() => { clearSession(); setSidebarOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-[#1D3A2E]/15 text-[#1D3A2E]/55 hover:text-[#1D3A2E] hover:border-[#1D3A2E]/35 hover:bg-[#1D3A2E]/3 transition-all text-sm font-medium"
            >
              <Plus className="h-4 w-4 flex-shrink-0" /> New Conversation
            </button>
          </div>
          <div className="flex-1 overflow-y-auto pb-4">
            {sessions.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <MessageSquare className="h-8 w-8 text-[#1D3A2E]/12 mx-auto mb-2" />
                <p className="text-[#1D3A2E]/25 text-xs">Your conversations will appear here</p>
              </div>
            ) : (
              <>
                {(["today", "yesterday", "earlier"] as const).map((group) => {
                  const items = grouped[group];
                  if (items.length === 0) return null;
                  const label = group === "today" ? "Today" : group === "yesterday" ? "Yesterday" : "Earlier";
                  return (
                    <div key={group}>
                      <p className="px-4 pt-3 pb-1 text-[#1D3A2E]/22 text-[10px] font-semibold uppercase tracking-widest">{label}</p>
                      {items.map(s => (
                        <button key={s.key} onClick={() => switchSession(s.key)}
                          className={[
                            "w-full text-left px-4 py-2.5 flex items-start gap-2.5 transition-colors group",
                            s.key === sessionKey ? "bg-[#E8702A]/8 border-r-2 border-[#E8702A]" : "hover:bg-[#1D3A2E]/4",
                          ].join(" ")}>
                          <MessageSquare className="h-3.5 w-3.5 text-[#1D3A2E]/18 flex-shrink-0 mt-0.5 group-hover:text-[#1D3A2E]/40 transition-colors" />
                          <span className="text-xs text-[#1D3A2E]/50 group-hover:text-[#1D3A2E]/80 line-clamp-2 text-left leading-snug transition-colors">
                            {s.title}
                          </span>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </aside>

        {/* ══ Main area ══ */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 bg-white border-b border-[#1D3A2E]/8 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <button onClick={() => setSidebarOpen(true)}
                className="lg:hidden -ml-1 p-1.5 rounded-lg text-[#1D3A2E]/35 hover:text-[#1D3A2E] hover:bg-[#1D3A2E]/5 transition-colors"
                aria-label="Open conversations">
                <Menu className="h-5 w-5" />
              </button>
              <div className="h-9 w-9 rounded-full bg-[#1D3A2E] flex items-center justify-center flex-shrink-0 shadow-sm">
                <Mountain className="h-[18px] w-[18px] text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-semibold text-[#1D3A2E] text-sm">TrekSage</h2>
                  <span className="flex items-center gap-1 text-emerald-600 text-[10px] font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                  </span>
                </div>
                <p className="text-[#1D3A2E]/35 text-[10px]">Powered by TrekYatra Intelligence</p>
              </div>
            </div>
            {messages.length > 0 && (
              <button onClick={clearSession}
                className="flex items-center gap-1.5 text-[#1D3A2E]/40 hover:text-[#1D3A2E] transition-colors text-xs border border-[#1D3A2E]/15 hover:border-[#1D3A2E]/30 rounded-xl px-3 py-1.5">
                <RefreshCw className="h-3 w-3" /> New Chat
              </button>
            )}
          </div>

          {/* ══ Split content area ══ */}
          <div className="flex-1 flex overflow-hidden relative">

            {/* Chat pane */}
            <div className={[
              "flex flex-col overflow-hidden transition-all duration-500 ease-in-out",
              showCanvas ? "w-full lg:w-[42%] lg:border-r lg:border-[#1D3A2E]/10 lg:flex-shrink-0" : "w-full",
            ].join(" ")}>
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 space-y-4 bg-[#FAF5EE]">

                {loadingHistory ? (
                  <div className="flex justify-center py-12">
                    <p className="text-[#1D3A2E]/30 text-sm">Restoring your conversation…</p>
                  </div>

                ) : messages.length === 0 ? (
                  /* Welcome / empty state */
                  <div className="flex flex-col items-center pt-4 pb-2 gap-5 max-w-lg mx-auto">
                    <div className="text-center">
                      <div className="h-16 w-16 rounded-full bg-[#1D3A2E] flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <Mountain className="h-8 w-8 text-white" />
                      </div>
                      <h3 className="font-display text-2xl font-semibold text-[#1D3A2E] mb-1">TrekSage</h3>
                      <p className="text-[#1D3A2E]/55 text-sm">Your AI trekking companion for India.</p>
                      <p className="text-[#1D3A2E]/35 text-xs mt-0.5">Ask about treks, compare routes, plan your journey.</p>
                    </div>
                    <div className="flex gap-2">
                      {TABS.map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)}
                          className={`text-[11px] font-semibold px-4 py-2 rounded-full transition-all ${
                            activeTab === tab
                              ? "bg-[#1D3A2E] text-white shadow-sm"
                              : "bg-white text-[#1D3A2E]/45 border border-[#1D3A2E]/15 hover:border-[#1D3A2E]/30 hover:text-[#1D3A2E]/70"
                          }`}>
                          {tab === "Discover" ? "⛰ " : tab === "Compare" ? "⚖ " : "📋 "}
                          {tab.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <div className="w-full">
                      <p className="text-[#1D3A2E]/25 text-[10px] font-semibold uppercase tracking-widest mb-3 text-center">Try Asking</p>
                      <div className="space-y-1">
                        {TAB_PROMPTS[activeTab].map(prompt => (
                          <button key={prompt.text} onClick={() => send(prompt.text)} disabled={loading}
                            className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-white transition-all text-left group border border-transparent hover:border-[#1D3A2E]/8 hover:shadow-sm">
                            <span className="text-base flex-shrink-0 w-6">{prompt.icon}</span>
                            <span className="flex-1 text-sm text-[#1D3A2E]/60 group-hover:text-[#1D3A2E]/80 transition-colors">{prompt.text}</span>
                            <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${TAG_STYLES[prompt.tag]}`}>
                              {prompt.tag.toUpperCase()}
                            </span>
                          </button>
                        ))}
                      </div>
                      {activeTab === "Plan" && (
                        <button onClick={() => setShowWizard(true)}
                          className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#1D3A2E] text-white text-sm font-semibold hover:bg-[#1D3A2E]/90 transition-colors shadow-sm">
                          🗺 Use Guided Planner (7-step)
                        </button>
                      )}
                    </div>
                  </div>

                ) : (
                  /* Conversation */
                  <>
                    {messages.map((msg, i) => (
                      <div key={i}
                        className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        style={{ animation: "tsSlideUp 0.22s ease-out" }}>
                        {msg.role === "assistant" && (
                          <div className="h-8 w-8 rounded-full bg-[#1D3A2E] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                            <Mountain className="h-[15px] w-[15px] text-white" />
                          </div>
                        )}
                        <div className={msg.role === "user" ? "max-w-[75%]" : "max-w-[95%] min-w-0"}>
                          <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            msg.role === "user"
                              ? "bg-[#1D3A2E] text-white rounded-tr-sm shadow-sm"
                              : "bg-white border border-[#1D3A2E]/10 text-[#1D3A2E]/80 rounded-tl-sm shadow-sm"
                          }`}>
                            {msg.role === "assistant" ? (
                              <ReactMarkdown components={mdComponents} remarkPlugins={[remarkGfm]}>
                                {msg.content}
                              </ReactMarkdown>
                            ) : msg.content}
                          </div>
                          {/* Inline trek cards — visible on mobile only (hidden on lg where canvas is shown) */}
                          {msg.role === "assistant" && msg.trek_cards && msg.trek_cards.length > 0 && (
                            <div className="mt-2 space-y-2 lg:hidden">
                              {msg.trek_cards.slice(0, 4).map((card, idx) => (
                                <ChatTrekCard key={card.slug} card={card} index={idx} />
                              ))}
                            </div>
                          )}
                        </div>
                        {msg.role === "user" && (
                          <div className="h-8 w-8 rounded-full bg-[#1D3A2E]/10 border border-[#1D3A2E]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-[11px] font-semibold text-[#1D3A2E]/50">U</span>
                          </div>
                        )}
                      </div>
                    ))}
                    {loading && <ThinkingBubble stage={thinkingStage} />}
                  </>
                )}
              </div>
            </div>

            {/* Canvas pane — desktop only, slides in */}
            {showCanvas && (
              <div
                className="hidden lg:flex flex-col flex-1 bg-[#FAF5EE] overflow-hidden"
                style={{ animation: "tsCanvasSlideIn 0.4s ease-out" }}
              >
                {/* Canvas header */}
                <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-[#1D3A2E]/8 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    {canvasMode === "detail" && detailCard ? (
                      <>
                        <button onClick={() => { setCanvasMode("cards"); setDetailCard(null); setDetailProfile(null); }}
                          className="text-[#1D3A2E]/40 hover:text-[#1D3A2E] text-xs flex items-center gap-1 transition-colors">
                          ← Trek Results
                        </button>
                        <span className="text-[#1D3A2E]/25">·</span>
                        <span className="text-[#1D3A2E] text-xs font-semibold truncate max-w-[200px]">{detailCard.name}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-[#1D3A2E] text-xs font-semibold">{canvasCards.length} Treks Found</span>
                        {compareSet.size > 0 && (
                          <span className="text-[10px] text-[#1D3A2E]/40">· {compareSet.size} selected</span>
                        )}
                      </>
                    )}
                  </div>
                  {canvasMode === "cards" && compareSet.size >= 2 && (
                    <button onClick={sendCompare}
                      className="flex items-center gap-1.5 bg-[#1D3A2E] text-white text-[11px] font-semibold px-3.5 py-2 rounded-xl hover:bg-[#1D3A2E]/90 transition-colors shadow-sm">
                      <GitCompare className="h-3.5 w-3.5" /> Compare ({compareSet.size})
                    </button>
                  )}
                </div>

                {/* Canvas content */}
                <div className="flex-1 overflow-y-auto p-5">
                  {canvasMode === "detail" && detailCard ? (
                    loadingDetail ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Loader2 className="h-8 w-8 text-[#E8702A] animate-spin" />
                        <p className="text-[#1D3A2E]/40 text-sm">Loading trek details…</p>
                      </div>
                    ) : (
                      <TrekDetailPanel
                        card={detailCard}
                        profile={detailProfile}
                        onClose={() => { setCanvasMode("cards"); setDetailCard(null); setDetailProfile(null); }}
                      />
                    )
                  ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                      {canvasCards.map((card, idx) => (
                        <CanvasTrekCard
                          key={card.slug}
                          card={card}
                          index={idx}
                          isSelected={compareSet.has(card.slug)}
                          onViewDetails={openDetail}
                          onToggleCompare={toggleCompare}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ══ Input bar ══ */}
          <div className="bg-white border-t border-[#1D3A2E]/8 px-4 sm:px-6 py-3 flex-shrink-0">
            {/* Floating compare button on mobile */}
            {compareSet.size >= 2 && (
              <div className="mb-2 flex justify-center lg:hidden">
                <button onClick={sendCompare}
                  className="flex items-center gap-2 bg-[#1D3A2E] text-white text-xs font-semibold px-5 py-2.5 rounded-full shadow-lg hover:bg-[#1D3A2E]/90 transition-colors">
                  <GitCompare className="h-4 w-4" /> Compare ({compareSet.size}) Treks
                </button>
              </div>
            )}
            <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex gap-2 items-center">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask TrekSage about treks, seasons, permits, safety…"
                maxLength={1000}
                disabled={loading || loadingHistory}
                className="ts-input-focus flex-1 text-sm px-4 py-3 rounded-xl bg-[#FAF5EE] border border-[#1D3A2E]/15 text-[#1D3A2E] placeholder:text-[#1D3A2E]/30 disabled:opacity-50 transition-all"
              />
              <button type="button" onClick={startVoice}
                disabled={loading || loadingHistory}
                aria-label="Voice input"
                className="h-11 w-11 rounded-xl border border-[#1D3A2E]/15 text-[#1D3A2E]/40 disabled:opacity-40 flex items-center justify-center hover:text-[#E8702A] hover:border-[#E8702A]/30 hover:bg-[#E8702A]/5 transition-colors flex-shrink-0">
                <Mic className="h-4 w-4" />
              </button>
              <button type="submit"
                disabled={loading || loadingHistory || input.trim().length === 0}
                aria-label={loading ? "Generating…" : "Send"}
                className="h-11 w-11 rounded-xl bg-[#E8702A] text-white disabled:opacity-40 flex items-center justify-center hover:bg-[#d4621f] transition-colors flex-shrink-0 shadow-sm">
                {loading ? <Square className="h-4 w-4 fill-white" /> : <Send className="h-4 w-4" />}
              </button>
            </form>
          </div>

          {/* Expert help CTA */}
          {messages.length > 0 && !loading && (
            <div className="bg-[#1D3A2E]/4 border-t border-[#1D3A2E]/8 px-4 py-2.5 flex-shrink-0 flex items-center justify-between gap-3">
              <p className="text-[#1D3A2E]/50 text-xs">Want personalised help from a trek specialist?</p>
              <button onClick={() => setShowLeadModal(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#E8702A] hover:text-[#d4621f] transition-colors flex-shrink-0">
                <Headphones className="h-3.5 w-3.5" /> Get Expert Help
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
