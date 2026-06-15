import { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StatusBar } from "react-native";
import { router } from "expo-router";
import { SafeArea } from "@/components/ui/SafeArea";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/providers/AuthProvider";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useTheme } from "@/hooks/useTheme";
import { GlassSurface } from "@/components/ui/GlassSurface";

export default function SignUpScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const { markDone } = useOnboarding();
  const { isDark, colors } = useTheme();

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

  async function handleSkip() {
    await markDone();
    router.replace("/(tabs)/(home)");
  }

  const inputText = isDark ? "#ffffff" : colors.pine;
  const placeholderColor = isDark ? "rgba(255,255,255,0.35)" : "rgba(29,58,46,0.35)";
  const mutedText = isDark ? "rgba(255,255,255,0.50)" : "rgba(29,58,46,0.50)";

  return (
    <SafeArea>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={{ flex: 1, paddingHorizontal: 24, justifyContent: "center", paddingVertical: 40 }}>
          {/* Skip — continue as guest */}
          <TouchableOpacity
            onPress={handleSkip}
            accessibilityLabel="Skip sign up"
            accessibilityRole="button"
            style={{ position: "absolute", top: 8, right: 24, zIndex: 1 }}
          >
            <Text style={{ color: mutedText, fontFamily: "Inter_500Medium", fontSize: 14 }}>
              Skip
            </Text>
          </TouchableOpacity>

          {/* Logo */}
          <View style={{ marginBottom: 36 }}>
            <Logo size="md" />
          </View>

          <Text
            style={{
              fontFamily: "PlayfairDisplay_600SemiBold",
              fontSize: 28,
              color: isDark ? "#ffffff" : colors.pine,
              marginBottom: 6,
            }}
          >
            Join TrekYatra
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 15,
              color: mutedText,
              marginBottom: 32,
            }}
          >
            Create your account
          </Text>

          <GlassSurface rounded="md" style={{ marginBottom: 12 }}>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full name (optional)"
              placeholderTextColor={placeholderColor}
              autoCapitalize="words"
              autoComplete="name"
              accessibilityLabel="Full name"
              style={{
                paddingHorizontal: 16,
                paddingVertical: 14,
                color: inputText,
                fontSize: 15,
                fontFamily: "Inter_400Regular",
              }}
            />
          </GlassSurface>
          <GlassSurface rounded="md" style={{ marginBottom: 12 }}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor={placeholderColor}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              accessibilityLabel="Email address"
              style={{
                paddingHorizontal: 16,
                paddingVertical: 14,
                color: inputText,
                fontSize: 15,
                fontFamily: "Inter_400Regular",
              }}
            />
          </GlassSurface>
          <GlassSurface rounded="md" style={{ marginBottom: 28 }}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password (min 8 characters)"
              placeholderTextColor={placeholderColor}
              secureTextEntry
              autoComplete="new-password"
              accessibilityLabel="Password"
              style={{
                paddingHorizontal: 16,
                paddingVertical: 14,
                color: inputText,
                fontSize: 15,
                fontFamily: "Inter_400Regular",
              }}
            />
          </GlassSurface>

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
            style={{ alignItems: "center", marginTop: 28 }}
            disabled={loading}
          >
            <Text
              style={{
                color: mutedText,
                fontFamily: "Inter_400Regular",
                fontSize: 14,
              }}
            >
              Already have an account?{" "}
              <Text style={{ color: "#E8702A", fontFamily: "Inter_600SemiBold" }}>
                Sign in
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeArea>
  );
}
