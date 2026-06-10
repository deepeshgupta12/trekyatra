import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { contentApi } from "@/lib/mobileApi";
import { useState } from "react";

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
      router.push("/(auth)/sign-in");
      return;
    }
    if (saving || saved) return;
    setSaving(true);
    try {
      await contentApi.saveTrek(slug);
      setSaved(true);
    } catch {
      // non-critical
    } finally {
      setSaving(false);
    }
  }

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: isDark ? "#0f1117" : colors.surface,
          borderTopColor: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)",
          paddingBottom: insets.bottom + 8,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.planButton}
        activeOpacity={0.85}
        onPress={() => router.push("/(tabs)/plan")}
      >
        <Text style={styles.planText}>✦ Plan with this trek</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.saveButton, { borderColor: saved ? "#E8702A" : isDark ? "rgba(255,255,255,0.18)" : "rgba(0,0,0,0.18)" }]}
        activeOpacity={0.8}
        onPress={handleSave}
      >
        <Text style={{ fontSize: 18, color: saved ? "#E8702A" : colors.textMuted }}>
          {saved ? "♥" : "♡"}
        </Text>
      </TouchableOpacity>
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
    borderTopWidth: 1,
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
  saveButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});
