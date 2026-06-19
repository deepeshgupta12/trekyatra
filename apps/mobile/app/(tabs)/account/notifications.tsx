import { View, Text, Switch, TouchableOpacity, ScrollView, Alert } from "react-native";
import { SafeArea } from "@/components/ui/SafeArea";
import { useTheme } from "@/hooks/useTheme";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTIF_PREFS_KEY = "notification_prefs";

interface NotifPref {
  key: string;
  label: string;
  description: string;
  defaultOn: boolean;
}

const CATEGORIES: NotifPref[] = [
  {
    key: "permit_alerts",
    label: "Permit alerts",
    description: "Permit windows opening/closing for treks you follow",
    defaultOn: true,
  },
  {
    key: "trek_conditions",
    label: "Trek condition updates",
    description: "Weather, trail, and route condition changes",
    defaultOn: true,
  },
  {
    key: "seasonal_alerts",
    label: "Seasonal alerts",
    description: "Best-time-to-go reminders for saved treks",
    defaultOn: true,
  },
  {
    key: "new_articles",
    label: "New trek articles",
    description: "Newly published trek guides and editorials",
    defaultOn: false,
  },
  {
    key: "plan_followups",
    label: "Plan My Trek follow-ups",
    description: "Updates from operators on your trek planning requests",
    defaultOn: true,
  },
  {
    key: "community",
    label: "Community",
    description: "Buddy requests and new community reports",
    defaultOn: false,
  },
];

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [prefs, setPrefs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(NOTIF_PREFS_KEY);
      if (stored) {
        setPrefs(JSON.parse(stored));
      } else {
        const defaults: Record<string, boolean> = {};
        CATEGORIES.forEach((c) => { defaults[c.key] = c.defaultOn; });
        setPrefs(defaults);
      }
    })();
  }, []);

  async function handleToggle(key: string, val: boolean) {
    const updated = { ...prefs, [key]: val };
    setPrefs(updated);
    await AsyncStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(updated));
  }

  return (
    <SafeArea>
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
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View>
          <Text
            style={{
              fontFamily: "PlayfairDisplay_700Bold",
              fontSize: 22,
              color: colors.textPrimary,
            }}
          >
            Notifications
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 12,
              color: colors.textSecondary,
            }}
          >
            Saved locally — synced when online
          </Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
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
          {CATEGORIES.map((cat, i) => (
            <View
              key={cat.key}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: i < CATEGORIES.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
                gap: 14,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: "Inter_500Medium",
                    fontSize: 14,
                    color: colors.textPrimary,
                    marginBottom: 3,
                  }}
                >
                  {cat.label}
                </Text>
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 12,
                    color: colors.textSecondary,
                    lineHeight: 17,
                  }}
                >
                  {cat.description}
                </Text>
              </View>
              <Switch
                value={prefs[cat.key] ?? cat.defaultOn}
                onValueChange={(val) => handleToggle(cat.key, val)}
                trackColor={{ false: colors.border, true: colors.accent + "88" }}
                thumbColor={
                  (prefs[cat.key] ?? cat.defaultOn) ? colors.accent : colors.textMuted
                }
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeArea>
  );
}
