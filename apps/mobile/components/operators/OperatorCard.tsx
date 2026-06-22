import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { GlassSurface } from "@/components/ui/GlassSurface";
import type { Operator } from "@/lib/mobileApi";

interface OperatorCardProps {
  operator: Operator;
  onPress: () => void;
}

export function OperatorCard({ operator, onPress }: OperatorCardProps) {
  const { colors } = useTheme();

  const initials = operator.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const regionLabel = operator.region?.join(" · ") ?? "India";

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`View ${operator.name}`}
      testID={`operator-card-${operator.slug}`}
    >
      <GlassSurface
        rounded="lg"
        style={{
          marginHorizontal: 16,
          marginBottom: 12,
          padding: 16,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
          {/* Logo / initials */}
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              backgroundColor: colors.accent + "22",
              borderWidth: 1,
              borderColor: colors.accent + "44",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Text
              style={{
                fontFamily: "PlayfairDisplay_700Bold",
                fontSize: 18,
                color: colors.accent,
              }}
            >
              {initials}
            </Text>
          </View>

          {/* Info */}
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: "PlayfairDisplay_700Bold",
                fontSize: 15,
                color: colors.textPrimary,
                marginBottom: 3,
              }}
              numberOfLines={1}
            >
              {operator.name}
            </Text>

            {/* Rating */}
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 }}>
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 12,
                  color: colors.textPrimary,
                }}
              >
                {operator.rating_avg > 0 ? operator.rating_avg.toFixed(1) : "New"}
              </Text>
              {operator.review_count > 0 && (
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 12,
                    color: colors.textSecondary,
                  }}
                >
                  ({operator.review_count})
                </Text>
              )}
              <Text style={{ color: colors.textMuted, fontSize: 12 }}>·</Text>
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 12,
                  color: colors.textSecondary,
                }}
                numberOfLines={1}
              >
                {regionLabel}
              </Text>
            </View>

            {/* Specialities */}
            {operator.specializations.length > 0 && (
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 12,
                  color: colors.textMuted,
                }}
                numberOfLines={1}
              >
                {operator.specializations
                  .slice(0, 3)
                  .map((s) =>
                    s.trek_slug
                      .split("-")
                      .map((w) => w[0].toUpperCase() + w.slice(1))
                      .join(" ")
                  )
                  .join(", ")}
              </Text>
            )}
          </View>

          {/* Chevron */}
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </View>

        {/* Inquire CTA */}
        <View
          style={{
            marginTop: 12,
            paddingTop: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            flexDirection: "row",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              backgroundColor: colors.accent + "18",
              borderRadius: 20,
              paddingHorizontal: 12,
              paddingVertical: 5,
            }}
          >
            <Ionicons name="mail-outline" size={13} color={colors.accent} />
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 12,
                color: colors.accent,
              }}
            >
              Inquire
            </Text>
          </View>
        </View>
      </GlassSurface>
    </TouchableOpacity>
  );
}
