import { View, Text, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

interface MenuRow {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  route: string;
  badge?: string;
}

interface AccountDashboardProps {
  savedCount: number;
  downloadCount: number;
}

const MENU_ROWS: MenuRow[] = [
  { label: "Saved Treks", icon: "bookmark-outline", route: "/(tabs)/account/saved" },
  { label: "Downloads", icon: "download-outline", route: "/(tabs)/account/downloads" },
  { label: "Enquiries", icon: "chatbubble-outline", route: "/(tabs)/account/enquiries" },
  { label: "Premium", icon: "star-outline", route: "/(tabs)/account/premium" },
  { label: "Settings", icon: "settings-outline", route: "/(tabs)/account/settings" },
  { label: "Privacy & Data", icon: "shield-outline", route: "/(tabs)/account/privacy" },
];

export function AccountDashboard({ savedCount, downloadCount }: AccountDashboardProps) {
  const { colors } = useTheme();
  const router = useRouter();

  return (
    <View>
      {/* Stats strip */}
      <View
        style={{
          flexDirection: "row",
          marginHorizontal: 20,
          marginBottom: 20,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          overflow: "hidden",
        }}
      >
        {[
          { label: "Saved", value: savedCount },
          { label: "Downloads", value: downloadCount },
        ].map((stat, i) => (
          <View
            key={stat.label}
            style={{
              flex: 1,
              alignItems: "center",
              paddingVertical: 14,
              borderRightWidth: i < 1 ? 1 : 0,
              borderRightColor: colors.border,
            }}
          >
            <Text
              style={{
                fontFamily: "PlayfairDisplay_700Bold",
                fontSize: 22,
                color: colors.textPrimary,
                lineHeight: 26,
              }}
            >
              {stat.value}
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 12,
                color: colors.textSecondary,
                marginTop: 2,
              }}
            >
              {stat.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Menu rows */}
      <View
        style={{
          marginHorizontal: 20,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          overflow: "hidden",
        }}
      >
        {MENU_ROWS.map((row, i) => (
          <TouchableOpacity
            key={row.label}
            onPress={() => router.push(row.route as never)}
            accessibilityRole="button"
            accessibilityLabel={row.label}
            activeOpacity={0.7}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 14,
              paddingHorizontal: 16,
              paddingVertical: 15,
              borderBottomWidth: i < MENU_ROWS.length - 1 ? 1 : 0,
              borderBottomColor: colors.border,
            }}
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                backgroundColor: colors.accent + "15",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name={row.icon} size={18} color={colors.accent} />
            </View>
            <Text
              style={{
                flex: 1,
                fontFamily: "Inter_500Medium",
                fontSize: 15,
                color: colors.textPrimary,
              }}
            >
              {row.label}
            </Text>
            {row.badge && (
              <View
                style={{
                  backgroundColor: colors.accent,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 10,
                  marginRight: 6,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 11,
                    color: "#fff",
                  }}
                >
                  {row.badge}
                </Text>
              </View>
            )}
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}
