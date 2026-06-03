import { View, Text } from "react-native";
import { router } from "expo-router";
import { SafeArea } from "@/components/ui/SafeArea";
import { Button } from "@/components/ui/Button";

export default function SignUpScreen() {
  return (
    <SafeArea>
      <View className="flex-1 px-6 justify-center">
        <Text className="font-display text-3xl text-white mb-2">Join TrekYatra</Text>
        <Text className="text-white/50 text-base mb-10">Create your account</Text>

        <Text className="text-white/40 text-sm text-center mb-6">
          Registration form — coming in M04
        </Text>

        <Button
          variant="outline"
          onPress={() => router.back()}
          accessibilityLabel="Go back"
        >
          Go back
        </Button>
      </View>
    </SafeArea>
  );
}
