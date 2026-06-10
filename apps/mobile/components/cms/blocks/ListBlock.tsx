import React from "react";
import { View, Text } from "react-native";

interface Props {
  ordered: boolean;
  items: string[];
}

export function ListBlock({ ordered, items }: Props) {
  return (
    <View className="mb-4 gap-1.5">
      {items.map((item, i) => (
        <View key={i} className="flex-row gap-2">
          <Text className="text-gray-500 text-base w-5 text-right">
            {ordered ? `${i + 1}.` : "•"}
          </Text>
          <Text className="text-base text-gray-800 flex-1 leading-relaxed">{item}</Text>
        </View>
      ))}
    </View>
  );
}
