import React, { useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useOfflineStore } from "../../stores/offlineStore";
import { useAuth } from "../../hooks/useAuth";

interface DownloadedTrek {
  slug: string;
  title: string;
  heroImageUrl: string | null;
  trekState: string | null;
  syncedAt: string;
}

export default function DownloadsScreen() {
  const { accessToken } = useAuth();
  const { downloadedSlugs, loadDownloaded, remove, isLoading } = useOfflineStore();

  useEffect(() => {
    loadDownloaded();
  }, []);

  async function handleDelete(slug: string) {
    await remove(slug);
  }

  if (isLoading && downloadedSlugs.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#f97316" />
      </SafeAreaView>
    );
  }

  if (downloadedSlugs.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="px-4 pt-6 pb-3">
          <Text className="text-2xl font-bold text-gray-900">Offline Content</Text>
          <Text className="text-sm text-gray-500 mt-1">Trek guides saved to your device</Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-4xl mb-4">📥</Text>
          <Text className="text-base font-semibold text-gray-700 text-center mb-2">
            No offline content yet
          </Text>
          <Text className="text-sm text-gray-400 text-center">
            Download trek guides before heading into the mountains where signal is limited.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="px-4 pt-6 pb-3">
        <Text className="text-2xl font-bold text-gray-900">Offline Content</Text>
        <Text className="text-sm text-gray-500 mt-1">
          {downloadedSlugs.length} trek{downloadedSlugs.length !== 1 ? "s" : ""} downloaded
        </Text>
      </View>

      <FlatList
        data={downloadedSlugs}
        keyExtractor={(item) => item}
        contentContainerClassName="px-4 gap-3 pb-8"
        renderItem={({ item: slug }) => (
          <View
            className="bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden"
            testID={`download-item-${slug}`}
          >
            <View className="flex-row items-center gap-3 p-3">
              <View className="w-14 h-14 rounded-xl bg-gray-200 overflow-hidden">
                {/* Hero image placeholder — populated in M05 when trek detail screen exists */}
                <View className="w-full h-full items-center justify-center">
                  <Text className="text-2xl">🏔️</Text>
                </View>
              </View>
              <View className="flex-1">
                <Text
                  className="text-sm font-semibold text-gray-800"
                  numberOfLines={1}
                >
                  {slug
                    .split("-")
                    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                    .join(" ")}
                </Text>
                <View className="flex-row gap-3 mt-1">
                  {(["Guide", "Packing", "Permits", "Costs"] as const).map((label) => (
                    <Text key={label} className="text-xs text-green-600">
                      ✓ {label}
                    </Text>
                  ))}
                </View>
              </View>
              <TouchableOpacity
                onPress={() => handleDelete(slug)}
                accessibilityRole="button"
                accessibilityLabel={`Remove ${slug} download`}
                className="p-2"
                activeOpacity={0.7}
              >
                <Text className="text-red-400 text-lg">🗑</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ListEmptyComponent={null}
      />
    </SafeAreaView>
  );
}
