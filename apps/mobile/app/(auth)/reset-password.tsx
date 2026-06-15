import { useState } from "react";
import { View, Text, TextInput, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { SafeArea } from "@/components/ui/SafeArea";
import { Button } from "@/components/ui/Button";
import { resetPassword } from "@/lib/authApi";
import { colors } from "@/constants/theme";
import { GlassSurface } from "@/components/ui/GlassSurface";

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (!token) {
      Alert.alert("Error", "Invalid reset link.");
      return;
    }
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      Alert.alert("Error", "Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(token, password);
      Alert.alert("Success", "Password updated. Please sign in.", [
        { text: "OK", onPress: () => router.replace("/(auth)/sign-in") },
      ]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Reset failed";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeArea>
      <View className="flex-1 px-6 justify-center">
        <Text className="font-display text-3xl text-white mb-2">New password</Text>
        <Text className="text-white/50 text-base mb-10">Choose a strong password.</Text>

        <GlassSurface rounded="md" style={{ marginBottom: 12 }}>
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="New password (min 8 chars)"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            className="text-white text-base px-4 py-3.5"
            style={{ fontFamily: "Inter_400Regular" }}
          />
        </GlassSurface>
        <GlassSurface rounded="md" style={{ marginBottom: 24 }}>
          <TextInput
            value={confirm}
            onChangeText={setConfirm}
            placeholder="Confirm password"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            className="text-white text-base px-4 py-3.5"
            style={{ fontFamily: "Inter_400Regular" }}
          />
        </GlassSurface>

        <Button
          variant="hero"
          size="md"
          onPress={handleReset}
          loading={loading}
          disabled={!password || !confirm}
          accessibilityLabel="Update password"
        >
          Update password
        </Button>
      </View>
    </SafeArea>
  );
}
