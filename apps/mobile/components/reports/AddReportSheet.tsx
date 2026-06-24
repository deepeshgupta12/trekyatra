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
import { PhotoPicker } from "./PhotoPicker";
import type { ReportIn } from "@/hooks/useReports";

type Condition = "open" | "caution" | "closed" | "unknown";

interface UploadedPhoto {
  localUri: string;
  mediaId: string;
  cdnUrl: string;
}

interface Props {
  visible: boolean;
  trekSlug: string;
  onClose: () => void;
  onSubmit: (input: ReportIn) => Promise<void>;
  onUploadPhoto: (localUri: string, mimeType: string) => Promise<{ id: string; url: string }>;
}

const CONDITIONS: { key: Condition; label: string; color: string }[] = [
  { key: "open", label: "Open", color: "#22c55e" },
  { key: "caution", label: "Caution", color: "#f59e0b" },
  { key: "closed", label: "Closed", color: "#ef4444" },
  { key: "unknown", label: "Unknown", color: "#6b7280" },
];

function todayStr() {
  return new Date().toISOString().split("T")[0];
}

export function AddReportSheet({ visible, trekSlug, onClose, onSubmit, onUploadPhoto }: Props) {
  const { colors, isDark } = useTheme();
  const [condition, setCondition] = useState<Condition>("open");
  const [trekDate, setTrekDate] = useState(todayStr());
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<UploadedPhoto[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAddPhoto(localUri: string, mimeType: string) {
    setUploading(true);
    try {
      const result = await onUploadPhoto(localUri, mimeType);
      setPhotos((prev) => [
        ...prev,
        { localUri, mediaId: result.id, cdnUrl: result.url },
      ]);
    } catch (e) {
      setError("Photo upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  function removePhoto(mediaId: string) {
    setPhotos((prev) => prev.filter((p) => p.mediaId !== mediaId));
  }

  async function handleSubmit() {
    if (body.trim().length < 20) {
      setError("Please write at least 20 characters.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        trek_slug: trekSlug,
        condition,
        trek_date: trekDate,
        title: title.trim() || undefined,
        body: body.trim(),
        media_ids: photos.map((p) => p.mediaId),
      });
      // Reset form
      setCondition("open");
      setTrekDate(todayStr());
      setTitle("");
      setBody("");
      setPhotos([]);
    } catch (e) {
      setError("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setError(null);
    onClose();
  }

  const inputBg = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)";
  const borderColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)";
  const textColor = colors.textPrimary;
  const placeholderColor = isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)";

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.kav}
        >
          <View
            style={[
              styles.sheet,
              {
                backgroundColor: isDark ? "#1a1c26" : "#ffffff",
                borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
              },
            ]}
          >
            {/* Handle */}
            <View style={styles.handleWrap}>
              <View
                style={[
                  styles.handle,
                  { backgroundColor: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)" },
                ]}
              />
            </View>

            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.headerTitle, { color: textColor }]}>Add Trail Report</Text>
              <TouchableOpacity onPress={handleClose} accessibilityRole="button" accessibilityLabel="Close">
                <Text style={[styles.cancel, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
              {/* Trail date */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Trek date</Text>
              <TextInput
                value={trekDate}
                onChangeText={setTrekDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={placeholderColor}
                style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
                keyboardType="numeric"
                maxLength={10}
                accessibilityLabel="Trek date"
              />

              {/* Condition */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Trail condition</Text>
              <View style={styles.condRow}>
                {CONDITIONS.map((c) => {
                  const active = condition === c.key;
                  return (
                    <TouchableOpacity
                      key={c.key}
                      onPress={() => setCondition(c.key)}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: active }}
                      style={[
                        styles.condBtn,
                        {
                          backgroundColor: active ? c.color + "22" : inputBg,
                          borderColor: active ? c.color + "88" : borderColor,
                        },
                      ]}
                    >
                      <View style={[styles.condDot, { backgroundColor: c.color }]} />
                      <Text
                        style={[
                          styles.condLabel,
                          { color: active ? c.color : colors.textMuted, fontWeight: active ? "700" : "400" },
                        ]}
                      >
                        {c.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Title (optional) */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Title (optional)</Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="e.g. Great conditions, summit clear"
                placeholderTextColor={placeholderColor}
                style={[styles.input, { backgroundColor: inputBg, borderColor, color: textColor }]}
                maxLength={100}
                accessibilityLabel="Report title"
              />

              {/* Body */}
              <View style={styles.labelRow}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Your report *</Text>
                <Text style={[styles.charCount, { color: colors.textMuted }]}>{body.length}/2000</Text>
              </View>
              <TextInput
                value={body}
                onChangeText={(t) => setBody(t.slice(0, 2000))}
                placeholder="Describe the trail conditions, difficulty, what to watch out for…"
                placeholderTextColor={placeholderColor}
                style={[styles.textarea, { backgroundColor: inputBg, borderColor, color: textColor }]}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                accessibilityLabel="Report body"
              />

              {/* Photos */}
              <Text style={[styles.label, { color: colors.textSecondary }]}>Photos (optional)</Text>
              <PhotoPicker
                photos={photos}
                onAdd={handleAddPhoto}
                onRemove={removePhoto}
                uploading={uploading}
                maxPhotos={3}
              />

              {error && (
                <Text style={styles.errorText}>{error}</Text>
              )}

              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  { opacity: submitting || uploading ? 0.6 : 1 },
                ]}
                onPress={handleSubmit}
                disabled={submitting || uploading}
                accessibilityRole="button"
                accessibilityLabel="Submit report"
              >
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitText}>Submit Report</Text>
                )}
              </TouchableOpacity>

              <SafeAreaView />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  kav: { flex: 1, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    maxHeight: "92%",
  },
  handleWrap: { alignItems: "center", paddingTop: 10, paddingBottom: 4 },
  handle: { width: 36, height: 4, borderRadius: 2 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  cancel: { fontSize: 14 },
  scroll: { paddingHorizontal: 18, paddingTop: 16 },
  label: { fontSize: 12, fontWeight: "600", marginBottom: 6, marginTop: 14 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6, marginTop: 14 },
  charCount: { fontSize: 11 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textarea: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    minHeight: 110,
  },
  condRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  condBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  condDot: { width: 7, height: 7, borderRadius: 3.5 },
  condLabel: { fontSize: 13 },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
    marginTop: 12,
  },
  submitBtn: {
    backgroundColor: "#E8702A",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 20,
    marginBottom: 8,
  },
  submitText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
