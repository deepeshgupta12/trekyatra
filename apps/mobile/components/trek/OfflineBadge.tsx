import React from "react";
import { View, Text } from "react-native";

interface Props {
  visible: boolean;
}

export function OfflineBadge({ visible }: Props) {
  if (!visible) return null;

  return (
    <View
      className="flex-row items-center gap-1 bg-amber-100 border border-amber-300 rounded-full px-2.5 py-0.5"
      accessibilityLabel="Showing offline content"
    >
      <Text className="text-xs">📵</Text>
      <Text className="text-xs font-medium text-amber-700">Offline</Text>
    </View>
  );
}
