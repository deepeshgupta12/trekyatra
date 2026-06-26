import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { useConditions } from "@/hooks/useConditions";
import type { ForecastDayOut } from "@/hooks/useConditions";

interface Props {
  slug: string;
  trekName: string;
  onClose: () => void;
}

// ── WMO emoji ─────────────────────────────────────────────────────────────────
function weatherEmoji(code: number | null): string {
  if (code === null || code === undefined) return "🌤";
  if (code === 0 || code === 1) return "☀️";
  if (code === 2) return "⛅";
  if (code === 3) return "☁️";
  if (code === 45 || code === 48) return "🌫";
  if (code >= 51 && code <= 67) return "🌧";
  if (code >= 71 && code <= 86) return "❄️";
  if (code >= 80 && code <= 82) return "🌦";
  if (code >= 95) return "⛈";
  return "🌤";
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function dayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return DAYS[d.getUTCDay()] ?? dateStr.slice(5);
}

const TRAIL_CONFIG: Record<string, { color: string; bg: string; label: string; desc: string }> = {
  open: { color: "#16a34a", bg: "rgba(22,163,74,0.12)", label: "Open", desc: "Trail is currently open and accessible." },
  caution: { color: "#d97706", bg: "rgba(217,119,6,0.12)", label: "Caution", desc: "Proceed with caution — check recent reports before you go." },
  closed: { color: "#dc2626", bg: "rgba(220,38,38,0.12)", label: "Closed / Unsafe", desc: "Trail is currently closed or flagged as unsafe." },
};

const PERMIT_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  not_required: { color: "#6b7280", bg: "rgba(107,114,128,0.10)", label: "No Permit Required" },
  required: { color: "#d97706", bg: "rgba(217,119,6,0.12)", label: "Permit Required" },
  check_locally: { color: "#2563eb", bg: "rgba(37,99,235,0.12)", label: "Check Locally for Permits" },
};

function ForecastCard({ day, isDark }: { day: ForecastDayOut; isDark: boolean }) {
  return (
    <View
      style={[
        styles.forecastCard,
        {
          backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
          borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)",
        },
      ]}
      accessibilityLabel={`${dayLabel(day.date)} forecast: ${day.label}, high ${day.temp_max_c !== null ? Math.round(day.temp_max_c) : "—"}°C, low ${day.temp_min_c !== null ? Math.round(day.temp_min_c) : "—"}°C`}
    >
      <Text style={styles.forecastDay}>{dayLabel(day.date)}</Text>
      <Text style={styles.forecastEmoji}>{weatherEmoji(day.wmo_code)}</Text>
      <Text style={[styles.forecastLabel, { color: isDark ? "#d1d5db" : "#374151" }]}>{day.label}</Text>
      <View style={styles.forecastTemps}>
        {day.temp_max_c !== null && (
          <Text style={[styles.forecastTempMax, { color: isDark ? "#f9fafb" : "#111827" }]}>
            {Math.round(day.temp_max_c)}°
          </Text>
        )}
        {day.temp_min_c !== null && (
          <Text style={styles.forecastTempMin}>{Math.round(day.temp_min_c)}°</Text>
        )}
      </View>
    </View>
  );
}

