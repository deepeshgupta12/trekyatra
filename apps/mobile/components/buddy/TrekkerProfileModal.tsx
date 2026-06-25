import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useEffect, useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { buddyApi } from "@/hooks/useBuddies";
import type { TrekkerProfileOut } from "@/hooks/useBuddies";

const EXP_LABEL: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  expert: "Expert",
};

interface Props {
  signalId: string | null;
  visible: boolean;
  onClose: () => void;
  onConnect: (signalId: string) => void;
}

export function TrekkerProfileModal({ signalId, visible, onClose, onConnect }: Props) {
  const { colors } = useTheme();
  const [profile, setProfile] = useState<TrekkerProfileOut | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !signalId) return;
    setLoading(true);
    setError(null);
    setProfile(null);
    buddyApi.getTrekkerProfile(signalId)
      .then(setProfile)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load profile"))
      .finally(() => setLoading(false));
  }, [signalId, visible]);

  const initials = profile?.display_name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) ?? "?";

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Trekker Profile</Text>
          <TouchableOpacity onPress={onClose} accessibilityLabel="Close">
            <Text style={[styles.close, { color: colors.accent }]}>Done</Text>
          </TouchableOpacity>
        </View>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        )}

        {error && (
          <View style={styles.center}>
            <Text style={[styles.errorText, { color: colors.textMuted }]}>{error}</Text>
          </View>
        )}

        {profile && (
          <ScrollView contentContainerStyle={styles.body}>
            {/* Avatar + name */}
            <View style={styles.profileRow}>
              <View style={[styles.avatar, { backgroundColor: colors.accent + "22" }]}>
                <Text style={[styles.avatarText, { color: colors.accent }]}>{initials}</Text>
              </View>
              <View style={styles.nameBlock}>
                <Text style={[styles.name, { color: colors.textPrimary }]}>{profile.display_name}</Text>
                <Text style={[styles.since, { color: colors.textMuted }]}>Member since {profile.joined_year}</Text>
              </View>
            </View>

            {/* Bio */}
            {profile.bio ? (
              <Text style={[styles.bio, { color: colors.textSecondary }]}>{profile.bio}</Text>
            ) : null}

            {/* Stats */}
            <View style={[styles.statsRow, { borderColor: colors.border }]}>
              <View style={styles.stat}>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{profile.trek_count}</Text>
                <Text style={[styles.statLabel, { color: colors.textMuted }]}>Treks done</Text>
              </View>
              {profile.experience ? (
                <View style={[styles.stat, styles.statBorder, { borderLeftColor: colors.border }]}>
                  <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                    {EXP_LABEL[profile.experience] ?? profile.experience}
                  </Text>
                  <Text style={[styles.statLabel, { color: colors.textMuted }]}>Experience</Text>
                </View>
              ) : null}
            </View>

            {/* Planning context */}
            <View style={[styles.planBox, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <Text style={[styles.planLabel, { color: colors.textMuted }]}>Planning signal</Text>
              <Text style={[styles.planTrek, { color: colors.textPrimary }]}>
                {profile.trek_slug.replace(/-/g, " ")}
              </Text>
              <Text style={[styles.planMonth, { color: colors.textSecondary }]}>{profile.month_year}</Text>
            </View>

            {/* Privacy notice */}
            <Text style={[styles.privacy, { color: colors.textFaint }]}>
              Contact details are shared by email only after mutual acceptance.
            </Text>

            {/* Connect CTA */}
            <TouchableOpacity
              onPress={() => { onClose(); if (signalId) onConnect(signalId); }}
              style={[styles.connectBtn, { backgroundColor: colors.accent }]}
              accessibilityLabel="Connect with this trekker"
            >
              <Text style={styles.connectText}>Send Connection Request</Text>
            </TouchableOpacity>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: { fontSize: 16, fontWeight: "600" },
  close: { fontSize: 15, fontWeight: "600" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  errorText: { fontSize: 14 },
  body: { padding: 20, gap: 16 },
  profileRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontWeight: "700" },
  nameBlock: { flex: 1 },
  name: { fontSize: 20, fontWeight: "700" },
  since: { fontSize: 12, marginTop: 2 },
  bio: { fontSize: 14, lineHeight: 22 },
  statsRow: {
    flexDirection: "row", borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12, overflow: "hidden",
  },
  stat: { flex: 1, padding: 14, alignItems: "center" },
  statBorder: { borderLeftWidth: StyleSheet.hairlineWidth },
  statValue: { fontSize: 18, fontWeight: "700" },
  statLabel: { fontSize: 11, marginTop: 2 },
  planBox: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, padding: 14, gap: 4 },
  planLabel: { fontSize: 11, fontWeight: "500", textTransform: "uppercase", letterSpacing: 0.5 },
  planTrek: { fontSize: 15, fontWeight: "600", textTransform: "capitalize" },
  planMonth: { fontSize: 13 },
  privacy: { fontSize: 11, lineHeight: 16 },
  connectBtn: { borderRadius: 12, paddingVertical: 14, alignItems: "center", marginTop: 4 },
  connectText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
