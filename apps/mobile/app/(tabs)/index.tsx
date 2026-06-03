import { View, Text } from "react-native";
import { SafeArea } from "@/components/ui/SafeArea";

export default function HomeScreen() {
  return (
    <SafeArea>
      <View className="flex-1 items-center justify-center">
        <Text className="font-display text-2xl text-white mb-2">TrekYatra</Text>
        <Text className="text-white/50 text-sm">Home — coming in M02</Text>
      </View>
    </SafeArea>
  );
}