export function LiveConditionsScreen({ slug, trekName, onClose }: Props) {
  const { colors, isDark } = useTheme();
  const { data, loading, fromCache, reload } = useConditions(slug);

  const trail = TRAIL_CONFIG[data?.trail_status ?? "open"] ?? TRAIL_CONFIG.open;
  const permit = PERMIT_CONFIG[data?.permit_status ?? "not_required"] ?? PERMIT_CONFIG.not_required;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)" }]}>
        <TouchableOpacity
          onPress={onClose}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Close conditions panel"
        >
          <Text style={{ color: "#E8702A", fontSize: 15, fontWeight: "600" }}>✕ Close</Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {trekName}
        </Text>
        <Text style={[styles.headerSub, { color: colors.textMuted }]}>Live Conditions</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#E8702A" size="large" />
        </View>
      ) : !data ? (
        <View style={styles.center}>
          <Text style={{ color: colors.textMuted, fontSize: 14 }}>
            No conditions data available for this trek yet.
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={reload} tintColor="#E8702A" />
          }
        >
          {fromCache && (
            <View style={[styles.offlineBadge, { backgroundColor: isDark ? "rgba(250,204,21,0.12)" : "rgba(250,204,21,0.15)" }]}>
              <Text style={{ color: "#ca8a04", fontSize: 12, fontWeight: "600" }}>
                Offline — showing cached data
              </Text>
            </View>
          )}

          {/* Current weather card */}
          {data.weather && (
            <View
              style={[
                styles.card,
                { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#fff", borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)" },
              ]}
            >
              <Text style={[styles.cardLabel, { color: colors.textMuted }]}>CURRENT WEATHER</Text>
              <View style={styles.currentWeatherRow}>
                <Text style={styles.bigEmoji}>{weatherEmoji(data.weather.wmo_code)}</Text>
                <View>
                  {data.weather.temp_c !== null && (
                    <Text style={[styles.bigTemp, { color: colors.textPrimary }]}>
                      {Math.round(data.weather.temp_c)}°C
                    </Text>
                  )}
                  <Text style={[styles.weatherLabel, { color: colors.textSecondary }]}>
                    {data.weather.label}
                  </Text>
                </View>
              </View>
              <View style={styles.weatherDetailsRow}>
                {data.weather.feels_like_c !== null && (
                  <View style={styles.weatherDetail}>
                    <Text style={styles.weatherDetailIcon}>🌡</Text>
                    <Text style={[styles.weatherDetailText, { color: colors.textSecondary }]}>
                      Feels {Math.round(data.weather.feels_like_c)}°C
                    </Text>
                  </View>
                )}
                {data.weather.humidity_pct !== null && (
                  <View style={styles.weatherDetail}>
                    <Text style={styles.weatherDetailIcon}>💧</Text>
                    <Text style={[styles.weatherDetailText, { color: colors.textSecondary }]}>
                      {data.weather.humidity_pct}%
                    </Text>
                  </View>
                )}
                {data.weather.wind_kph !== null && (
                  <View style={styles.weatherDetail}>
                    <Text style={styles.weatherDetailIcon}>💨</Text>
                    <Text style={[styles.weatherDetailText, { color: colors.textSecondary }]}>
                      {Math.round(data.weather.wind_kph)} km/h
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* 3-day forecast */}
          {data.forecast.length > 0 && (
            <View
              style={[
                styles.card,
                { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#fff", borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)" },
              ]}
            >
              <Text style={[styles.cardLabel, { color: colors.textMuted }]}>3-DAY FORECAST</Text>
              <View style={styles.forecastRow}>
                {data.forecast.map((day) => (
                  <ForecastCard key={day.date} day={day} isDark={isDark} />
                ))}
              </View>
            </View>
          )}

          {/* Trail status */}
          <View
            style={[
              styles.card,
              { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#fff", borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)" },
            ]}
          >
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>TRAIL STATUS</Text>
            <View style={[styles.statusBadge, { backgroundColor: trail.bg }]}>
              <Text style={[styles.statusBadgeText, { color: trail.color }]}>
                ⛰ {trail.label}
              </Text>
            </View>
            <Text style={[styles.statusDesc, { color: colors.textSecondary }]}>{trail.desc}</Text>
          </View>

          {/* Permit status */}
          <View
            style={[
              styles.card,
              { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#fff", borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)" },
            ]}
          >
            <Text style={[styles.cardLabel, { color: colors.textMuted }]}>PERMIT STATUS</Text>
            <View style={[styles.statusBadge, { backgroundColor: permit.bg }]}>
              <Text style={[styles.statusBadgeText, { color: permit.color }]}>
                📋 {permit.label}
              </Text>
            </View>
            {data.permit_notes && (
              <Text style={[styles.permitNotes, { color: colors.textSecondary }]}>
                {data.permit_notes}
              </Text>
            )}
          </View>

          {/* Summary */}
          {data.condition_summary && (
            <View
              style={[
                styles.card,
                { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#fff", borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)" },
              ]}
            >
              <Text style={[styles.cardLabel, { color: colors.textMuted }]}>SUMMARY</Text>
              <Text style={[styles.summaryText, { color: colors.textSecondary }]}>
                {data.condition_summary}
              </Text>
            </View>
          )}

          {/* Last updated */}
          {data.last_updated_at && (
            <Text style={[styles.updatedAt, { color: colors.textMuted }]}>
              Updated{" "}
              {new Date(data.last_updated_at).toLocaleString("en-IN", {
                dateStyle: "medium",
                timeStyle: "short",
              })}
            </Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    gap: 2,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "700",
    marginTop: 4,
  },
  headerSub: {
    fontSize: 12,
  },
  scroll: {
    padding: 16,
    gap: 12,
    paddingBottom: 40,
  },
  offlineBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 4,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  currentWeatherRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  bigEmoji: { fontSize: 40 },
  bigTemp: { fontSize: 36, fontWeight: "800", lineHeight: 40 },
  weatherLabel: { fontSize: 14, fontWeight: "600", marginTop: 2 },
  weatherDetailsRow: {
    flexDirection: "row",
    gap: 16,
    flexWrap: "wrap",
  },
  weatherDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  weatherDetailIcon: { fontSize: 13 },
  weatherDetailText: { fontSize: 13 },
  forecastRow: {
    flexDirection: "row",
    gap: 10,
    flexWrap: "wrap",
  },
  forecastCard: {
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 72,
    gap: 3,
  },
  forecastDay: {
    fontSize: 10,
    fontWeight: "700",
    color: "#9ca3af",
    textTransform: "uppercase",
  },
  forecastEmoji: { fontSize: 20, marginVertical: 2 },
  forecastLabel: { fontSize: 11, textAlign: "center" },
  forecastTemps: {
    flexDirection: "row",
    gap: 4,
    alignItems: "center",
  },
  forecastTempMax: { fontSize: 13, fontWeight: "700" },
  forecastTempMin: { fontSize: 11, color: "#9ca3af" },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: { fontSize: 13, fontWeight: "700" },
  statusDesc: { fontSize: 13, lineHeight: 20 },
  permitNotes: { fontSize: 13, lineHeight: 20 },
  summaryText: { fontSize: 14, lineHeight: 22 },
  updatedAt: {
    fontSize: 11,
    textAlign: "center",
    marginTop: 4,
    paddingBottom: 8,
  },
});
