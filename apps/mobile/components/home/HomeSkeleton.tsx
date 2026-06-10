import { View, StyleSheet, Animated } from "react-native";
import { useEffect, useRef } from "react";
import { useTheme } from "@/hooks/useTheme";

function PulseSkeleton({ style }: { style: object }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [opacity]);

  return <Animated.View style={[style, { opacity }]} />;
}

export function HomeSkeleton() {
  const { isDark } = useTheme();
  const bg = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";

  return (
    <View style={styles.container}>
      {/* Banner skeleton */}
      <PulseSkeleton style={[styles.banner, { backgroundColor: bg }]} />

      {/* Section heading */}
      <PulseSkeleton style={[styles.sectionHeading, { backgroundColor: bg }]} />
      {/* Horizontal cards row */}
      <View style={styles.row}>
        {[0, 1, 2, 3].map((i) => (
          <PulseSkeleton key={i} style={[styles.card, { backgroundColor: bg }]} />
        ))}
      </View>

      {/* Section heading */}
      <PulseSkeleton style={[styles.sectionHeading, { backgroundColor: bg }]} />
      {/* Feed grid */}
      <View style={styles.grid}>
        {[0, 1, 2, 3].map((i) => (
          <PulseSkeleton key={i} style={[styles.feedCard, { backgroundColor: bg }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 8,
    gap: 16,
  },
  banner: {
    marginHorizontal: 16,
    height: 100,
    borderRadius: 16,
  },
  sectionHeading: {
    marginHorizontal: 16,
    height: 22,
    width: "50%",
    borderRadius: 6,
  },
  row: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 12,
  },
  card: {
    width: 180,
    height: 220,
    borderRadius: 14,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
  },
  feedCard: {
    width: "47%",
    height: 160,
    borderRadius: 12,
  },
});
