import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { PhotoGallery } from "./PhotoGallery";
import type { ReportOut } from "@/hooks/useReports";

interface Props {
  report: ReportOut;
}

const CONDITION_COLORS: Record<string, string> = {
  open: "#22c55e",
  caution: "#f59e0b",
  closed: "#ef4444",
  unknown: "#6b7280",
};

export function TripReportCard({ report }: Props) {
  const { colors, isDark } = useTheme();
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  const condColor = CONDITION_COLORS[report.condition] ?? CONDITION_COLORS.unknown;
  const textPrimary = colors.textPrimary;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
          borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
        },
      ]}
    >
      {/* Header row */}
      <View style={styles.header}>
        <View style={[styles.condBadge, { backgroundColor: condColor + "22", borderColor: condColor + "44" }]}>
          <View style={[styles.condDot, { backgroundColor: condColor }]} />
          <Text style={[styles.condText, { color: condColor }]}>
            {report.condition.charAt(0).toUpperCase() + report.condition.slice(1)}
          </Text>
        </View>
        <Text style={[styles.date, { color: colors.textMuted }]}>
          {new Date(report.trek_date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </Text>
      </View>

      {/* Title + body */}
      {report.title ? (
        <Text style={[styles.title, { color: textPrimary }]} numberOfLines={2}>
          {report.title}
        </Text>
      ) : null}
      <Text style={[styles.body, { color: colors.textSecondary }]} numberOfLines={4}>
        {report.body}
      </Text>

      {/* Photos */}
      {report.media.length > 0 && (
        <View style={styles.photos}>
          {report.media.map((m, idx) => (
            <TouchableOpacity key={m.id} onPress={() => setGalleryIndex(idx)} accessibilityRole="button" accessibilityLabel="View photo">
              <Image
                source={{ uri: m.url }}
                style={styles.thumb}
                contentFit="cover"
                transition={150}
              />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {galleryIndex !== null && (
        <PhotoGallery
          photos={report.media}
          initialIndex={galleryIndex}
          visible
          onClose={() => setGalleryIndex(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  condBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  condDot: { width: 6, height: 6, borderRadius: 3 },
  condText: { fontSize: 12, fontWeight: "600" },
  date: { fontSize: 12 },
  title: { fontSize: 14, fontWeight: "700", marginBottom: 4 },
  body: { fontSize: 13, lineHeight: 19 },
  photos: { flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" },
  thumb: { width: 60, height: 60, borderRadius: 8 },
});
