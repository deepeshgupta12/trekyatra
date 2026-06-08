import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { router } from "expo-router";
import { useAuthRequest } from "expo-auth-session";
import { SafeArea } from "@/components/ui/SafeArea";
import { Button } from "@/components/ui/Button";
import { SocialSignInButtons } from "@/components/auth/SocialSignInButtons";
import { useAuth } from "@/providers/AuthProvider";
import { discovery, getGoogleAuthConfig } from "@/lib/googleAuth";
import { colors } from "@/constants/theme";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();

  const googleConfig = getGoogleAuthConfig();
  const [, googleResponse, promptGoogle] = useAuthRequest(googleConfig, discovery);

  useEffect(() => {
    if (googleResponse?.type === "success") {
      const token =
        (googleResponse.params as Record<string, string>).access_token ??
        googleResponse.authentication?.accessToken;
      if (token) {
        setSocialLoading(true);
        signInWithGoogle(token)
          .catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : "Google sign-in failed";
            Alert.alert("Error", msg);
          })
          .finally(() => setSocialLoading(false));
      }
    }
  }, [googleResponse]);

  async function handleSignIn() {
    if (!email.trim() || !password) return;
    setEmailLoading(true);
    try {
      await signIn(email.trim().toLowerCase(), password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign in failed. Check your credentials.";
      Alert.alert("Error", msg);
    } finally {
      setEmailLoading(false);
    }
  }

  const busy = emailLoading || socialLoading;

  return (
    <SafeArea>
      <View className="flex-1 px-6 justify-center">
        <Text className="font-display text-3xl text-white mb-2">Welcome back</Text>
        <Text className="text-white/50 text-base mb-10">Sign in to TrekYatra</Text>

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
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          className="bg-surface border border-white/10 rounded-xl px-4 py-3.5 text-white text-base mb-2"
          style={{ fontFamily: "Inter_400Regular" }}
        />

        <TouchableOpacity
          onPress={() => router.push("/(auth)/forgot-password")}
          className="self-end mb-6"
        >
          <Text className="text-accent text-sm">Forgot password?</Text>
        </TouchableOpacity>

        <Button
          variant="hero"
          size="md"
          onPress={handleSignIn}
          loading={emailLoading}
          disabled={!email.trim() || !password || busy}
          accessibilityLabel="Sign in"
        >
          Sign in
        </Button>

        <View className="flex-row items-center my-6">
          <View className="flex-1 h-px bg-white/10" />
          <Text className="text-white/30 text-xs mx-3">or continue with</Text>
          <View className="flex-1 h-px bg-white/10" />
        </View>

        <SocialSignInButtons
          onGoogle={() => promptGoogle()}
          loading={socialLoading}
        />

        <TouchableOpacity
          onPress={() => router.push("/(auth)/sign-up")}
          className="items-center mt-8"
          disabled={busy}
        >
          <Text className="text-white/50 text-sm">
            No account?{" "}
            <Text className="text-accent font-semibold">Create one</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </SafeArea>
  );
}
