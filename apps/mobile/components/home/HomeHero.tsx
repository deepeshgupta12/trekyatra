import { View, Text, StyleSheet, Pressable } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState, useEffect, useRef } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const IMAGES = [
  require("@/assets/onboarding-1.jpg"),
  require("@/assets/onboarding-2.jpg"),
  require("@/assets/onboarding-3.jpg"),
  require("@/assets/onboarding-4.jpg"),
];

const MONTH_SEASONS: Record<number, { label: string; icon: React.ComponentProps<typeof Ionicons>["name"] }> = {
  0:  { label: "Winter treks open", icon: "snow-outline" },
  1:  { label: "Best: Brahmatal, Kedarkantha", icon: "snow-outline" },
  2:  { label: "Spring season begins", icon: "flower-outline" },
  3:  { label: "Best: Valley of Flowers pre-season", icon: "flower-outline" },
  4:  { label: "Summer treks — great conditions", icon: "sunny-outline" },
  5:  { label: "Best: Hampta Pass, Roopkund", icon: "sunny-outline" },
  6:  { label: "Monsoon — limited high-altitude access", icon: "rainy-outline" },
  7:  { label: "Monsoon — Valley of Flowers peak", icon: "rainy-outline" },
  8:  { label: "Post-monsoon — best visibility", icon: "cloud-outline" },
  9:  { label: "Autumn — peak Himalayan season", icon: "leaf-outline" },
  10: { label: "Winter window: Kedarkantha opens", icon: "snow-outline" },
  11: { label: "Best: Kedarkantha, Brahmatal", icon: "snow-outline" },
};

const FALLBACK_BLUR = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

export function HomeHero() {
  const insets = useSafeAreaInsets();
  const [activeIdx, setActiveIdx] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const season = MONTH_SEASONS[new Date().getMonth()];

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % IMAGES.length);
    }, 5000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Cycling images — expo-image cross-fade handles transition */}
      {IMAGES.map((src, i) => (
        <Image
          key={i}
          source={src}
          style={[StyleSheet.absoluteFill, { opacity: i === activeIdx ? 1 : 0 }]}
          contentFit="cover"
          placeholder={FALLBACK_BLUR}
          transition={i === activeIdx ? 800 : 0}
          cachePolicy="memory-disk"
        />
      ))}

      {/* Gradient overlay */}
      <LinearGradient
        colors={["rgba(0,0,0,0.25)", "transparent", "rgba(0,0,0,0.55)", "rgba(0,0,0,0.88)"]}
        locations={[0, 0.28, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Content */}
      <View style={styles.content}>
        {/* Season badge */}
        <View style={styles.seasonBadge}>
          <Ionicons name={season.icon} size={11} color="rgba(255,255,255,0.85)" />
          <Text style={styles.seasonText}>{season.label}</Text>
        </View>

        <Text style={styles.wordmark}>TrekYatra</Text>
        <Text style={styles.tagline}>India's Himalayan trekking guide</Text>

        {/* Search bar */}
        <Pressable
          style={styles.searchBar}
          onPress={() => router.push("/(tabs)/browse" as never)}
          accessibilityLabel="Search treks"
          accessibilityRole="search"
        >
          <Ionicons name="search-outline" size={16} color="rgba(255,255,255,0.55)" />
          <Text style={styles.searchPlaceholder}>Search treks, regions, difficulty…</Text>
          <View style={styles.searchArrow}>
            <Ionicons name="arrow-forward" size={13} color="#fff" />
          </View>
        </Pressable>

        {/* Progress dots */}
        <View style={styles.dots}>
          {IMAGES.map((_, i) => (
            <Pressable key={i} onPress={() => setActiveIdx(i)} accessibilityLabel={`Go to image ${i + 1}`}>
              <View style={[styles.dot, i === activeIdx && styles.dotActive]} />
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 310,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 22,
    gap: 6,
  },
  seasonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.22)",
    marginBottom: 4,
  },
  seasonText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  wordmark: {
    fontSize: 32,
    fontWeight: "700",
    color: "#ffffff",
    fontFamily: "PlayfairDisplay_700Bold",
    letterSpacing: -0.5,
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  tagline: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    fontWeight: "400",
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.14)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    gap: 10,
    marginBottom: 12,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 13,
    color: "rgba(255,255,255,0.55)",
    fontWeight: "400",
  },
  searchArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#E8702A",
    alignItems: "center",
    justifyContent: "center",
  },
  dots: {
    flexDirection: "row",
    gap: 6,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  dotActive: {
    width: 18,
    backgroundColor: "#E8702A",
    borderRadius: 3,
  },
});
