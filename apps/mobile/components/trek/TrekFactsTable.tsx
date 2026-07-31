import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import type { CMSPage } from "@/lib/mobileApi";

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function months(list?: number[] | null): string | null {
  if (!list || list.length === 0) return null;
  return list.map((m) => MONTHS[m] ?? "").filter(Boolean).join(", ");
}

function budget(min?: number | null, max?: number | null): string | null {
  if (min == null && max == null) return null;
  const fmt = (n: number) => `₹${n.toLocaleString("en-IN")}`;
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  return fmt((min ?? max) as number);
}

function yesNo(v?: boolean | null): string | null {
  if (v == null) return null;
  return v ? "Yes" : "No";
}

interface Fact {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}

/**
 * STEP-M30 N07 — full Master-CMS trek metadata table for the trek-detail page. Renders only the
 * fields that are actually populated (trek-data backfill + Master CMS). Nulls are hidden so no
 * empty rows appear.
 */
export function TrekFactsTable({ trek }: { trek: CMSPage }) {
  const { colors, isDark } = useTheme();

  const durationDays =
    trek.trek_duration_days_min != null && trek.trek_duration_days_max != null
      ? trek.trek_duration_days_min === trek.trek_duration_days_max
        ? `${trek.trek_duration_days_min} days`
        : `${trek.trek_duration_days_min}–${trek.trek_duration_days_max} days`
      : null;

  const raw: (Fact | null)[] = [
    { icon: "location-outline", label: "Region", value: (trek.trek_region ?? trek.trek_state) || "" },
    { icon: "time-outline", label: "Duration", value: (trek.trek_duration ?? durationDays) || "" },
    { icon: "fitness-outline", label: "Difficulty", value: trek.trek_difficulty || "" },
    trek.trek_max_altitude_ft != null
      ? { icon: "trending-up-outline", label: "Max altitude", value: `${trek.trek_max_altitude_ft.toLocaleString("en-IN")} ft` }
      : null,
    { icon: "partly-sunny-outline", label: "Best season", value: trek.trek_season || "" },
    { icon: "calendar-outline", label: "Best months", value: months(trek.trek_best_months) || "" },
    { icon: "close-circle-outline", label: "Avoid months", value: months(trek.trek_avoid_months) || "" },
    { icon: "people-outline", label: "Suitability", value: trek.trek_suitability || "" },
    { icon: "wallet-outline", label: "Est. budget", value: budget(trek.trek_budget_min, trek.trek_budget_max) || "" },
    { icon: "reader-outline", label: "Permit required", value: yesNo(trek.trek_permit_required) || "" },
    { icon: "information-circle-outline", label: "Permit notes", value: trek.trek_permit_notes || "" },
    { icon: "pulse-outline", label: "Crowd level", value: trek.trek_crowd_level ? cap(trek.trek_crowd_level) : "" },
    { icon: "pricetags-outline", label: "Themes", value: (trek.trek_themes ?? []).join(", ") },
    { icon: "leaf-outline", label: "Beginner-friendly", value: yesNo(trek.trek_beginner_friendly) || "" },
    { icon: "person-outline", label: "Solo-friendly", value: yesNo(trek.trek_solo_friendly) || "" },
    { icon: "home-outline", label: "Family-friendly", value: yesNo(trek.trek_family_friendly) || "" },
    { icon: "business-outline", label: "Operators available", value: yesNo(trek.trek_operator_available) || "" },
  ];

  const facts = raw.filter((f): f is Fact => !!f && f.value.trim().length > 0);
  if (facts.length === 0) return null;

  const divider = isDark ? "rgba(255,255,255,0.07)" : "rgba(29,58,46,0.08)";

  return (
    <View style={styles.wrap}>
      <Text style={[styles.heading, { color: colors.textPrimary }]}>Trek details</Text>
      <View style={[styles.card, { backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "rgba(29,58,46,0.03)", borderColor: colors.border }]}>
        {facts.map((f, i) => (
          <View
            key={f.label}
            style={[styles.row, i < facts.length - 1 && { borderBottomWidth: 1, borderBottomColor: divider }]}
          >
            <View style={styles.labelCol}>
              <Ionicons name={f.icon} size={15} color={colors.accent} />
              <Text style={[styles.label, { color: colors.textMuted }]}>{f.label}</Text>
            </View>
            <Text style={[styles.value, { color: colors.textPrimary }]} numberOfLines={2}>{f.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 16, marginTop: 20 },
  heading: { fontSize: 18, fontFamily: "PlayfairDisplay_700Bold", marginBottom: 12 },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  labelCol: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 0 },
  label: { fontSize: 13, fontWeight: "500" },
  value: { fontSize: 13, fontWeight: "600", flex: 1, textAlign: "right" },
});
