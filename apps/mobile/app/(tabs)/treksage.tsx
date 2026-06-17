import { useCallback, useEffect, useRef, useState } from "react";
import {
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
import { Ionicons } from "@expo/vector-icons";
import { treksageChatMobile, fetchTreksageHistoryMobile, type TreksageMobileMessage, type TreksageMobileTrekCard } from "@/lib/mobileApi";

const PINE = "#1D3A2E";
const SAFFRON = "#E8702A";
const CREAM = "#FAF5EE";
const SESSION_STORAGE_KEY = "treksage_mobile_session";

type TabType = "Discover" | "Compare" | "Plan";
const TABS: TabType[] = ["Discover", "Compare", "Plan"];

const TAB_PROMPTS: Record<TabType, string[]> = {
  Discover: [
    "Best beginner treks in India for December",
    "Top treks in Uttarakhand under 7 days",
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

interface Message extends TreksageMobileMessage {
  trek_cards?: TreksageMobileTrekCard[];
}

export default function TrekSageScreen() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sessionKey, setSessionKey] = useState<string | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<TabType>("Discover");
  const scrollRef = useRef<ScrollView>(null);

  // Restore session
  useEffect(() => {
    AsyncStorage.getItem(SESSION_STORAGE_KEY).then(async (stored) => {
      if (!stored) { setLoadingHistory(false); return; }
      setSessionKey(stored);
      const history = await fetchTreksageHistoryMobile(stored);
      if (history.length > 0) setMessages(history);
      setLoadingHistory(false);
    });
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, loading]);

  const send = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: trimmed }]);
    setLoading(true);
    try {
      const res = await treksageChatMobile(trimmed, sessionKey);
      setMessages((prev) => [...prev, {
        role: "assistant",
        content: res.reply,
        trek_cards: res.trek_cards,
      }]);
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
    setSessionKey(undefined);
    AsyncStorage.removeItem(SESSION_STORAGE_KEY);
  }

  return (
    <SafeAreaView style={styles.safeArea}>
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
                  <View
                    style={[
                      styles.bubble,
                      msg.role === "user" ? styles.bubbleUser : styles.bubbleBot,
                    ]}
                  >
                    <Text style={[styles.bubbleText, msg.role === "user" && styles.bubbleTextUser]}>
                      {msg.content}
                    </Text>
                    {/* Trek cards (simplified — show names as chips) */}
                    {msg.role === "assistant" && msg.trek_cards && msg.trek_cards.length > 0 && (
                      <View style={styles.trekCards}>
                        {msg.trek_cards.slice(0, 3).map((card) => (
                          <View key={card.slug} style={styles.trekCardChip}>
                            <Ionicons name="walk-outline" size={10} color={SAFFRON} />
                            <Text style={styles.trekCardName}>{card.name}</Text>
                            {card.difficulty && (
                              <Text style={styles.trekCardDifficulty}>{card.difficulty}</Text>
                            )}
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              ))}
              {loading && (
                <View style={[styles.msgRow, styles.msgRowBot]}>
                  <View style={styles.botAvatar}>
                    <Ionicons name="leaf" size={12} color="#fff" />
                  </View>
                  <View style={styles.bubbleBot}>
                    <View style={styles.loadingDots}>
                      <View style={[styles.dot, { opacity: 0.9 }]} />
                      <View style={[styles.dot, { opacity: 0.6 }]} />
                      <View style={[styles.dot, { opacity: 0.3 }]} />
                    </View>
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* ── Input bar ── */}
        <View style={styles.inputBar}>
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
  headerName: { color: "#fff", fontWeight: "700", fontSize: 14 },
  onlineDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#34D399" },
  onlineText: { color: "#34D399", fontSize: 10, fontWeight: "600" },
  headerSub: { color: "rgba(255,255,255,0.4)", fontSize: 10, marginTop: 1 },
  newChatBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
    borderWidth: 1, borderColor: "rgba(255,255,255,0.2)",
  },
  newChatText: { color: "rgba(255,255,255,0.5)", fontSize: 11 },
  messageArea: { flex: 1 },
  messageContent: { padding: 16, paddingBottom: 8 },
  centerMsg: { alignItems: "center", paddingTop: 60, gap: 10 },
  centerMsgText: { color: `${PINE}50`, fontSize: 13 },
  emptyState: { alignItems: "center", paddingTop: 24, paddingBottom: 8 },
  emptyAvatar: {
    width: 64, height: 64, borderRadius: 32, backgroundColor: PINE,
    alignItems: "center", justifyContent: "center", marginBottom: 12,
    shadowColor: PINE, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  emptyTitle: { color: PINE, fontSize: 22, fontWeight: "700", marginBottom: 4 },
  emptySub: { color: `${PINE}80`, fontSize: 14, marginBottom: 4 },
  emptyHint: { color: `${PINE}50`, fontSize: 12, marginBottom: 20 },
  tabRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  tab: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    backgroundColor: "#fff", borderWidth: 1, borderColor: `${PINE}25`,
  },
  tabActive: { backgroundColor: PINE, borderColor: PINE },
  tabText: { fontSize: 11, fontWeight: "600", color: `${PINE}60` },
  tabTextActive: { color: "#fff" },
  promptList: { width: "100%", gap: 6 },
  promptChip: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 11,
    backgroundColor: "#fff", borderRadius: 14,
    borderWidth: 1, borderColor: `${PINE}12`,
  },
  promptChipText: { flex: 1, fontSize: 13, color: `${PINE}70`, marginRight: 8 },
  msgRow: { flexDirection: "row", marginBottom: 12, alignItems: "flex-end" },
  msgRowUser: { justifyContent: "flex-end" },
  msgRowBot: { justifyContent: "flex-start" },
  botAvatar: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: PINE,
    alignItems: "center", justifyContent: "center", marginRight: 8, flexShrink: 0,
  },
  bubble: { maxWidth: "80%", borderRadius: 16, padding: 12 },
  bubbleUser: { backgroundColor: PINE, borderBottomRightRadius: 4 },
  bubbleBot: {
    backgroundColor: "#fff", borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: `${PINE}15`,
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4,
  },
  bubbleText: { fontSize: 13, color: `${PINE}85`, lineHeight: 18 },
  bubbleTextUser: { color: "#fff" },
  trekCards: { marginTop: 8, gap: 4 },
  trekCardChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: `${SAFFRON}10`, borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: `${SAFFRON}20`,
  },
  trekCardName: { fontSize: 11, fontWeight: "600", color: PINE, flex: 1 },
  trekCardDifficulty: { fontSize: 10, color: `${PINE}50`, textTransform: "capitalize" },
  loadingDots: { flexDirection: "row", gap: 4, padding: 4 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: SAFFRON },
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
    color: PINE,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: SAFFRON,
    alignItems: "center", justifyContent: "center",
  },
  sendBtnDisabled: { opacity: 0.4 },
});
