import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { Ionicons } from "@expo/vector-icons";
import { SafeArea } from "@/components/ui/SafeArea";
import { useTheme } from "@/hooks/useTheme";
import { useOperatorDetail, useOperatorReviews } from "@/hooks/useOperators";
import { OperatorReviewsList } from "@/components/operators/OperatorReviewsList";
import { OperatorInquirySheet } from "@/components/operators/OperatorInquirySheet";

export default function OperatorDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { colors } = useTheme();
  const router = useRouter();
  const [inquiryOpen, setInquiryOpen] = useState(false);

  const { data: operator, isLoading, isError } = useOperatorDetail(slug ?? "");
  const { data: reviews = [] } = useOperatorReviews(slug ?? "");

  if (isLoading) {
    return (
      <SafeArea>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      </SafeArea>
    );
  }

  if (isError || !operator) {
    return (
      <SafeArea>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.textMuted} />
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: colors.textSecondary,
              textAlign: "center",
              marginTop: 12,
            }}
          >
            Operator not found or unavailable.
          </Text>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ marginTop: 16 }}
            accessibilityRole="button"
          >
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.accent }}>
              ← Go back
            </Text>
          </TouchableOpacity>
        </View>
      </SafeArea>
    );
  }

  const initials = operator.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const regionLabel = operator.region?.join(" · ") ?? "India";

  return (
    <SafeArea>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {/* Nav bar */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 12,
            paddingHorizontal: 16,
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
              fontSize: 18,
              color: colors.textPrimary,
              flex: 1,
            }}
            numberOfLines={1}
          >
            {operator.name}
          </Text>
        </View>

        {/* Hero: logo + name */}
        <View
          style={{
            marginHorizontal: 16,
            borderRadius: 20,
            backgroundColor: colors.accent + "18",
            borderWidth: 1,
            borderColor: colors.accent + "33",
            padding: 24,
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              backgroundColor: colors.accent + "22",
              borderWidth: 1.5,
              borderColor: colors.accent + "55",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                fontFamily: "PlayfairDisplay_700Bold",
                fontSize: 28,
                color: colors.accent,
              }}
            >
              {initials}
            </Text>
          </View>
          <Text
            style={{
              fontFamily: "PlayfairDisplay_700Bold",
              fontSize: 20,
              color: colors.textPrimary,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            {operator.name}
          </Text>

          {/* Rating + region */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap", justifyContent: "center" }}>
            <Ionicons name="star" size={14} color="#F59E0B" />
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 14,
                color: colors.textPrimary,
              }}
            >
              {operator.rating_avg > 0 ? operator.rating_avg.toFixed(1) : "New"}
            </Text>
            {operator.review_count > 0 && (
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 13,
                  color: colors.textSecondary,
                }}
              >
                ({operator.review_count} reviews)
              </Text>
            )}
            <Text style={{ color: colors.textMuted }}>·</Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
              <Ionicons name="location-outline" size={13} color={colors.textMuted} />
              <Text
                style={{
                  fontFamily: "Inter_400Regular",
                  fontSize: 13,
                  color: colors.textSecondary,
                }}
              >
                {regionLabel}
              </Text>
            </View>
          </View>
        </View>

        {/* About */}
        {operator.description_long ? (
          <View style={{ marginHorizontal: 16, marginBottom: 20 }}>
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 12,
                color: colors.textSecondary,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                marginBottom: 8,
              }}
            >
              About
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 14,
                color: colors.textSecondary,
                lineHeight: 22,
              }}
            >
              {operator.description_long}
            </Text>
          </View>
        ) : null}

        {/* Specialities */}
        {operator.specializations.length > 0 ? (
          <View style={{ marginHorizontal: 16, marginBottom: 20 }}>
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 12,
                color: colors.textSecondary,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                marginBottom: 10,
              }}
            >
              Trek portfolio
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
              {operator.specializations.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => router.push(`/trek/${s.trek_slug}` as never)}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`View ${s.trek_slug} trek`}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_500Medium",
                      fontSize: 13,
                      color: colors.textPrimary,
                    }}
                  >
                    {s.trek_slug
                      .split("-")
                      .map((w) => w[0].toUpperCase() + w.slice(1))
                      .join(" ")}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        ) : null}

        {/* Trek types */}
        {operator.trek_types && operator.trek_types.length > 0 ? (
          <View style={{ marginHorizontal: 16, marginBottom: 20 }}>
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 12,
                color: colors.textSecondary,
                textTransform: "uppercase",
                letterSpacing: 0.6,
                marginBottom: 10,
              }}
            >
              Specialities
            </Text>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {operator.trek_types.map((type) => (
                <View
                  key={type}
                  style={{
                    backgroundColor: colors.surface,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingHorizontal: 12,
                    paddingVertical: 5,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_400Regular",
                      fontSize: 12,
                      color: colors.textSecondary,
                    }}
                  >
                    {type}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Reviews */}
        <View style={{ marginHorizontal: 16, marginBottom: 20 }}>
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 12,
              color: colors.textSecondary,
              textTransform: "uppercase",
              letterSpacing: 0.6,
              marginBottom: 10,
            }}
          >
            Reviews
          </Text>
          <OperatorReviewsList reviews={reviews.slice(0, 5)} />
        </View>
      </ScrollView>

      {/* Fixed bottom CTAs */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 28,
          gap: 10,
        }}
      >
        {/* Call operator */}
        {operator.phone ? (
          <TouchableOpacity
            onPress={() => Linking.openURL(`tel:${operator.phone}`)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Call operator"
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: colors.border,
              paddingVertical: 13,
              backgroundColor: colors.background,
            }}
          >
            <Ionicons name="call-outline" size={18} color={colors.textPrimary} />
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 15,
                color: colors.textPrimary,
              }}
            >
              Call operator
            </Text>
          </TouchableOpacity>
        ) : null}

        {/* Send inquiry */}
        <TouchableOpacity
          onPress={() => setInquiryOpen(true)}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Send inquiry"
          testID="send-inquiry-button"
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            borderRadius: 14,
            backgroundColor: colors.accent,
            paddingVertical: 14,
          }}
        >
          <Ionicons name="mail-outline" size={18} color="#fff" />
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#fff" }}>
            Send inquiry
          </Text>
        </TouchableOpacity>
      </View>

      {/* Inquiry bottom sheet */}
      <OperatorInquirySheet
        visible={inquiryOpen}
        operatorName={operator.name}
        operatorSlug={operator.slug}
        onClose={() => setInquiryOpen(false)}
      />
    </SafeArea>
  );
}
