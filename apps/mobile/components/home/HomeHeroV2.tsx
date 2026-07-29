import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { AISearchBar } from "@/components/home/AISearchBar";
import { QuickFilterChips, type QuickFilterChip } from "@/components/home/QuickFilterChips";

interface HomeHeroV2Props {
  firstName: string;
  /** Optional location context (e.g. top region) — hidden when omitted. */
  locationLabel?: string | null;
  onSearchPress: () => void;
  onVoicePress?: () => void;
  onNotificationsPress: () => void;
  onMapPress: () => void;
  filterChips: QuickFilterChip[];
  onFilterPress: (key: string) => void;
}

/**
 * Redesign (v1.1) Home header — a light personalized greeting (replaces the image-carousel
 * hero): avatar + location + "Hi, {name} 👋", the AI-first search bar with voice, and quick
 * filter chips. Imagery now lives in the trail cards below. Brand-locked (saffron/pine).
 */
export function HomeHeroV2({
  firstName,
  locationLabel,
  onSearchPress,
  onVoicePress,
  onNotificationsPress,
  onMapPress,
  filterChips,
  onFilterPress,
}: HomeHeroV2Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const initial = firstName?.trim()?.[0]?.toUpperCase() ?? "T";

  return (
    <View style={[styles.container, { paddingTop: (insets.top ?? 0) + 8 }]}>
      <View style={styles.row}>
        <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <View style={styles.greetBlock}>
          {locationLabel ? (
            <View style={styles.locRow}>
              <Ionicons name="location" size={11} color={colors.earth} />
              <Text style={[styles.loc, { color: colors.earth }]} numberOfLines={1}>{locationLabel}</Text>
            </View>
          ) : null}
          <Text style={[styles.greeting, { color: colors.textPrimary }]} numberOfLines={1}>
            Hi, {firstName} 👋
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={onNotificationsPress}
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          testID="home-notifications"
        >
          <Ionicons name="notifications-outline" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: colors.pine ?? colors.textPrimary }]}
          onPress={onMapPress}
          accessibilityRole="button"
          accessibilityLabel="Map view"
          testID="home-map"
        >
          <Ionicons name="map-outline" size={18} color="#ffffff" />
        </TouchableOpacity>
      </View>

      <Text style={[styles.tagline, { color: colors.earth }]}>AI finds your perfect trail</Text>

      <View style={styles.searchWrap}>
        <AISearchBar onPress={onSearchPress} onVoicePress={onVoicePress} />
      </View>

      <QuickFilterChips chips={filterChips} onPress={onFilterPress} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 8, gap: 12 },
  row: { flexDirection: "row", alignItems: "center", gap: 11 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontWeight: "700", fontSize: 16, fontFamily: "Inter_600SemiBold" },
  greetBlock: { flex: 1 },
  locRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  loc: { fontSize: 11, fontWeight: "500", fontFamily: "Inter_500Medium" },
  greeting: { fontSize: 19, fontFamily: "PlayfairDisplay_700Bold", letterSpacing: -0.2 },
  iconBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  tagline: { fontSize: 15, fontFamily: "PlayfairDisplay_600SemiBold", marginTop: -4 },
  searchWrap: { marginTop: -2 },
});
