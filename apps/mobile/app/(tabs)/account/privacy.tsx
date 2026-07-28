import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator, Linking } from "react-native";
import { SafeArea } from "@/components/ui/SafeArea";
import { useTheme } from "@/hooks/useTheme";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { authMeApi } from "@/lib/mobileApi";
import { useAuth } from "@/hooks/useAuth";

export default function PrivacyScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { signOut } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const url = authMeApi.getDataExportUrl();
      await Linking.openURL(url);
    } catch {
      Alert.alert("Error", "Could not export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  function handleDelete() {
    Alert.alert(
      "Delete my data",
      "This will permanently delete your analytics data and personal activity logs from TrekYatra. Your account will remain active.\n\nThis action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete my data",
          style: "destructive",
          onPress: async () => {
            setIsDeleting(true);
            try {
              await authMeApi.deleteMyData();
              Alert.alert(
                "Data deleted",
                "Your personal activity data has been deleted from TrekYatra.",
                [{ text: "OK" }]
              );
            } catch {
              Alert.alert("Error", "Could not delete data. Please contact explore@trekyatra.co.in.");
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
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
        <Text
          style={{
            fontFamily: "PlayfairDisplay_700Bold",
            fontSize: 22,
            color: colors.textPrimary,
          }}
        >
          Privacy & Data
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        {/* Info card */}
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 18,
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              fontFamily: "PlayfairDisplay_700Bold",
              fontSize: 16,
              color: colors.textPrimary,
              marginBottom: 8,
            }}
          >
            Your data on TrekYatra
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 13,
              color: colors.textSecondary,
              lineHeight: 20,
              marginBottom: 10,
            }}
          >
            Under the Digital Personal Data Protection Act 2023 (DPDP), you have the right to
            access and erase your personal data that TrekYatra has collected.
          </Text>
          <TouchableOpacity
            onPress={() => Linking.openURL("https://www.trekyatra.co.in/privacy")}
            accessibilityRole="link"
            accessibilityLabel="View Privacy Policy"
          >
            <Text
              style={{
                fontFamily: "Inter_500Medium",
                fontSize: 13,
                color: colors.accent,
              }}
            >
              View our Privacy Policy →
            </Text>
          </TouchableOpacity>
        </View>

        {/* Export */}
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
          Data access
        </Text>
        <TouchableOpacity
          onPress={handleExport}
          disabled={isExporting}
          accessibilityRole="button"
          accessibilityLabel="Export my data"
          activeOpacity={0.8}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            backgroundColor: colors.surface,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: colors.border,
            padding: 16,
            marginBottom: 24,
          }}
        >
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: colors.accent + "15",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <Ionicons name="cloud-download-outline" size={20} color={colors.accent} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 15,
                color: colors.textPrimary,
                marginBottom: 3,
              }}
            >
              Export my data
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 12,
                color: colors.textSecondary,
              }}
            >
              Download a JSON file with all your TrekYatra data
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        {/* Delete */}
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
          Data erasure
        </Text>
        <TouchableOpacity
          onPress={handleDelete}
          disabled={isDeleting}
          accessibilityRole="button"
          accessibilityLabel="Delete my data"
          activeOpacity={0.8}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 14,
            backgroundColor: "#ef444408",
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#ef444430",
            padding: 16,
          }}
        >
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              backgroundColor: "#ef444420",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <Ionicons name="trash-outline" size={20} color="#ef4444" />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 15,
                color: "#ef4444",
                marginBottom: 3,
              }}
            >
              Delete my data
            </Text>
            <Text
              style={{
                fontFamily: "Inter_400Regular",
                fontSize: 12,
                color: colors.textSecondary,
              }}
            >
              Permanently erase your analytics and activity logs (DPDP right to erasure)
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#ef444480" />
        </TouchableOpacity>
      </ScrollView>
    </SafeArea>
  );
}
