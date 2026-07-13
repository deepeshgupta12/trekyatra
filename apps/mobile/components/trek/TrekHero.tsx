import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

type IconName = React.ComponentProps<typeof Ionicons>["name"];

interface TrekHeroProps {
  imageUrl: string | null;
  title: string;
  state: string | null;
  height?: number;
  onShare?: () => void;
  duration?: string | null;
  altitude?: string | null;
  difficulty?: string | null;
  season?: string | null;
}

const FALLBACK_BLUR = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

function difficultyAccent(d: string | null | undefined): string {
  const key = (d ?? "").toLowerCase();
  if (key.includes("easy")) return "#34d399";
  if (key.includes("moderate") && key.includes("difficult")) return "#fbbf24";
  if (key === "moderate") return "#fbbf24";
  if (key.includes("challeng") || key.includes("difficult") || key.includes("hard")) return "#f87171";
  return "#fbbf24";
}

interface Stat {
  icon: IconName;
  value: string;
  label: string;
  color?: string;
}

export function TrekHero({
  imageUrl,
  title,
  state,
  height = 380,
  onShare,
  duration,
  altitude,
  difficulty,
  season,
}: TrekHeroProps) {
  const insets = useSafeAreaInsets();
  const topInset = insets.top ?? 0; // guard: NaN height collapses the hero

  const stats: Stat[] = [
    duration ? { icon: "time-outline", value: duration, label: "Duration" } : null,
    altitude ? { icon: "trending-up-outline", value: altitude, label: "Max altitude" } : null,
    difficulty
      ? { icon: "fitness-outline", value: difficulty, label: "Difficulty", color: difficultyAccent(difficulty) }
      : null,
    season ? { icon: "calendar-outline", value: season, label: "Best season" } : null,
  ].filter(Boolean).slice(0, 3) as Stat[];

  return (
    <View style={[styles.container, { height: height + topInset }]}>
      <Image
        source={imageUrl ? { uri: imageUrl } : undefined}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        placeholder={FALLBACK_BLUR}
        transition={400}
      />
      {/* Cinematic gradient: subtle top vignette → deep readable base */}
      <LinearGradient
        colors={["rgba(0,0,0,0.28)", "transparent", "rgba(0,0,0,0.35)", "rgba(0,0,0,0.82)", "rgba(0,0,0,0.94)"]}
        locations={[0, 0.28, 0.6, 0.86, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Back button */}
      <TouchableOpacity
        style={[styles.circleBtn, styles.backBtn, { top: topInset + 10 }]}
        onPress={() => router.back()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={22} color="#fff" />
      </TouchableOpacity>

      {/* Share button */}
      {onShare && (
        <TouchableOpacity
          style={[styles.circleBtn, styles.shareBtn, { top: topInset + 10 }]}
          onPress={onShare}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Share trek"
        >
          <Ionicons name="share-outline" size={19} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Title, state + at-a-glance stats */}
      <View style={styles.footer}>
        {state && (
          <View style={styles.statePill}>
            <Ionicons name="location" size={11} color="#fff" />
            <Text style={styles.stateLabel}>{state.toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.title} numberOfLines={3}>{title}</Text>

        {stats.length > 0 && (
          <View style={styles.statsRow}>
            {stats.map((s, i) => (
              <View key={s.label} style={styles.statItem}>
                {i > 0 && <View style={styles.statDivider} />}
                <View style={styles.statInner}>
                  <Ionicons name={s.icon} size={15} color={s.color ?? "#E8702A"} />
                  <View style={styles.statText}>
                    <Text style={[styles.statValue, s.color ? { color: s.color } : null]} numberOfLines={1}>
                      {s.value}
                    </Text>
                    <Text style={styles.statLabel}>{s.label}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    justifyContent: "flex-end",
  },
  circleBtn: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
  },
  backBtn: { left: 16 },
  shareBtn: { right: 16 },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 18,
    gap: 10,
  },
  statePill: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(232,112,42,0.92)",
    borderRadius: 7,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  stateLabel: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "700",
    letterSpacing: 1.3,
  },
  title: {
    fontSize: 29,
    fontWeight: "700",
    color: "#ffffff",
    lineHeight: 35,
    fontFamily: "PlayfairDisplay_700Bold",
    textShadowColor: "rgba(0,0,0,0.45)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "stretch",
    marginTop: 4,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.14)",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
  },
  statDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginVertical: 2,
  },
  statInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 8,
  },
  statText: { flex: 1 },
  statValue: {
    fontSize: 13,
    fontWeight: "700",
    color: "#ffffff",
  },
  statLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.6)",
    marginTop: 1,
  },
});
