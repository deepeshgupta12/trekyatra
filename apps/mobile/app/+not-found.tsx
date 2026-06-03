import { View, Text } from "react-native";
import { Link, Stack } from "expo-router";
import { SafeArea } from "@/components/ui/SafeArea";

export default function NotFoundScreen() {
  return (
    <SafeArea>
      <Stack.Screen options={{ title: "Not Found" }} />
      <View className="flex-1 items-center justify-center px-6">
        <Text className="font-display text-4xl text-white mb-3">404</Text>
        <Text className="text-white/70 text-base mb-8 text-center">
          This screen doesn&apos;t exist.
        </Text>
        <Link href="/" className="text-accent text-base font-medium">
          Go home
        </Link>
      </View>
    </SafeArea>
  );
}
