import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { SafeArea } from "@/components/ui/SafeArea";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/providers/AuthProvider";
import { colors } from "@/constants/theme";

export default function SignUpScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();

  async function handleSignUp() {
    if (!email.trim() || !password) return;
    if (password.length < 8) {
      Alert.alert("Error", "Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await signUp(email.trim().toLowerCase(), password, fullName.trim() || undefined);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign up failed. Please try again.";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeArea>
      <View className="flex-1 px-6 justify-center">
        <Text className="font-display text-3xl text-white mb-2">Join TrekYatra</Text>
        <Text className="text-white/50 text-base mb-10">Create your account</Text>

        <TextInput
          value={fullName}
          onChangeText={setFullName}
          placeholder="Full name (optional)"
          placeholderTextColor={colors.textMuted}
          autoCapitalize="words"
          autoComplete="name"
          className="bg-surface border border-white/10 rounded-xl px-4 py-3.5 text-white text-base mb-3"
          style={{ fontFamily: "Inter_400Regular" }}
        />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email address"
          placeholderTextColor={colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          className="bg-surface border border-white/10 rounded-xl px-4 py-3.5 text-white text-base mb-3"
          style={{ fontFamily: "Inter_400Regular" }}
        />
        <TextInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password (min 8 characters)"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          autoComplete="new-password"
          className="bg-surface border border-white/10 rounded-xl px-4 py-3.5 text-white text-base mb-6"
          style={{ fontFamily: "Inter_400Regular" }}
        />

        <Button
          variant="hero"
          size="md"
          onPress={handleSignUp}
          loading={loading}
          disabled={!email.trim() || !password || loading}
          accessibilityLabel="Create account"
        >
          Create account
        </Button>

        <TouchableOpacity
          onPress={() => router.push("/(auth)/sign-in")}
          className="items-center mt-8"
          disabled={loading}
        >
          <Text className="text-white/50 text-sm">
            Already have an account?{" "}
            <Text className="text-accent font-semibold">Sign in</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeArea>
  );
}
