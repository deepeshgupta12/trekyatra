import {
  Modal,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import type { SignalIn, SignalOut } from "@/hooks/useBuddies";

interface Props {
  visible: boolean;
  trekSlug: string;
  onClose: () => void;
  onSubmit: (data: SignalIn) => Promise<SignalOut>;
}

const EXPERIENCE = ["beginner", "intermediate", "expert"] as const;
type Experience = (typeof EXPERIENCE)[number];

function upcomingMonths(n = 8): { value: string; label: string }[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() + i);
    return {
      value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
    };
  });
}

const MONTHS = upcomingMonths();

export function BuddySignalSheet({ visible, trekSlug, onClose, onSubmit }: Props) {
  const { colors } = useTheme();
  const [monthYear, setMonthYear] = useState(MONTHS[0].value);
  const [groupSize, setGroupSize] = useState(1);
  const [experience, setExperience] = useState<Experience | null>(null);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        trek_slug: trekSlug,
        month_year: monthYear,
        group_size: groupSize,
        experience: experience ?? undefined,
        notes: notes.trim() || undefined,
      });
      setNotes("");
      setExperience(null);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to post signal");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
              <Text style={[styles.cancel, { color: colors.textMuted }]}>Cancel</Text>
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.textPrimary }]}>I'm planning this trek</Text>
            <TouchableOpacity onPress={handleSubmit} disabled={submitting} accessibilityLabel="Post signal">
              {submitting ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <Text style={[styles.post, { color: colors.accent }]}>Post</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
            {/* Month */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Planning month</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
              {MONTHS.map((m) => (
                <TouchableOpacity
                  key={m.value}
                  onPress={() => setMonthYear(m.value)}
                  style={[
                    styles.chip,
                    { borderColor: m.value === monthYear ? colors.accent : colors.border },
                    m.value === monthYear && { backgroundColor: colors.accent + "18" },
                  ]}
                >
                  <Text style={[styles.chipText, { color: m.value === monthYear ? colors.accent : colors.textMuted }]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Group size */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Group size</Text>
            <View style={styles.chipRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity
                  key={n}
                  onPress={() => setGroupSize(n)}
                  style={[
                    styles.chip,
                    { borderColor: n === groupSize ? colors.accent : colors.border },
                    n === groupSize && { backgroundColor: colors.accent + "18" },
                  ]}
                >
                  <Text style={[styles.chipText, { color: n === groupSize ? colors.accent : colors.textMuted }]}>
                    {n === 1 ? "Solo" : `Group ${n}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Experience */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Experience level (optional)</Text>
            <View style={styles.chipRow}>
              {EXPERIENCE.map((lvl) => (
                <TouchableOpacity
                  key={lvl}
                  onPress={() => setExperience(experience === lvl ? null : lvl)}
                  style={[
                    styles.chip,
                    { borderColor: lvl === experience ? colors.accent : colors.border },
                    lvl === experience && { backgroundColor: colors.accent + "18" },
                  ]}
                >
                  <Text style={[styles.chipText, { color: lvl === experience ? colors.accent : colors.textMuted, textTransform: "capitalize" }]}>
                    {lvl}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Notes */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Brief note (optional)</Text>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              maxLength={500}
              multiline
              numberOfLines={3}
              placeholder="Anything you want others to know…"
              placeholderTextColor={colors.textFaint}
              style={[styles.textarea, { borderColor: colors.border, color: colors.textPrimary, backgroundColor: colors.surface }]}
              accessibilityLabel="Notes"
            />
            <Text style={[styles.charCount, { color: colors.textFaint }]}>{notes.length}/500</Text>

            {error && <Text style={styles.error}>{error}</Text>}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  cancel: { fontSize: 15 },
  title: { fontSize: 16, fontWeight: "600" },
  post: { fontSize: 15, fontWeight: "700" },
  body: { padding: 16, gap: 8 },
  label: { fontSize: 13, fontWeight: "500", marginTop: 12, marginBottom: 6 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1,
  },
  chipText: { fontSize: 13, fontWeight: "500" },
  textarea: {
    borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 14,
    minHeight: 80, textAlignVertical: "top",
  },
  charCount: { fontSize: 11, textAlign: "right", marginTop: 2 },
  error: { color: "#ef4444", fontSize: 13, marginTop: 8 },
});
