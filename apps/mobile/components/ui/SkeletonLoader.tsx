import { useEffect, useRef, useState } from "react";
import { Animated, View, type ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/hooks/useTheme";

interface SkeletonLoaderProps {
  width?: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

/**
 * Shimmer placeholder — a base fill with a highlight band sweeping left→right.
 * Uses RN Animated + useNativeDriver (the design-system skill warns reanimated can
 * crash on New-Arch fast-refresh). Theme-aware via useTheme.
 */
export function SkeletonLoader({
  width = "100%",
  height,
  borderRadius = 8,
  style,
}: SkeletonLoaderProps) {
  const { isDark } = useTheme();
  const progress = useRef(new Animated.Value(0)).current;
  const [boxWidth, setBoxWidth] = useState(0);

  useEffect(() => {
    if (boxWidth === 0) return;
    const anim = Animated.loop(
      Animated.timing(progress, { toValue: 1, duration: 1150, useNativeDriver: true })
    );
    anim.start();
    return () => anim.stop();
  }, [boxWidth, progress]);

  const base = isDark ? "rgba(255,255,255,0.06)" : "rgba(29,58,46,0.07)";
  const highlight = isDark ? "rgba(255,255,255,0.13)" : "rgba(255,255,255,0.6)";

  return (
    <View
      onLayout={(e) => setBoxWidth(e.nativeEvent.layout.width)}
      style={[{ width, height, borderRadius, backgroundColor: base, overflow: "hidden" }, style]}
    >
      {boxWidth > 0 && (
        <Animated.View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            transform: [
              {
                translateX: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-boxWidth, boxWidth],
                }),
              },
            ],
          }}
        >
          <LinearGradient
            colors={["transparent", highlight, "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1 }}
          />
        </Animated.View>
      )}
    </View>
  );
}

/** Card-shaped skeleton mirroring TrekCard's layout (image + title + meta pills). */
export function SkeletonCard() {
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 20,
        gap: 12,
      }}
    >
      <SkeletonLoader height={160} borderRadius={12} />
      <SkeletonLoader height={20} width="70%" />
      <SkeletonLoader height={14} width="50%" />
      <View style={{ flexDirection: "row", gap: 8 }}>
        <SkeletonLoader height={24} width={60} borderRadius={999} />
        <SkeletonLoader height={24} width={80} borderRadius={999} />
      </View>
    </View>
  );
}

/** Full-bleed trek card skeleton (matches TrekCard's cover-image aspect for grids/rows). */
export function TrekCardSkeleton({
  width = 196,
  height = 260,
}: {
  width?: number;
  height?: number;
}) {
  return <SkeletonLoader width={width} height={height} borderRadius={18} />;
}
