import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert, Linking } from "react-native";
import { SafeArea } from "@/components/ui/SafeArea";
import { DownloadItem } from "@/components/account/DownloadItem";
import { useDownloads } from "@/hooks/useAccount";
import { useTheme } from "@/hooks/useTheme";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";

export default function DownloadsScreen() {
  const { downloads, isLoading, refetch } = useDownloads();
  const { colors } = useTheme();
  const router = useRouter();
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  async function handleDownload(orderId: string) {
    setDownloadingId(orderId);
    try {
      const res = await import("@/lib/mobileApi").then((m) =>
        m.accountApi.getDownloadUrl(orderId)
      );
      if (res.download_url) {
        await Linking.openURL(res.download_url);
      } else {
        Alert.alert("Error", "Download link not available. Contact support.");
      }
    } catch {
      Alert.alert("Error", "Could not get download link. Please try again.");
    } finally {
      setDownloadingId(null);
    }
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
          Downloads
        </Text>
      </View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : downloads.length === 0 ? (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingHorizontal: 32,
          }}
        >
          <Ionicons name="download-outline" size={48} color={colors.textMuted} style={{ marginBottom: 16 }} />
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 16,
              color: colors.textPrimary,
              textAlign: "center",
              marginBottom: 8,
            }}
          >
            No purchases yet
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
            Purchase trek packs and guides to download them here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={downloads}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <DownloadItem
              item={item}
              onDownload={handleDownload}
              isDownloading={downloadingId === item.order_id}
            />
          )}
          refreshing={isLoading}
          onRefresh={refetch}
          contentContainerStyle={{ paddingTop: 4, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeArea>
  );
}
