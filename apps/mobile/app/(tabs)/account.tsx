import { View, Text } from "react-native";
import { SafeArea } from "@/components/ui/SafeArea";

export default function AccountScreen() {
  return (
    <SafeArea>
      <View className="flex-1 items-center justify-center">
        <Text className="font-display text-2xl text-white mb-2">Account</Text>
        <Text className="text-white/50 text-sm">Profile & settings — coming in M05</Text>
      </View>
    </SafeArea>
  );
}
