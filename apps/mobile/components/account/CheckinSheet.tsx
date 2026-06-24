import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { useCheckin, type CheckinIn } from "@/hooks/useCheckin";
import { useAnalytics } from "@/hooks/useAnalytics";

interface CheckinSheetProps {
  visible: boolean;
  trekSlug: string;
  trekTitle?: string;
  trekState?: string;
  onClose: () => void;
  onSuccess: () => void;
}

function today(): string {
  return new Date().toISOString().split("T")[0];
}

export function CheckinSheet({
  visible,
  trekSlug,
  trekTitle,
  trekState,
  onClose,
  onSuccess,
}: CheckinSheetProps) {
  const { colors } = useTheme();
  const { createCheckin, loading } = useCheckin();
  const { trackCheckin } = useAnalytics();

  const [completionDate, setCompletionDate] = useState(today());
  const [durationDays, setDurationDays] = useState("");
  const [rating, setRating] = useState(0);
  const [notes, setNotes] = useState("");
  const [done, setDone] = useState(false);

  function reset() {
    setCompletionDate(today());
    setDurationDays("");
    setRating(0);
    setNotes("");
    setDone(false);
  }

  async function handleSubmit() {
    const payload: CheckinIn = {
      trek_slug: trekSlug,
      trek_title: trekTitle,
      completion_date: completionDate,
      duration_days: durationDays ? parseInt(durationDays, 10) : undefined,
      rating: rating || undefined,
      notes: notes.trim() || undefined,
      trek_state: trekState,
    };
    const result = await createCheckin(payload);
    if (result) {
      trackCheckin(trekSlug, completionDate).catch(() => {});
      setDone(true);
      setTimeout(() => {
        reset();
        onSuccess();
      }, 1200);
    }
  }

  function handleClose() {
    reset();
    onClose();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Log this trek</Text>
            <TouchableOpacity onPress={handleClose} accessibilityLabel="Close">
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          {done ? (
            <View style={styles.successBlock}>
              <Ionicons name="checkmark-circle" size={48} color={colors.accent} />
              <Text style={[styles.successText, { color: colors.textPrimary }]}>Trek logged!</Text>
            </View>
          ) : (
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              {/* Trek name */}
              <Text style={[styles.trekName, { color: colors.textPrimary }]}>
                {trekTitle ?? trekSlug}
              </Text>

              {/* Completion date */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Completion date</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.textPrimary, borderColor: colors.border }]}
                value={completionDate}
                onChangeText={setCompletionDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={colors.textMuted}
                keyboardType="numbers-and-punctuation"
              />

              {/* Duration */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Duration (days)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surfaceAlt, color: colors.textPrimary, borderColor: colors.border }]}
                value={durationDays}
                onChangeText={setDurationDays}
                placeholder="e.g. 5"
                placeholderTextColor={colors.textMuted}
                keyboardType="number-pad"
              />

              {/* Star rating */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Your rating</Text>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity
                    key={n}
                    onPress={() => setRating(n === rating ? 0 : n)}
                    accessibilityLabel={`${n} star`}
                  >
                    <Ionicons
                      name={n <= rating ? "star" : "star-outline"}
                      size={28}
                      color={n <= rating ? colors.accent : colors.textMuted}
                    />
                  </TouchableOpacity>
                ))}
              </View>

              {/* Notes */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.notesInput, { backgroundColor: colors.surfaceAlt, color: colors.textPrimary, borderColor: colors.border }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="How was it? Any tips?"
                placeholderTextColor={colors.textMuted}
                multiline
                textAlignVertical="top"
              />

              {/* Submit */}
              <TouchableOpacity
                style={[styles.submitBtn, { backgroundColor: colors.accent }, loading && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={loading}
                accessibilityRole="button"
                accessibilityLabel="Save check-in"
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>Save check-in</Text>
                )}
              </TouchableOpacity>

              <View style={{ height: 24 }} />
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingBottom: 40,
    maxHeight: "85%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
  },
  trekName: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: "500",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  notesInput: {
    height: 80,
    paddingTop: 10,
  },
  stars: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 4,
  },
  submitBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  successBlock: {
    alignItems: "center",
    paddingVertical: 40,
    gap: 12,
  },
  successText: {
    fontSize: 18,
    fontWeight: "700",
  },
});
