import { View, Text } from "react-native";
import { SafeArea } from "@/components/ui/SafeArea";

export default function PlanScreen() {
  return (
    <SafeArea>
      <View className="flex-1 items-center justify-center">
        <Text className="font-display text-2xl text-white mb-2">Plan My Trek</Text>
        <Text className="text-white/50 text-sm">AI wizard — coming in M08</Text>
      </View>
    </SafeArea>
  );
}
