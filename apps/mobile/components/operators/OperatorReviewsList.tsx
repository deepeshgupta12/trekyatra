import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import type { OperatorReview } from "@/lib/mobileApi";

interface OperatorReviewsListProps {
  reviews: OperatorReview[];
}

function StarRow({ rating }: { rating: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= rating ? "star" : "star-outline"}
          size={12}
          color={i <= rating ? "#F59E0B" : colors.textMuted}
        />
      ))}
    </View>
  );
}

export function OperatorReviewsList({ reviews }: OperatorReviewsListProps) {
  const { colors } = useTheme();

  if (reviews.length === 0) {
    return (
      <View style={{ paddingVertical: 16, alignItems: "center" }}>
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 13,
            color: colors.textMuted,
          }}
        >
          No reviews yet — be the first!
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: 12 }}>
      {reviews.map((review) => (
        <View
          key={review.id}
          style={{
            backgroundColor: colors.surface,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 14,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <StarRow rating={review.rating} />
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 11,
                color: colors.textMuted,
              }}
            >
              {new Date(review.created_at).toLocaleDateString("en-IN", {
                month: "short",
                year: "numeric",
              })}
            </Text>
          </View>
          {review.body ? (
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 13,
                color: colors.textSecondary,
                lineHeight: 19,
              }}
            >
              {review.body}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}
