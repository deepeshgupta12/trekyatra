import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { SafeArea } from "@/components/ui/SafeArea";
import { useTheme } from "@/hooks/useTheme";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/mobileApi";
import { EnquiryCard, type Enquiry } from "@/components/account/EnquiryCard";
import { FlatList } from "react-native";

export default function EnquiriesScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const { data: enquiries, isLoading } = useQuery<Enquiry[]>({
    queryKey: ["account", "enquiries"],
    queryFn: () => apiGet<Enquiry[]>("/api/v1/auth/me/leads"),
    staleTime: 120_000,
  });

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
          Enquiries
        </Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : !enquiries || enquiries.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
          }}
        >
          <Ionicons name="chatbubble-outline" size={48} color={colors.textMuted} style={{ marginBottom: 16 }} />
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 16,
              color: colors.textPrimary,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            No enquiries yet
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: colors.textSecondary,
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            When you ask a trek operator for help, your enquiries will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={enquiries}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <EnquiryCard enquiry={item} />}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeArea>
  );
}
