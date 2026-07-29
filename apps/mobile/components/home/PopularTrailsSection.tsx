import { useState, useCallback } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { router } from "expo-router";
import { TrailCard } from "@/components/trek/TrailCard";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/hooks/useAuth";
import { contentApi, type TrekListItem } from "@/lib/mobileApi";
import { trackTrekSaved } from "@/lib/analytics";

interface PopularTrailsSectionProps {
  treks: TrekListItem[];
  loading?: boolean;
  onSeeAll?: () => void;
}

/**
 * Redesign (v1.1) "Popular with trekkers" — a horizontal rail of prominent TrailCards
 * (heart + route-map thumbnail). Save is auth-gated and mirrors the existing TrekStickyBar
 * flow (saveTrek → trackTrekSaved). Saved state is tracked per session.
 */
export function PopularTrailsSection({ treks, loading, onSeeAll }: PopularTrailsSectionProps) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [savedSlugs, setSavedSlugs] = useState<Set<string>>(new Set());

  const toggleSave = useCallback(
    async (trek: TrekListItem) => {
      if (!user) {
        Alert.alert("Sign in to save", "Create a free account to save treks to your shortlist.", [
          { text: "Cancel", style: "cancel" },
          { text: "Sign in", onPress: () => router.push("/(auth)/sign-in" as never) },
        ]);
        return;
      }
      if (savedSlugs.has(trek.slug)) return;
      try {
        await contentApi.saveTrek(trek.slug);
        trackTrekSaved(trek.slug);
        setSavedSlugs((prev) => new Set(prev).add(trek.slug));
      } catch {
        Alert.alert("Could not save", "Something went wrong. Please try again.");
      }
    },
    [user, savedSlugs]
  );

  if (loading && treks.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headRow}>
          <Text style={[styles.heading, { color: colors.textPrimary }]}>Popular with trekkers</Text>
        </View>
        <View style={styles.row}>
          {[0, 1].map((i) => (
            <SkeletonLoader key={i} width={300} height={200} borderRadius={20} style={{ marginRight: 14 }} />
          ))}
        </View>
      </View>
    );
  }

  if (treks.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={styles.headRow}>
        <Text style={[styles.heading, { color: colors.textPrimary }]}>Popular with trekkers</Text>
        {onSeeAll ? (
          <TouchableOpacity onPress={onSeeAll} accessibilityRole="button" accessibilityLabel="See all popular treks" testID="popular-see-all">
            <Text style={[styles.seeAll, { color: colors.accent }]}>See all</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {treks.map((trek) => (
          <TrailCard
            key={trek.slug}
            trek={trek}
            width={300}
            height={200}
            saved={savedSlugs.has(trek.slug)}
            onToggleSave={toggleSave}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 22, gap: 12 },
  headRow: { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", paddingHorizontal: 16 },
  heading: { fontSize: 18, fontFamily: "PlayfairDisplay_700Bold" },
  seeAll: { fontSize: 12, fontWeight: "600", fontFamily: "Inter_600SemiBold" },
  row: { paddingHorizontal: 16, paddingBottom: 2 },
});
