import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useState, useEffect, useRef } from "react";
import { useTheme } from "@/hooks/useTheme";
import { buddyApi } from "@/hooks/useBuddies";
import type { ChatMessageOut } from "@/hooks/useBuddies";

interface Props {
  visible: boolean;
  requestId: string | null;
  otherPartyName: string;
  onClose: () => void;
}

function fmt(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
}

export function BuddyChatScreen({ visible, requestId, otherPartyName, onClose }: Props) {
  const { colors } = useTheme();
  const [messages, setMessages] = useState<ChatMessageOut[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const flatRef = useRef<FlatList<ChatMessageOut>>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function load() {
    if (!requestId) return;
    try {
      const msgs = await buddyApi.getMessages(requestId);
      setMessages(msgs);
    } catch {
      // silently ignore polling failures
    }
  }

  useEffect(() => {
    if (!visible || !requestId) return;
    setLoading(true);
    load().finally(() => setLoading(false));
    pollRef.current = setInterval(load, 10_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, requestId]);

  useEffect(() => {
    if (messages.length > 0) {
      flatRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  async function handleSend() {
    const content = input.trim();
    if (!content || !requestId) return;
    setSending(true);
    try {
      const msg = await buddyApi.sendMessage(requestId, content);
      setInput("");
      setMessages((prev) => [...prev, msg]);
    } finally {
      setSending(false);
    }
  }

  function renderMessage({ item }: { item: ChatMessageOut }) {
    return (
      <View style={[styles.msgRow, item.is_mine ? styles.msgMine : styles.msgTheirs]}>
        <View
          style={[
            styles.bubble,
            item.is_mine
              ? { backgroundColor: colors.accent }
              : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: StyleSheet.hairlineWidth },
          ]}
        >
          <Text style={[styles.bubbleText, { color: item.is_mine ? "#fff" : colors.textPrimary }]}>
            {item.content}
          </Text>
          <Text style={[styles.bubbleTime, { color: item.is_mine ? "rgba(255,255,255,0.6)" : colors.textFaint }]}>
            {fmt(item.created_at)}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }} keyboardVerticalOffset={0}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close chat">
              <Text style={[styles.back, { color: colors.accent }]}>← Back</Text>
            </TouchableOpacity>
            <View style={styles.headerCenter}>
              <View style={[styles.onlineDot, { backgroundColor: "#22c55e" }]} />
              <Text style={[styles.headerName, { color: colors.textPrimary }]}>{otherPartyName}</Text>
            </View>
            <View style={{ width: 60 }} />
          </View>

          {/* Messages */}
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.accent} />
            </View>
          ) : (
            <FlatList
              ref={flatRef}
              data={messages}
              keyExtractor={(m) => m.id}
              renderItem={renderMessage}
              contentContainerStyle={styles.msgList}
              ListEmptyComponent={
                <View style={styles.center}>
                  <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                    You&apos;re connected! Say hello 👋
                  </Text>
                </View>
              }
              onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
            />
          )}

          {/* Composer */}
          <View style={[styles.composer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
            <TextInput
              value={input}
              onChangeText={setInput}
              maxLength={2000}
              multiline
              placeholder="Type a message…"
              placeholderTextColor={colors.textFaint}
              style={[styles.composerInput, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
              accessibilityLabel="Chat message"
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={sending || !input.trim()}
              style={[styles.sendBtn, { backgroundColor: colors.accent, opacity: sending || !input.trim() ? 0.4 : 1 }]}
              accessibilityLabel="Send message"
            >
              {sending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.sendIcon}>↑</Text>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  back: { fontSize: 15, fontWeight: "500", width: 60 },
  headerCenter: { flexDirection: "row", alignItems: "center", gap: 6 },
  onlineDot: { width: 8, height: 8, borderRadius: 4 },
  headerName: { fontSize: 15, fontWeight: "600" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  emptyText: { fontSize: 14, textAlign: "center" },
  msgList: { padding: 14, gap: 8, flexGrow: 1 },
  msgRow: { flexDirection: "row", marginVertical: 2 },
  msgMine: { justifyContent: "flex-end" },
  msgTheirs: { justifyContent: "flex-start" },
  bubble: { maxWidth: "75%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleText: { fontSize: 14, lineHeight: 20 },
  bubbleTime: { fontSize: 10, marginTop: 3, textAlign: "right" },
  composer: {
    flexDirection: "row", alignItems: "flex-end", gap: 8,
    paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth,
  },
  composerInput: {
    flex: 1, borderWidth: 1, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    fontSize: 14, maxHeight: 100,
  },
  sendBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  sendIcon: { color: "#fff", fontSize: 18, fontWeight: "700", lineHeight: 20 },
});
