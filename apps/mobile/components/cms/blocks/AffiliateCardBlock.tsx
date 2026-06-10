import React from "react";
import { View, Text, Image, TouchableOpacity, Linking } from "react-native";

interface Props {
  product_name: string;
  price: string;
  url: string;
  image: string;
}

export function AffiliateCardBlock({ product_name, price, url, image }: Props) {
  return (
    <View className="my-4 flex-row bg-white rounded-xl border border-gray-200 overflow-hidden">
      <Image
        source={{ uri: image }}
        className="w-20 h-20"
        resizeMode="cover"
        accessibilityLabel={product_name}
      />
      <View className="flex-1 p-3 justify-between">
        <Text className="text-sm font-medium text-gray-800" numberOfLines={2}>
          {product_name}
        </Text>
        <View className="flex-row items-center justify-between mt-1">
          <Text className="text-sm font-bold text-green-700">{price}</Text>
          <TouchableOpacity
            onPress={() => Linking.openURL(url)}
            accessibilityRole="link"
            accessibilityLabel={`Buy ${product_name}`}
            className="bg-orange-500 rounded-lg px-3 py-1.5"
            activeOpacity={0.8}
          >
            <Text className="text-white text-xs font-semibold">View →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
