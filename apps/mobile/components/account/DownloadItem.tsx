import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import type { DownloadResponse } from "@/lib/mobileApi";

interface DownloadItemProps {
  item: DownloadResponse;
  onDownload: (orderId: string) => Promise<void>;
  isDownloading: boolean;
}

export function DownloadItem({ item, onDownload, isDownloading }: DownloadItemProps) {
  const { colors } = useTheme();

  const productName = item.filename.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: 12,
        backgroundColor: colors.surface,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
        marginHorizontal: 20,
        marginBottom: 10,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 10,
          backgroundColor: colors.accent + "15",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Ionicons name="document-text-outline" size={20} color={colors.accent} />
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontFamily: "Inter_600SemiBold",
            fontSize: 14,
            color: colors.textPrimary,
            marginBottom: 3,
            textTransform: "capitalize",
          }}
          numberOfLines={2}
        >
          {productName}
        </Text>
        <Text
          style={{
            fontFamily: "Inter_400Regular",
            fontSize: 12,
            color: colors.textSecondary,
          }}
        >
          {new Date(item.downloaded_at).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => item.order_id && onDownload(item.order_id)}
        disabled={isDownloading || !item.order_id}
        accessibilityRole="button"
        accessibilityLabel={`Download ${productName}`}
        activeOpacity={0.7}
        style={{
          paddingHorizontal: 14,
          paddingVertical: 8,
          borderRadius: 20,
          backgroundColor: isDownloading ? colors.surface : colors.accent,
          borderWidth: 1,
          borderColor: colors.accent,
          opacity: !item.order_id ? 0.4 : 1,
        }}
      >
        {isDownloading ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <Text
            style={{
              fontFamily: "Inter_600SemiBold",
              fontSize: 13,
              color: isDownloading ? colors.accent : "#fff",
            }}
          >
            Download
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
}
