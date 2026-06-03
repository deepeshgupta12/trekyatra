import { useEffect, useRef } from "react";
import { Animated, View, type ViewStyle } from "react-native";
import { colors } from "@/constants/theme";

interface SkeletonLoaderProps {
  width?: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({
  width = "100%",
  height,
  borderRadius = 8,
  style,
}: SkeletonLoaderProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 700,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.surface,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard() {
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
