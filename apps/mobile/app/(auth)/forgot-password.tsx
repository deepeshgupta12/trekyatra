import { useState } from "react";
import { View, Text, TextInput, Alert } from "react-native";
import { router } from "expo-router";
import { SafeArea } from "@/components/ui/SafeArea";
import { Button } from "@/components/ui/Button";
import { forgotPassword } from "@/lib/authApi";
import { colors } from "@/constants/theme";
import { GlassSurface } from "@/components/ui/GlassSurface";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit() {
    if (!email.trim()) return;
    setLoading(true);
    try {
      await forgotPassword(email.trim().toLowerCase());
      setSent(true);
    } catch {
      Alert.alert("Error", "Could not send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeArea>
      <View className="flex-1 px-6 justify-center">
        <Text className="font-display text-3xl text-white mb-2">Forgot password?</Text>
        <Text className="text-white/50 text-base mb-10">
          Enter your email and we'll send you a reset link.
        </Text>

        {sent ? (
          <View className="bg-pine/10 border border-pine/20 rounded-2xl p-5 mb-6">
            <Text className="text-pine text-sm text-center">
              If an account exists for that email, a reset link has been sent.
            </Text>
          </View>
        ) : (
          <>
            <GlassSurface rounded="md" style={{ marginBottom: 16 }}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Email address"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                className="text-white text-base px-4 py-3.5"
                style={{ fontFamily: "Inter_400Regular" }}
              />
            </GlassSurface>
            <Button
              variant="hero"
              size="md"
              onPress={handleSubmit}
              loading={loading}
              disabled={!email.trim()}
              accessibilityLabel="Send reset link"
            >
              Send reset link
            </Button>
          </>
        )}

        <Button
          variant="ghost"
          size="sm"
          onPress={() => router.back()}
          accessibilityLabel="Back to sign in"
        >
          ← Back to sign in
        </Button>
      </View>
    </SafeArea>
  );
}
