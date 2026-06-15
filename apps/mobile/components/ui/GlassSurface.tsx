import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useTheme } from "@/hooks/useTheme";
import { radius } from "@/constants/theme";

type GlassSurfaceProps = {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  rounded?: keyof typeof radius | "none";
  intensity?: number;
  glassStyle?: "regular" | "clear";
  bordered?: boolean;
};

/**
 * App-wide glass surface primitive: native Liquid Glass on iOS 26+
 * (expo-glass-effect, falling back to frosted blur on older iOS),
 * frosted expo-blur BlurView on Android/web.
 */
export function GlassSurface({
  children,
  style,
  rounded = "lg",
  intensity = 35,
  glassStyle = "regular",
  bordered = true,
}: GlassSurfaceProps) {
  const { colors, isDark } = useTheme();
  const borderRadius = rounded === "none" ? 0 : radius[rounded];

  if (Platform.OS === "ios" && isLiquidGlassAvailable()) {
    return (
      <GlassView
        glassEffectStyle={glassStyle}
        tintColor={colors.glassTint}
        colorScheme={isDark ? "dark" : "light"}
        style={[
          { borderRadius, overflow: "hidden" },
          bordered && { borderWidth: 1, borderColor: colors.glassBorder },
          style,
        ]}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <BlurView
      intensity={intensity}
      tint={isDark ? "dark" : "light"}
      experimentalBlurMethod={Platform.OS === "android" ? "dimezisBlurView" : undefined}
      style={[
        { borderRadius, overflow: "hidden" },
        bordered && { borderWidth: 1, borderColor: colors.glassBorder },
        style,
      ]}
    >
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.glassOverlay }]} />
      {children}
    </BlurView>
  );
}
