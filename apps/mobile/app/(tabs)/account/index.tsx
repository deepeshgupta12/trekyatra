import { ScrollView, View, Text, TouchableOpacity, Alert } from "react-native";
import { useState } from "react";
import { SafeArea } from "@/components/ui/SafeArea";
import { ProfileHeader } from "@/components/account/ProfileHeader";
import { AccountDashboard } from "@/components/account/AccountDashboard";
import { useAuth } from "@/hooks/useAuth";
import { useRequireAuth } from "@/hooks/useRequireAuth";
import { useSavedTreks, useDownloads } from "@/hooks/useAccount";
import { useTheme } from "@/hooks/useTheme";
import { BuddyRequestSheet } from "@/components/buddy/BuddyRequestSheet";
import { BuddyChatScreen } from "@/components/buddy/BuddyChatScreen";
import type { BuddyRequestOut } from "@/hooks/useBuddies";

export default function AccountIndexScreen() {
  useRequireAuth();
  const { user, signOut } = useAuth();
  const { bookmarks } = useSavedTreks();
  const { downloads } = useDownloads();
  const { colors } = useTheme();
  const [buddyRequestsVisible, setBuddyRequestsVisible] = useState(false);
  const [chatReq, setChatReq] = useState<BuddyRequestOut | null>(null);
  const [profileSignalId, setProfileSignalId] = useState<string | null>(null);

  function handleSignOut() {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: signOut,
      },
    ]);
  }

  return (
    <SafeArea>
      <ScrollView
        contentContainerStyle={{ paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 }}>
          <Text
            style={{
              fontFamily: "PlayfairDisplay_700Bold",
              fontSize: 26,
              color: colors.textPrimary,
            }}
          >
            Your Account
          </Text>
        </View>

        <ProfileHeader user={user} />

        <View style={{ height: 16 }} />

        <AccountDashboard
          savedCount={bookmarks.length}
          downloadCount={downloads.length}
        />

        <View style={{ height: 16 }} />

        {/* Buddy Requests */}
        <TouchableOpacity
          onPress={() => setBuddyRequestsVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="View buddy requests"
          activeOpacity={0.7}
          style={{
            marginHorizontal: 20,
            marginBottom: 12,
            paddingVertical: 14,
            paddingHorizontal: 18,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: colors.textPrimary }}>
            Trek Buddy Requests
          </Text>
          <Text style={{ fontSize: 16, color: colors.accent }}>→</Text>
        </TouchableOpacity>

        <View style={{ height: 12 }} />

        {/* Sign out */}
        <TouchableOpacity
          onPress={handleSignOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          activeOpacity={0.7}
          style={{
            marginHorizontal: 20,
            paddingVertical: 14,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#ef444430",
            backgroundColor: "#ef444410",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 15,
              color: "#ef4444",
            }}
          >
            Sign out
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <BuddyRequestSheet
        visible={buddyRequestsVisible}
        onClose={() => setBuddyRequestsVisible(false)}
        onOpenChat={(req) => {
          setBuddyRequestsVisible(false);
          setChatReq(req);
        }}
        onViewProfile={(signalId) => setProfileSignalId(signalId)}
      />

      <BuddyChatScreen
        visible={!!chatReq}
        requestId={chatReq?.id ?? null}
        otherPartyName={chatReq?.other_party_name ?? ""}
        onClose={() => setChatReq(null)}
      />
    </SafeArea>
  );
}
