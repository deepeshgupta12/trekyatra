import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

interface GatedContentOverlayProps {
  featureName?: string;
  onUpgrade: () => void;
  children?: React.ReactNode;
}

export function GatedContentOverlay({
  featureName = "this content",
  onUpgrade,
  children,
}: GatedContentOverlayProps) {
  const { colors, isDark } = useTheme();

  return (
    <View style={styles.wrapper}>
      {children && (
        <View style={styles.blurredContent} pointerEvents="none">
          {children}
        </View>
      )}
      <BlurView
        intensity={isDark ? 60 : 50}
        tint={isDark ? "dark" : "light"}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.overlay}>
        <View style={[styles.badge, { backgroundColor: colors.accent + "20", borderColor: colors.accent + "40" }]}>
          <Ionicons name="lock-closed" size={22} color={colors.accent} />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Premium Feature</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Unlock {featureName} and much more with TrekYatra Premium.
        </Text>
        <TouchableOpacity
          onPress={onUpgrade}
          activeOpacity={0.85}
          style={[styles.ctaButton, { backgroundColor: colors.accent }]}
        >
          <Ionicons name="star" size={15} color="#fff" />
          <Text style={styles.ctaText}>Unlock Premium</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: "hidden",
    borderRadius: 16,
    minHeight: 160,
  },
  blurredContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.25,
  },
  overlay: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    gap: 10,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 4,
  },
  ctaText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
});
