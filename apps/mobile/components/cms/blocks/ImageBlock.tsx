import React from "react";
import { View, Text, Image } from "react-native";

interface Props {
  url: string;
  alt: string;
  caption?: string;
}

export function ImageBlock({ url, alt, caption }: Props) {
  return (
    <View className="my-4 rounded-xl overflow-hidden">
      <Image
        source={{ uri: url }}
        accessibilityLabel={alt}
        className="w-full h-52"
        resizeMode="cover"
      />
      {caption ? (
        <Text className="text-xs text-gray-500 text-center mt-1 px-2">{caption}</Text>
      ) : null}
    </View>
  );
}
