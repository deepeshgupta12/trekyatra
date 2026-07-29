import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { contentApi } from "@/lib/mobileApi";
import { trackTrekSaved } from "@/lib/analytics";
import { useState } from "react";
import { GlassSurface } from "@/components/ui/GlassSurface";

interface TrekStickyBarProps {
  slug: string;
  trekName: string;
}

/**
 * Redesign (v1.1) — same actions as before (Plan / Save / Compare), only the UI is enhanced:
 * the bar now FLOATS (inset margins, rounded corners, GlassSurface, shadow) instead of being
 * edge-attached with a top border. In-flow (reserves height — nothing hides behind it).
 */
export function TrekStickyBar({ slug, trekName }: TrekStickyBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!user) {
      Alert.alert(
        "Sign in to save",
        "Create a free account to shortlist treks and plan your Himalayan adventure.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Sign In", onPress: () => router.push("/(auth)/sign-in" as never) },
        ]
      );
      return;
    }
    if (saving || saved) return;
    setSaving(true);
    try {
      await contentApi.saveTrek(slug);
      trackTrekSaved(slug);
      setSaved(true);
    } catch {
      Alert.alert("Could not save", "Something went wrong adding this to your shortlist. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function handleCompare() {
    router.push(`/(tabs)/(home)/compare?slug=${slug}` as never);
  }

  const bottomPad = insets.bottom > 0 ? insets.bottom : Platform.OS === "ios" ? 16 : 8;
  const border = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const saveIconColor = saved ? colors.accent : colors.textMuted;
  const saveBorderColor = saved ? colors.accent : isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)";

  return (
    <View style={[styles.wrap, { paddingBottom: bottomPad }]}>
      <View style={[styles.float, { borderColor: border }]}>
        <GlassSurface rounded="none" bordered={false} style={[StyleSheet.absoluteFill, styles.floatGlass]} />

        <TouchableOpacity
          style={styles.planButton}
          activeOpacity={0.85}
          onPress={() => router.push("/(tabs)/plan" as never)}
          accessibilityRole="button"
          accessibilityLabel={`Plan a trek to ${trekName}`}
          testID="sticky-plan"
        >
          <Text style={styles.planText}>✦ Plan with this trek</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconButton, { borderColor: saveBorderColor }]}
          activeOpacity={0.8}
          onPress={handleSave}
          disabled={saving}
          accessibilityRole="button"
          accessibilityLabel={saved ? "Saved to shortlist" : "Save to shortlist"}
          testID="sticky-save"
        >
          <Ionicons name={saved ? "bookmark" : "bookmark-outline"} size={20} color={saveIconColor} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconButton, { borderColor: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)" }]}
          activeOpacity={0.8}
          onPress={handleCompare}
          accessibilityRole="button"
          accessibilityLabel="Compare treks"
          testID="sticky-compare"
        >
          <Ionicons name="git-compare-outline" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { paddingHorizontal: 12, paddingTop: 8 },
  float: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 8,
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 10,
  },
  floatGlass: { borderRadius: 22 },
  planButton: {
    flex: 1,
    height: 46,
    backgroundColor: "#E8702A",
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#E8702A",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
  planText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
