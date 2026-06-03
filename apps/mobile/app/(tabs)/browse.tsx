import { View, Text } from "react-native";
import { SafeArea } from "@/components/ui/SafeArea";

export default function BrowseScreen() {
  return (
    <SafeArea>
      <View className="flex-1 items-center justify-center">
        <Text className="font-display text-2xl text-white mb-2">Browse</Text>
        <Text className="text-white/50 text-sm">Trek explorer — coming in M03</Text>
      </View>
    </SafeArea>
  );
}
