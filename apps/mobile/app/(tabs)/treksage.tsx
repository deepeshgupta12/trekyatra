import { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { treksageChatMobile, fetchTreksageHistoryMobile, type TreksageMobileMessage, type TreksageMobileTrekCard } from "@/lib/mobileApi";

const PINE    = "#1D3A2E";
const SAFFRON = "#E8702A";
const CREAM   = "#FAF5EE";
const SESSION_STORAGE_KEY = "treksage_mobile_session";
const CANVAS_STORAGE_KEY  = "treksage_mobile_canvas";

type TabType = "Discover" | "Compare" | "Plan";
const TABS: TabType[] = ["Discover", "Compare", "Plan"];

const TAB_PROMPTS: Record<TabType, string[]> = {
  Discover: [
    "Best snowfall treks for December",
    "Top beginner treks in Uttarakhand",
    "Safe solo treks in Himachal Pradesh",
  ],
  Compare: [
    "Kedarkantha vs Brahmatal — which is better?",
    "Hampta Pass vs Beas Kund difficulty",
    "Valley of Flowers vs Roopkund for beginners",
  ],
  Plan: [
    "Plan a 5-day trek in July under ₹12,000",
    "Weekend trek from Delhi for first-timers",
    "Family-friendly trek in May — recommend 3",
  ],
};

const THINKING_STAGES = [
  "Searching TrekYatra database…",
  "Analysing best options…",
  "Checking seasons & permits…",
  "Preparing recommendations…",
];

interface Message extends TreksageMobileMessage {
  trek_cards?: TreksageMobileTrekCard[];
}

// ─── Trek card component ──────────────────────────────────────────────────────

function TrekCardItem({
  card,
  isSelected,
  onView,
  onToggleCompare,
}: {
  card: TreksageMobileTrekCard;
  isSelected: boolean;
  onView: (slug: string) => void;
  onToggleCompare: (slug: string) => void;
}) {
  const budgetText = card.budget_min && card.budget_max
    ? `₹${Math.round(card.budget_min / 1000)}k–₹${Math.round(card.budget_max / 1000)}k`
    : null;

  return (
    <View style={styles.trekCard}>
      {/* Top row: name + location */}
      <View style={styles.trekCardHeader}>
        <View style={{ flex: 1 }}>
          <Text style={styles.trekCardName} numberOfLines={1}>{card.name}</Text>
          {card.state ? (
            <Text style={styles.trekCardState}>{card.state}, India</Text>
          ) : null}
        </View>
        {card.difficulty ? (
          <View style={styles.diffBadge}>
            <Text style={styles.diffBadgeText}>{card.difficulty}</Text>
          </View>
        ) : null}
      </View>

      {/* Stats row */}
      <View style={styles.trekStats}>
        <View style={styles.trekStatItem}>
          <Ionicons name="time-outline" size={10} color={`${PINE}60`} />
          <Text style={styles.trekStatLabel}>Duration</Text>
          <Text style={styles.trekStatValue}>{card.duration ?? "—"}</Text>
        </View>
        <View style={[styles.trekStatItem, styles.trekStatBorder]}>
          <Ionicons name="trending-up-outline" size={10} color={`${PINE}60`} />
          <Text style={styles.trekStatLabel}>Altitude</Text>
          <Text style={styles.trekStatValue}>
            {card.max_altitude_ft ? `${card.max_altitude_ft.toLocaleString()} ft` : "—"}
          </Text>
        </View>
        <View style={styles.trekStatItem}>
          <Ionicons name="sunny-outline" size={10} color={`${PINE}60`} />
          <Text style={styles.trekStatLabel}>Season</Text>
          <Text style={styles.trekStatValue} numberOfLines={1}>{card.season ?? "—"}</Text>
        </View>
      </View>

      {budgetText && (
        <Text style={styles.trekBudget}>{budgetText}</Text>
      )}

      {/* Actions */}
      <View style={styles.trekCardActions}>
        <TouchableOpacity
          onPress={() => onView(card.slug)}
          style={styles.viewBtn}
        >
          <Text style={styles.viewBtnText}>View Trek</Text>
          <Ionicons name="arrow-forward" size={12} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onToggleCompare(card.slug)}
          style={[styles.compareBtn, isSelected && styles.compareBtnSelected]}
        >
          <Ionicons
            name={isSelected ? "checkmark" : "add"}
            size={13}
            color={isSelected ? "#fff" : `${PINE}70`}
          />
          <Text style={[styles.compareBtnText, isSelected && styles.compareBtnTextSelected]}>
            {isSelected ? "Added" : "Compare"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Thinking animation ───────────────────────────────────────────────────────

function ThinkingBubble({ stage }: { stage: number }) {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = (val: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 350, useNativeDriver: true }),
          Animated.timing(val, { toValue: 0.3, duration: 350, useNativeDriver: true }),
        ])
      );
    const a1 = pulse(dot1, 0);
    const a2 = pulse(dot2, 175);
    const a3 = pulse(dot3, 350);
    a1.start(); a2.start(); a3.start();
    return () => { a1.stop(); a2.stop(); a3.stop(); };
  }, []);

  return (
    <View style={[styles.msgRow, styles.msgRowBot]}>
      <View style={styles.botAvatar}>
        <Ionicons name="leaf" size={12} color="#fff" />
      </View>
      <View style={styles.bubbleBot}>
        <View style={styles.loadingDots}>
          <Animated.View style={[styles.dot, { opacity: dot1 }]} />
          <Animated.View style={[styles.dot, { opacity: dot2 }]} />
          <Animated.View style={[styles.dot, { opacity: dot3 }]} />
        </View>
        <View style={{ marginTop: 6, gap: 4 }}>
          {THINKING_STAGES.slice(0, stage + 1).map((s, i) => (
            <View key={s} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              {i < stage ? (
                <Ionicons name="checkmark-circle" size={11} color="#10B981" />
              ) : (
                <View style={styles.stageDot} />
              )}
              <Text style={[
                styles.stageText,
                i < stage && { color: `${PINE}30`, textDecorationLine: "line-through" },
              ]}>
                {s}
              </Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function TrekSageScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [messages, setMessages]     = useState<Message[]>([]);
  const [input, setInput]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sessionKey, setSessionKey] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab]   = useState<TabType>("Discover");
  const [thinkingStage, setThinkingStage] = useState(0);
  const [compareSet, setCompareSet] = useState<Set<string>>(new Set());
  const [lastCards, setLastCards]   = useState<TreksageMobileTrekCard[]>([]);

  const scrollRef    = useRef<ScrollView>(null);
  const stageTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Restore session
  useEffect(() => {
    AsyncStorage.getItem(SESSION_STORAGE_KEY).then(async (stored) => {
      if (!stored) { setLoadingHistory(false); return; }
      setSessionKey(stored);
      const history = await fetchTreksageHistoryMobile(stored);
      if (history.length > 0) setMessages(history);
      // Restore last trek cards from localStorage
      const savedCards = await AsyncStorage.getItem(`${CANVAS_STORAGE_KEY}_${stored}`);
      if (savedCards) {
        try { setLastCards(JSON.parse(savedCards)); } catch { /* ignore */ }
      }
      setLoadingHistory(false);
    });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
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

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setLoading(true);
    try {
      const res = await treksageChatMobile(trimmed, sessionKey);
      const cards = res.trek_cards ?? [];
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: res.reply,
        trek_cards: cards,
      }]);
      if (cards.length > 0) {
        setLastCards(cards);
        if (res.session_key) {
          await AsyncStorage.setItem(`${CANVAS_STORAGE_KEY}_${res.session_key}`, JSON.stringify(cards));
        }
      }
      if (res.session_key !== sessionKey) {
        setSessionKey(res.session_key);
        await AsyncStorage.setItem(SESSION_STORAGE_KEY, res.session_key);
      }
    } catch {
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: "Sorry, I couldn't reach TrekSage right now. Please try again in a moment.",
      }]);
    } finally {
      setLoading(false);
    }
  }, [loading, sessionKey]);

  function clearSession() {
    setMessages([]);
    setLastCards([]);
    setCompareSet(new Set());
    setSessionKey(undefined);
    AsyncStorage.removeItem(SESSION_STORAGE_KEY);
  }

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
      .map(slug => lastCards.find(c => c.slug === slug)?.name ?? slug)
      .join(", ");
    setCompareSet(new Set());
    send(`Compare these treks: ${names}`);
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Ionicons name="leaf" size={16} color="#fff" />
            </View>
            <View>
              <View style={styles.headerNameRow}>
                <Text style={styles.headerName}>TrekSage</Text>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>Online</Text>
              </View>
              <Text style={styles.headerSub}>Powered by TrekYatra Intelligence</Text>
            </View>
          </View>
          {messages.length > 0 && (
            <TouchableOpacity onPress={clearSession} style={styles.newChatBtn}>
              <Ionicons name="refresh-outline" size={13} color="rgba(255,255,255,0.5)" />
              <Text style={styles.newChatText}>New</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ── Messages ── */}
        <ScrollView
          ref={scrollRef}
          style={styles.messageArea}
          contentContainerStyle={styles.messageContent}
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {loadingHistory ? (
            <View style={styles.centerMsg}>
              <ActivityIndicator color={SAFFRON} />
              <Text style={styles.centerMsgText}>Restoring your conversation…</Text>
            </View>
          ) : messages.length === 0 ? (
            /* ── Empty state ── */
            <View style={styles.emptyState}>
              <View style={styles.emptyAvatar}>
                <Ionicons name="leaf" size={32} color="#fff" />
              </View>
              <Text style={styles.emptyTitle}>TrekSage</Text>
              <Text style={styles.emptySub}>Your AI trekking companion for India.</Text>
              <Text style={styles.emptyHint}>Ask about treks, compare routes, plan your journey.</Text>

              {/* Tabs */}
              <View style={styles.tabRow}>
                {TABS.map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={[styles.tab, activeTab === tab && styles.tabActive]}
                  >
                    <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
                      {tab === "Discover" ? "⛰ " : tab === "Compare" ? "⚖ " : "📋 "}{tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Prompt chips */}
              <View style={styles.promptList}>
                {TAB_PROMPTS[activeTab].map((p) => (
                  <TouchableOpacity
                    key={p}
                    onPress={() => send(p)}
                    disabled={loading}
                    style={styles.promptChip}
                  >
                    <Text style={styles.promptChipText}>{p}</Text>
                    <Ionicons name="arrow-forward" size={12} color={`${PINE}50`} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ) : (
            /* ── Conversation ── */
            <>
              {messages.map((msg, i) => (
                <View
                  key={i}
                  style={[styles.msgRow, msg.role === "user" ? styles.msgRowUser : styles.msgRowBot]}
                >
                  {msg.role === "assistant" && (
                    <View style={styles.botAvatar}>
                      <Ionicons name="leaf" size={12} color="#fff" />
                    </View>
                  )}
                  <View style={[
                    styles.bubble,
                    msg.role === "user" ? styles.bubbleUser : styles.bubbleBot,
                    msg.trek_cards && msg.trek_cards.length > 0 ? { maxWidth: "95%" } : undefined,
                  ]}>
                    <Text style={[styles.bubbleText, msg.role === "user" && styles.bubbleTextUser]}>
                      {msg.content}
                    </Text>
                    {/* Trek cards */}
                    {msg.role === "assistant" && msg.trek_cards && msg.trek_cards.length > 0 && (
                      <View style={styles.trekCardList}>
                        {msg.trek_cards.slice(0, 4).map((card) => (
                          <TrekCardItem
                            key={card.slug}
                            card={card}
                            isSelected={compareSet.has(card.slug)}
                            onView={(slug) => router.push(`/trek/${slug}` as never)}
                            onToggleCompare={toggleCompare}
                          />
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              ))}
              {loading && <ThinkingBubble stage={thinkingStage} />}
            </>
          )}
        </ScrollView>

        {/* ── Compare bar ── */}
        {compareSet.size >= 2 && (
          <View style={styles.compareBar}>
            <Text style={styles.compareBarText}>{compareSet.size} treks selected</Text>
            <TouchableOpacity onPress={sendCompare} style={styles.compareBarBtn}>
              <Ionicons name="git-compare-outline" size={14} color="#fff" />
              <Text style={styles.compareBarBtnText}>Compare ({compareSet.size})</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Input bar ── */}
        <View style={[styles.inputBar, { backgroundColor: isDark ? colors.surface : "#fff", borderTopColor: isDark ? "rgba(255,255,255,0.08)" : `${PINE}12` }]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Ask about treks, seasons, permits…"
            placeholderTextColor={`${PINE}50`}
            maxLength={500}
            editable={!loading && !loadingHistory}
            returnKeyType="send"
            onSubmitEditing={() => send(input)}
            multiline={false}
          />
          <TouchableOpacity
            onPress={() => send(input)}
            disabled={loading || input.trim().length === 0}
            style={[styles.sendBtn, (loading || input.trim().length === 0) && styles.sendBtnDisabled]}
          >
            <Ionicons name="send" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: CREAM },
  flex: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12,
    backgroundColor: PINE,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center", justifyContent: "center",
  },
  headerNameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerName: { color: "#fff", fontWeight: "700", fontSize: 14, fontFamily: "Inter_700Bold" },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#34D399" },
  onlineText: { color: "#34D399", fontSize: 10, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  headerSub: { color: "rgba(255,255,255,0.4)", fontSize: 10, marginTop: 1, fontFamily: "Inter_400Regular" },
  newChatBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  newChatText: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontFamily: "Inter_400Regular" },
  messageArea: { flex: 1 },
  messageContent: { padding: 16, paddingBottom: 8 },
  centerMsg: { alignItems: "center", paddingTop: 60, gap: 10 },
  centerMsgText: { color: `${PINE}50`, fontSize: 13, fontFamily: "Inter_400Regular" },
  emptyState: { alignItems: "center", paddingTop: 24, paddingBottom: 8 },
  emptyAvatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: PINE,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
    shadowColor: PINE, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  emptyTitle: { color: PINE, fontSize: 22, fontWeight: "700", marginBottom: 4, fontFamily: "PlayfairDisplay_700Bold" },
  emptySub: { color: `${PINE}80`, fontSize: 14, marginBottom: 4, fontFamily: "Inter_400Regular" },
  emptyHint: { color: `${PINE}50`, fontSize: 12, marginBottom: 20, fontFamily: "Inter_400Regular" },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: "#fff", borderWidth: 1, borderColor: `${PINE}25`,
  },
  tabActive: { backgroundColor: PINE, borderColor: PINE },
  tabText: { fontSize: 11, fontWeight: "600", color: `${PINE}60`, fontFamily: "Inter_600SemiBold" },
  tabTextActive: { color: "#fff" },
  promptList: { width: "100%", gap: 6 },
  promptChip: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 11,
    backgroundColor: "#fff", borderRadius: 14,
    borderWidth: 1, borderColor: `${PINE}12`,
  },
  promptChipText: { flex: 1, fontSize: 13, color: `${PINE}70`, marginRight: 8, fontFamily: "Inter_400Regular" },
  msgRow: { flexDirection: "row", marginBottom: 12, alignItems: "flex-start" },
  msgRowUser: { justifyContent: "flex-end" },
  msgRowBot: { justifyContent: "flex-start" },
  botAvatar: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: PINE,
    alignItems: "center", justifyContent: "center", marginRight: 8, flexShrink: 0, marginTop: 2,
  },
  bubble: { maxWidth: "80%", borderRadius: 16, padding: 12 },
  bubbleUser: { backgroundColor: PINE, borderBottomRightRadius: 4 },
  bubbleBot: {
    backgroundColor: "#fff", borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: `${PINE}15`,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4,
  },
  bubbleText: { fontSize: 13, color: `${PINE}85`, lineHeight: 18, fontFamily: "Inter_400Regular" },
  bubbleTextUser: { color: "#fff" },
  // Trek cards
  trekCardList: { marginTop: 10, gap: 8 },
  trekCard: {
    backgroundColor: CREAM, borderRadius: 14,
    borderWidth: 1, borderColor: `${PINE}12`,
    padding: 10,
  },
  trekCardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 8, marginBottom: 8 },
  trekCardName: { fontSize: 13, fontWeight: "700", color: PINE, flex: 1, fontFamily: "Inter_700Bold" },
  trekCardState: { fontSize: 11, color: `${PINE}50`, marginTop: 1, fontFamily: "Inter_400Regular" },
  diffBadge: {
    backgroundColor: `${PINE}12`, borderRadius: 6,
    paddingHorizontal: 7, paddingVertical: 2,
  },
  diffBadgeText: { fontSize: 10, fontWeight: "600", color: `${PINE}70`, textTransform: "capitalize", fontFamily: "Inter_600SemiBold" },
  trekStats: {
    flexDirection: "row", backgroundColor: "#fff",
    borderRadius: 10, padding: 8, marginBottom: 6, gap: 0,
  },
  trekStatItem: { flex: 1, alignItems: "center", gap: 2 },
  trekStatBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: `${PINE}08` },
  trekStatLabel: { fontSize: 9, color: `${PINE}40`, fontWeight: "600", textTransform: "uppercase", fontFamily: "Inter_600SemiBold" },
  trekStatValue: { fontSize: 11, color: PINE, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  trekBudget: { fontSize: 11, fontWeight: "700", color: SAFFRON, marginBottom: 8, fontFamily: "Inter_700Bold" },
  trekCardActions: { flexDirection: "row", gap: 6 },
  viewBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 4, backgroundColor: SAFFRON, borderRadius: 9, paddingVertical: 8,
  },
  viewBtnText: { fontSize: 11, fontWeight: "700", color: "#fff", fontFamily: "Inter_700Bold" },
  compareBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 4, borderRadius: 9, paddingVertical: 8,
    borderWidth: 1, borderColor: `${PINE}20`, backgroundColor: "#fff",
  },
  compareBtnSelected: { backgroundColor: PINE, borderColor: PINE },
  compareBtnText: { fontSize: 11, fontWeight: "600", color: `${PINE}70`, fontFamily: "Inter_600SemiBold" },
  compareBtnTextSelected: { color: "#fff" },
  // Thinking
  loadingDots: { flexDirection: "row", gap: 4, padding: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: SAFFRON },
  stageDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: `${SAFFRON}60` },
  stageText: { fontSize: 11, color: `${PINE}55`, fontFamily: "Inter_400Regular" },
  // Compare bar
  compareBar: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: PINE,
  },
  compareBarText: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "Inter_400Regular" },
  compareBarBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: SAFFRON, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  compareBarBtnText: { color: "#fff", fontSize: 12, fontWeight: "700", fontFamily: "Inter_700Bold" },
  // Input bar
  inputBar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: "#fff",
    borderTopWidth: 1, borderTopColor: `${PINE}12`,
  },
  input: {
    flex: 1, fontSize: 13, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 14, backgroundColor: CREAM,
    borderWidth: 1, borderColor: `${PINE}18`,
    color: PINE, fontFamily: "Inter_400Regular",
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: SAFFRON,
    alignItems: "center", justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },
});
