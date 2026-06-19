import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import type { AuthUser } from "@/stores/authStore";

interface ProfileHeaderProps {
  user: AuthUser | null;
}

export function ProfileHeader({ user }: ProfileHeaderProps) {
  const { colors } = useTheme();
  const router = useRouter();

  const initials = user?.fullName
    ? user.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : (user?.email?.[0]?.toUpperCase() ?? "?");

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingHorizontal: 20,
        paddingVertical: 16,
      }}
    >
      <View
        style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.accent + "22",
          borderWidth: 1.5,
          borderColor: colors.accent + "55",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text
          style={{
            fontFamily: "PlayfairDisplay_700Bold",
            fontSize: 22,
            color: colors.accent,
            lineHeight: 26,
          }}
        >
          {initials}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: "PlayfairDisplay_700Bold",
            fontSize: 18,
            color: colors.textPrimary,
            marginBottom: 2,
          }}
          numberOfLines={1}
        >
          {user?.fullName ?? "Trekker"}
        </Text>
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 13,
            color: colors.textSecondary,
          }}
          numberOfLines={1}
        >
          {user?.email ?? ""}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => router.push("/(tabs)/account/settings" as never)}
        style={{
          paddingHorizontal: 14,
          paddingVertical: 7,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: colors.accent + "55",
          backgroundColor: colors.accent + "11",
        }}
        accessibilityLabel="Edit profile"
        accessibilityRole="button"
        activeOpacity={0.7}
      >
        <Text
          style={{
            fontFamily: "Inter_600SemiBold",
            fontSize: 13,
            color: colors.accent,
          }}
        >
          Edit
        </Text>
      </TouchableOpacity>
    </View>
  );
}
