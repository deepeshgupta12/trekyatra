import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useOfflineStore } from "../../stores/offlineStore";
import { useAuth } from "../../hooks/useAuth";

interface Props {
  slug: string;
  testID?: string;
}

export function OfflineToggle({ slug, testID }: Props) {
  const { accessToken } = useAuth();
  const { isDownloaded, download, remove } = useOfflineStore();
  const [busy, setBusy] = useState(false);
  const downloaded = isDownloaded(slug);

  async function handleToggle() {
    if (!accessToken || busy) return;
    setBusy(true);
    try {
      if (downloaded) {
        await remove(slug);
      } else {
        await download(slug, accessToken);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <TouchableOpacity
      onPress={handleToggle}
      accessibilityRole="button"
      accessibilityLabel={downloaded ? "Remove offline download" : "Download for offline"}
      accessibilityState={{ checked: downloaded }}
      testID={testID ?? "offline-toggle"}
      activeOpacity={0.7}
      className={`flex-row items-center gap-1.5 rounded-full px-3.5 py-2 border ${
        downloaded
          ? "bg-green-50 border-green-300"
          : "bg-white border-gray-200"
      }`}
    >
      {busy ? (
        <ActivityIndicator size="small" color={downloaded ? "#16a34a" : "#6b7280"} />
      ) : (
        <Text className="text-base">{downloaded ? "✓" : "⬇"}</Text>
      )}
      <Text
        className={`text-xs font-medium ${downloaded ? "text-green-700" : "text-gray-600"}`}
      >
        {downloaded ? "Saved offline" : "Download"}
      </Text>
    </TouchableOpacity>
  );
}
