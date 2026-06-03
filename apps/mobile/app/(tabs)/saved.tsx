import { View, Text } from "react-native";
import { SafeArea } from "@/components/ui/SafeArea";

export default function SavedScreen() {
  return (
    <SafeArea>
      <View className="flex-1 items-center justify-center">
        <Text className="font-display text-2xl text-white mb-2">Saved</Text>
        <Text className="text-white/50 text-sm">Saved treks — coming in M06</Text>
      </View>
    </SafeArea>
  );
}
