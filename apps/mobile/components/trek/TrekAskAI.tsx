import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { trekIntelligenceApi } from "@/lib/mobileApi";

interface Props {
  slug: string;
  trekName: string;
}

const SUGGESTED_PROMPTS = [
  "Is this trek beginner-friendly?",
  "What's the best month to do this trek?",
  "Do I need a permit for this trek?",
  "What should I pack for this trek?",
];

interface QAExchange {
  question: string;
  answer: string;
  notVerified: boolean;
}

export function TrekAskAI({ slug, trekName }: Props) {
  const { colors, isDark } = useTheme();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exchanges, setExchanges] = useState<QAExchange[]>([]);

  async function ask(q: string) {
    const trimmed = q.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await trekIntelligenceApi.ask(slug, trimmed);
      setExchanges((prev) => [...prev, { question: trimmed, answer: res.answer, notVerified: res.not_verified }]);
      setQuestion("");
    } catch {
      setError("Couldn't get an answer right now. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  const placeholderColor = isDark ? "rgba(255,255,255,0.35)" : "rgba(29,58,46,0.35)";

  return (
    <GlassSurface rounded="lg" style={styles.card}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Ask TrekSage about {trekName}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Get instant answers grounded in verified trek data — beginner-friendliness, best months, permits, packing, and more.
        </Text>

        {exchanges.map((ex, i) => (
          <View key={i} style={styles.exchange}>
            <Text style={[styles.question, { color: colors.textPrimary }]}>{ex.question}</Text>
            <View
              style={[
                styles.answerBox,
                ex.notVerified
                  ? { backgroundColor: "rgba(245,158,11,0.10)", borderColor: "rgba(245,158,11,0.3)", borderWidth: 1 }
                  : { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(29,58,46,0.05)" },
              ]}
            >
              {ex.notVerified && <Text style={styles.notVerifiedLabel}>NOT VERIFIED YET</Text>}
              <Text style={[styles.answer, { color: colors.textSecondary }]}>{ex.answer}</Text>
            </View>
          </View>
        ))}

        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.promptRow}>
          {SUGGESTED_PROMPTS.map((prompt) => (
            <TouchableOpacity
              key={prompt}
              disabled={loading}
              onPress={() => ask(prompt)}
              style={[
                styles.promptChip,
                { borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(29,58,46,0.15)", opacity: loading ? 0.5 : 1 },
              ]}
            >
              <Text style={[styles.promptText, { color: colors.textSecondary }]}>{prompt}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.inputRow}>
          <TextInput
            value={question}
            onChangeText={setQuestion}
            placeholder="Ask a question…"
            placeholderTextColor={placeholderColor}
            style={[
              styles.input,
              {
                color: colors.textPrimary,
                borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(29,58,46,0.15)",
              },
            ]}
            onSubmitEditing={() => ask(question)}
            editable={!loading}
          />
          <TouchableOpacity
            style={[styles.sendBtn, { opacity: loading || !question.trim() ? 0.5 : 1 }]}
            onPress={() => ask(question)}
            disabled={loading || !question.trim()}
          >
            {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.sendText}>Ask</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </GlassSurface>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 16, marginBottom: 16 },
  content: { padding: 16, gap: 10 },
  title: { fontSize: 15, fontWeight: "700" },
  subtitle: { fontSize: 12, lineHeight: 17 },
  exchange: { gap: 6, marginTop: 4 },
  question: { fontSize: 13, fontWeight: "700" },
  answerBox: { borderRadius: 10, padding: 10 },
  answer: { fontSize: 13, lineHeight: 18 },
  notVerifiedLabel: { color: "#F59E0B", fontSize: 10, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  error: { color: "#ef4444", fontSize: 12 },
  promptRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 4 },
  promptChip: { borderRadius: 16, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  promptText: { fontSize: 11, fontWeight: "500" },
  inputRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  input: { flex: 1, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 13 },
  sendBtn: {
    backgroundColor: "#E8702A",
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  sendText: { color: "#fff", fontSize: 13, fontWeight: "700" },
});
