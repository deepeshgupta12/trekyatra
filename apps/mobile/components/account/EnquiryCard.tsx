import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";

export interface Enquiry {
  id: string;
  trek_interest: string;
  status: string;
  created_at: string;
  trek_slug?: string | null;
}

interface EnquiryCardProps {
  enquiry: Enquiry;
}

const STATUS_COLORS: Record<string, string> = {
  new: "#E8702A",
  contacted: "#5298C9",
  closed: "#6B4929",
};

export function EnquiryCard({ enquiry }: EnquiryCardProps) {
  const { colors } = useTheme();
  const statusColor = STATUS_COLORS[enquiry.status] ?? colors.textMuted;

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
        marginHorizontal: 20,
        marginBottom: 10,
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: colors.accent + "15",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 1,
          }}
        >
          <Ionicons name="chatbubble-outline" size={16} color={colors.accent} />
        </View>

        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 14,
              color: colors.textPrimary,
              marginBottom: 4,
            }}
            numberOfLines={2}
          >
            {enquiry.trek_interest}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <View
              style={{
                paddingHorizontal: 8,
                paddingVertical: 2,
                borderRadius: 8,
                backgroundColor: statusColor + "20",
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 11,
                  color: statusColor,
                  textTransform: "capitalize",
                }}
              >
                {enquiry.status}
              </Text>
            </View>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 12,
                color: colors.textSecondary,
              }}
            >
              {new Date(enquiry.created_at).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
