import React from "react";
import { Text, View } from "react-native";

interface Props {
  level: 2 | 3;
  content: string;
  id?: string;
}

export function HeadingBlock({ level, content }: Props) {
  const isH2 = level === 2;
  return (
    <View className={isH2 ? "mt-6 mb-2" : "mt-4 mb-1"}>
      <Text
        className={
          isH2
            ? "text-xl font-bold text-gray-900"
            : "text-lg font-semibold text-gray-800"
        }
        accessibilityRole="header"
      >
        {content}
      </Text>
    </View>
  );
}
