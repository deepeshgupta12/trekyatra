import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { contentApi } from "@/lib/mobileApi";
import { useState } from "react";
import { GlassSurface } from "@/components/ui/GlassSurface";

interface TrekStickyBarProps {
  slug: string;
  trekName: string;
}

export function TrekStickyBar({ slug, trekName }: TrekStickyBarProps) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!user) {
      router.push("/(auth)/sign-in" as never);
      return;
    }
    if (saving || saved) return;
    setSaving(true);
    try {
      await contentApi.saveTrek(slug);
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

  const borderColor = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";
  const saveIconColor = saved ? "#E8702A" : colors.textMuted;
  const saveBorderColor = saved
    ? "#E8702A"
    : isDark
    ? "rgba(255,255,255,0.18)"
    : "rgba(0,0,0,0.18)";

  return (
    <View style={{ paddingBottom: insets.bottom + 8 }}>
      <GlassSurface
        rounded="none"
        bordered={false}
        style={[StyleSheet.absoluteFill, { borderTopWidth: 1, borderTopColor: borderColor }]}
      />
      <View style={styles.bar}>
        <TouchableOpacity
          style={styles.planButton}
          activeOpacity={0.85}
          onPress={() => router.push("/(tabs)/plan" as never)}
          accessibilityLabel={`Plan a trek to ${trekName}`}
        >
          <Text style={styles.planText}>✦ Plan with this trek</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconButton, { borderColor: saveBorderColor }]}
          activeOpacity={0.8}
          onPress={handleSave}
          disabled={saving}
          accessibilityLabel={saved ? "Saved to shortlist" : "Save to shortlist"}
        >
          <Ionicons
            name={saved ? "bookmark" : "bookmark-outline"}
            size={20}
            color={saveIconColor}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.iconButton, { borderColor: isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)" }]}
          activeOpacity={0.8}
          onPress={handleCompare}
          accessibilityLabel="Compare treks"
        >
          <Ionicons name="git-compare-outline" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  planButton: {
    flex: 1,
    backgroundColor: "#E8702A",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
    shadowColor: "#E8702A",
    shadowOpacity: 0.35,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  planText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
