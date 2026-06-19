import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { SafeArea } from "@/components/ui/SafeArea";
import { useTheme } from "@/hooks/useTheme";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const FEATURES = [
  "Offline trek guides — all 250+ treks",
  "Priority Q&A with TrekSage AI",
  "Early access to new routes",
  "Monthly curated trek calendar",
  "Exclusive permit alert notifications",
];

export default function PremiumScreen() {
  const { colors } = useTheme();
  const router = useRouter();

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
        <Text
          style={{
            fontFamily: "PlayfairDisplay_700Bold",
            fontSize: 22,
            color: colors.textPrimary,
          }}
        >
          Premium
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {/* Hero */}
        <View
          style={{
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.accent + "33",
            backgroundColor: colors.accent + "0D",
            padding: 24,
            alignItems: "center",
            marginBottom: 24,
          }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 32,
              backgroundColor: colors.accent + "22",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 16,
            }}
          >
            <Ionicons name="star" size={30} color={colors.accent} />
          </View>
          <Text
            style={{
              fontFamily: "PlayfairDisplay_700Bold",
              fontSize: 22,
              color: colors.textPrimary,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            TrekYatra Premium
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: colors.textSecondary,
              textAlign: "center",
              lineHeight: 21,
            }}
          >
            Everything you need to plan, prepare, and trek with confidence.
          </Text>
        </View>

        {/* Features */}
        <Text
          style={{
            fontFamily: "Inter_600SemiBold",
            fontSize: 13,
            color: colors.textSecondary,
            letterSpacing: 0.6,
            textTransform: "uppercase",
            marginBottom: 14,
          }}
        >
          What you get
        </Text>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: "hidden",
            marginBottom: 28,
          }}
        >
          {FEATURES.map((f, i) => (
            <View
              key={f}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                paddingHorizontal: 16,
                paddingVertical: 14,
                borderBottomWidth: i < FEATURES.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
              }}
            >
              <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 14,
                  color: colors.textPrimary,
                  flex: 1,
                }}
              >
                {f}
              </Text>
            </View>
          ))}
        </View>

        {/* Coming soon CTA */}
        <View
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            padding: 20,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 15,
              color: colors.textPrimary,
              marginBottom: 6,
            }}
          >
            Coming soon
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 13,
              color: colors.textSecondary,
              textAlign: "center",
            }}
          >
            Premium subscriptions launch shortly. You will be notified when it is available.
          </Text>
        </View>
      </ScrollView>
    </SafeArea>
  );
}
