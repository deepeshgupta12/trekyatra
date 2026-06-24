import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeArea } from "@/components/ui/SafeArea";
import { useTheme } from "@/hooks/useTheme";
import { useCheckin, type CheckinOut, type TrekHistoryStats } from "@/hooks/useCheckin";
import { TrekHistoryCard } from "@/components/account/TrekHistoryCard";

const BADGE_ICONS: Record<string, string> = {
  "First Trek": "🏔️",
  "5-Trek Club": "🌟",
  "10-Trek Veteran": "🏆",
  "Himalayan Explorer": "🗺️",
  "Monsoon Warrior": "🌧️",
  "High Altitude Ace": "⛰️",
};

export default function TrekHistoryScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { getHistory, getStats, loading } = useCheckin();

  const [history, setHistory] = useState<CheckinOut[]>([]);
  const [stats, setStats] = useState<TrekHistoryStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const [h, s] = await Promise.all([getHistory(), getStats()]);
    setHistory(h);
    setStats(s);
  }

  useEffect(() => {
    load();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, []);

  return (
    <SafeArea>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 16,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Go back"
        >
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={{ fontSize: 18, fontWeight: "700", color: colors.textPrimary }}>
          Trek History
        </Text>
      </View>

      {loading && history.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          ListHeaderComponent={
            stats ? (
              <View style={{ marginBottom: 20 }}>
                {/* Stats row */}
                <View
                  style={{
                    flexDirection: "row",
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: colors.surface,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 14,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 24, fontWeight: "800", color: colors.accent }}>
                      {stats.total_treks}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                      Treks done
                    </Text>
                  </View>
                  <View
                    style={{
                      flex: 1,
                      backgroundColor: colors.surface,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: colors.border,
                      padding: 14,
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontSize: 24, fontWeight: "800", color: colors.accent }}>
                      {stats.total_days}
                    </Text>
                    <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                      Days trekked
                    </Text>
                  </View>
                  {stats.favourite_state ? (
                    <View
                      style={{
                        flex: 2,
                        backgroundColor: colors.surface,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: colors.border,
                        padding: 14,
                        alignItems: "center",
                      }}
                    >
                      <Text
                        style={{ fontSize: 13, fontWeight: "700", color: colors.textPrimary, textAlign: "center" }}
                        numberOfLines={1}
                      >
                        {stats.favourite_state}
                      </Text>
                      <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>
                        Favourite state
                      </Text>
                    </View>
                  ) : null}
                </View>

                {/* Badges */}
                {stats.badges.length > 0 && (
                  <View>
                    <Text
                      style={{
                        fontSize: 13,
                        fontWeight: "600",
                        color: colors.textSecondary,
                        marginBottom: 8,
                      }}
                    >
                      Badges
                    </Text>
                    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                      {stats.badges.map((badge) => (
                        <View
                          key={badge}
                          style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 4,
                            backgroundColor: colors.accent + "18",
                            borderRadius: 20,
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                          }}
                        >
                          <Text style={{ fontSize: 13 }}>{BADGE_ICONS[badge] ?? "🎖️"}</Text>
                          <Text style={{ fontSize: 12, fontWeight: "600", color: colors.accent }}>
                            {badge}
                          </Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}

                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: colors.textSecondary,
                    marginTop: 20,
                    marginBottom: 4,
                  }}
                >
                  {history.length > 0 ? `${history.length} treks` : "No treks yet"}
                </Text>
              </View>
            ) : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={{ alignItems: "center", paddingTop: 60, gap: 12 }}>
                <Ionicons name="trail-sign-outline" size={48} color={colors.textMuted} />
                <Text style={{ fontSize: 16, fontWeight: "600", color: colors.textSecondary }}>
                  No treks logged yet
                </Text>
                <Text
                  style={{ fontSize: 13, color: colors.textMuted, textAlign: "center", maxWidth: 260 }}
                >
                  After completing a trek, open the trek page and tap "I did this trek" to log it here.
                </Text>
              </View>
            ) : null
          }
          renderItem={({ item }) => <TrekHistoryCard entry={item} />}
        />
      )}
    </SafeArea>
  );
}
