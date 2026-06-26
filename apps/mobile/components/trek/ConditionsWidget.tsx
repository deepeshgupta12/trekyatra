import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { useConditions } from "@/hooks/useConditions";
import type { ForecastDayOut, WeatherOut } from "@/hooks/useConditions";

interface Props {
  slug: string;
  onViewDetails: () => void;
}

// ── Trail status colours ──────────────────────────────────────────────────────
const TRAIL_COLOR: Record<string, { text: string; bg: string; label: string }> = {
  open: { text: "#16a34a", bg: "rgba(22,163,74,0.12)", label: "Open" },
  caution: { text: "#d97706", bg: "rgba(217,119,6,0.12)", label: "Caution" },
  closed: { text: "#dc2626", bg: "rgba(220,38,38,0.12)", label: "Closed" },
};

const PERMIT_COLOR: Record<string, { text: string; bg: string; label: string }> = {
  not_required: { text: "#6b7280", bg: "rgba(107,114,128,0.10)", label: "No Permit" },
  required: { text: "#d97706", bg: "rgba(217,119,6,0.12)", label: "Permit Required" },
  check_locally: { text: "#2563eb", bg: "rgba(37,99,235,0.12)", label: "Check Locally" },
};

// ── WMO emoji mapping ─────────────────────────────────────────────────────────
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

// ── 3-day label ───────────────────────────────────────────────────────────────
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
function dayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return DAYS[d.getUTCDay()] ?? dateStr.slice(5);
}

// ── Forecast card ─────────────────────────────────────────────────────────────
function ForecastCard({ day, isDark }: { day: ForecastDayOut; isDark: boolean }) {
  return (
    <View
      style={[
        styles.forecastCard,
        {
          backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
          borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
        },
      ]}
      accessibilityLabel={`${dayLabel(day.date)} forecast: ${day.label}, high ${day.temp_max_c !== null ? Math.round(day.temp_max_c) : "—"}°C, low ${day.temp_min_c !== null ? Math.round(day.temp_min_c) : "—"}°C`}
    >
      <Text style={styles.forecastDay}>{dayLabel(day.date)}</Text>
      <Text style={styles.forecastEmoji}>{weatherEmoji(day.wmo_code)}</Text>
      <View style={styles.forecastTemps}>
        {day.temp_max_c !== null && (
          <Text style={[styles.forecastTempMax, { color: isDark ? "#e5e7eb" : "#111827" }]}>
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

// ── Main widget ───────────────────────────────────────────────────────────────
export function ConditionsWidget({ slug, onViewDetails }: Props) {
  const { colors, isDark } = useTheme();
  const { data, loading } = useConditions(slug);

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)", borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)" }]}>
        <ActivityIndicator color="#E8702A" size="small" style={{ margin: 16 }} />
      </View>
    );
  }

  if (!data) return null;

  const trail = TRAIL_COLOR[data.trail_status] ?? TRAIL_COLOR.open;
  const permit = PERMIT_COLOR[data.permit_status] ?? PERMIT_COLOR.not_required;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
          borderColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>🌤 Live Conditions</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>Real-time weather &amp; trail status</Text>
        </View>
        <TouchableOpacity
          onPress={onViewDetails}
          accessibilityRole="button"
          accessibilityLabel="View full conditions detail"
        >
          <Text style={{ color: "#E8702A", fontSize: 13, fontWeight: "600" }}>Details →</Text>
        </TouchableOpacity>
      </View>

      {/* Current weather row */}
      {data.weather && (
        <View style={styles.weatherRow}>
          <Text style={styles.weatherEmoji}>{weatherEmoji(data.weather.wmo_code)}</Text>
          {data.weather.temp_c !== null && (
            <Text style={[styles.tempText, { color: colors.textPrimary }]}>
              {Math.round(data.weather.temp_c)}°C
            </Text>
          )}
          <View style={styles.weatherMeta}>
            <Text style={[styles.weatherLabel, { color: colors.textSecondary }]}>{data.weather.label}</Text>
            {data.weather.humidity_pct !== null && (
              <Text style={[styles.weatherDetail, { color: colors.textMuted }]}>
                💧 {data.weather.humidity_pct}%  💨 {data.weather.wind_kph !== null ? `${Math.round(data.weather.wind_kph)} km/h` : "—"}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* 3-day forecast */}
      {data.forecast.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.forecastRow}
        >
          {data.forecast.map((day) => (
            <ForecastCard key={day.date} day={day} isDark={isDark} />
          ))}
        </ScrollView>
      )}

      {/* Status badges */}
      <View style={styles.badgesRow}>
        <View style={[styles.badge, { backgroundColor: trail.bg }]}>
          <Text style={[styles.badgeText, { color: trail.text }]}>⛰ {trail.label}</Text>
        </View>
        <View style={[styles.badge, { backgroundColor: permit.bg }]}>
          <Text style={[styles.badgeText, { color: permit.text }]}>📋 {permit.label}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  weatherRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  weatherEmoji: {
    fontSize: 28,
  },
  tempText: {
    fontSize: 26,
    fontWeight: "700",
  },
  weatherMeta: {
    flexDirection: "column",
    gap: 2,
  },
  weatherLabel: {
    fontSize: 13,
    fontWeight: "600",
  },
  weatherDetail: {
    fontSize: 11,
  },
  forecastRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
    flexDirection: "row",
  },
  forecastCard: {
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    minWidth: 60,
    gap: 2,
  },
  forecastDay: {
    fontSize: 10,
    fontWeight: "600",
    color: "#9ca3af",
    textTransform: "uppercase",
  },
  forecastEmoji: {
    fontSize: 16,
    marginVertical: 2,
  },
  forecastTemps: {
    flexDirection: "row",
    gap: 3,
    alignItems: "center",
  },
  forecastTempMax: {
    fontSize: 12,
    fontWeight: "700",
  },
  forecastTempMin: {
    fontSize: 11,
    color: "#9ca3af",
  },
  badgesRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexWrap: "wrap",
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
