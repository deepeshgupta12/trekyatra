import { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, ScrollView, StatusBar } from "react-native";
import { router } from "expo-router";
import { useAuthRequest } from "expo-auth-session";
import { SafeArea } from "@/components/ui/SafeArea";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { SocialSignInButtons } from "@/components/auth/SocialSignInButtons";
import { useAuth } from "@/providers/AuthProvider";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { discovery, getGoogleAuthConfig, GOOGLE_CLIENT_ID, googleRedirectUri, exchangeCodeAsync } from "@/lib/googleAuth";
import { useTheme } from "@/hooks/useTheme";
import { GlassSurface } from "@/components/ui/GlassSurface";

export default function SignInScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();
  const { markDone } = useOnboarding();
  const { isDark, colors } = useTheme();

  const googleConfig = getGoogleAuthConfig();
  const [googleRequest, googleResponse, promptGoogle] = useAuthRequest(googleConfig, discovery);

  useEffect(() => {
    if (googleResponse?.type !== "success") return;
    const code = (googleResponse.params as Record<string, string>).code;
    const codeVerifier = googleRequest?.codeVerifier;
    if (!code || !codeVerifier) return;

    setSocialLoading(true);
    exchangeCodeAsync(
      {
        clientId: GOOGLE_CLIENT_ID,
        code,
        redirectUri: googleRedirectUri,
        extraParams: { code_verifier: codeVerifier },
      },
      discovery
    )
      .then((tokenResponse) => signInWithGoogle(tokenResponse.accessToken))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : "Google sign-in failed";
        Alert.alert("Error", msg);
      })
      .finally(() => setSocialLoading(false));
  }, [googleResponse, googleRequest]);

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

  async function handleSkip() {
    await markDone();
    router.replace("/(tabs)/(home)");
  }

  function handleAppleComingSoon() {
    Alert.alert(
      "Coming soon",
      "Apple Sign-In will be available in a future update. Please use email or Google sign-in."
    );
  }

  const busy = emailLoading || socialLoading;

  const inputText = isDark ? "#ffffff" : colors.pine;
  const placeholderColor = isDark ? "rgba(255,255,255,0.35)" : "rgba(29,58,46,0.35)";
  const dividerColor = isDark ? "rgba(255,255,255,0.10)" : "rgba(29,58,46,0.12)";
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
            accessibilityLabel="Skip sign in"
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
            Welcome back
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 15,
              color: mutedText,
              marginBottom: 32,
            }}
          >
            Sign in to TrekYatra
          </Text>

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
          <GlassSurface rounded="md" style={{ marginBottom: 8 }}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="Password"
              placeholderTextColor={placeholderColor}
              secureTextEntry
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

          <TouchableOpacity
            onPress={() => router.push("/(auth)/forgot-password")}
            style={{ alignSelf: "flex-end", marginBottom: 24 }}
          >
            <Text
              style={{
                color: "#E8702A",
                fontFamily: "Inter_500Medium",
                fontSize: 13,
              }}
            >
              Forgot password?
            </Text>
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

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginVertical: 24,
            }}
          >
            <View style={{ flex: 1, height: 1, backgroundColor: dividerColor }} />
            <Text
              style={{
                color: mutedText,
                fontSize: 12,
                fontFamily: "Inter_400Regular",
                marginHorizontal: 12,
              }}
            >
              or continue with
            </Text>
            <View style={{ flex: 1, height: 1, backgroundColor: dividerColor }} />
          </View>

          <SocialSignInButtons
            onGoogle={() => promptGoogle()}
            onApple={handleAppleComingSoon}
            loading={socialLoading}
          />

          <TouchableOpacity
            onPress={() => router.push("/(auth)/sign-up")}
            style={{ alignItems: "center", marginTop: 32 }}
            disabled={busy}
          >
            <Text
              style={{
                color: mutedText,
                fontFamily: "Inter_400Regular",
                fontSize: 14,
              }}
            >
              No account?{" "}
              <Text style={{ color: "#E8702A", fontFamily: "Inter_600SemiBold" }}>
                Create one
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeArea>
  );
}
