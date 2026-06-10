import "../global.css";
import { useEffect, useState, useCallback, type ReactNode } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import * as Sentry from "@sentry/react-native";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import {
  PlayfairDisplay_600SemiBold,
} from "@expo-google-fonts/playfair-display";
import {
  JetBrainsMono_400Regular,
} from "@expo-google-fonts/jetbrains-mono";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { initDb } from "@/db/client";
import { initBackgroundSync, destroyBackgroundSync } from "@/services/backgroundSync";
import { useOfflineStore } from "@/stores/offlineStore";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  environment: process.env.NODE_ENV ?? "development",
  enabled: !!process.env.EXPO_PUBLIC_SENTRY_DSN,
});

SplashScreen.preventAutoHideAsync();

const ONBOARDING_KEY = "trekyatra_onboarding_done";

function AuthGate({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, accessToken } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [onboardingChecked, setOnboardingChecked] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(false);
  const loadDownloaded = useOfflineStore((s) => s.loadDownloaded);

  // Initialise SQLite DB on first mount
  useEffect(() => {
    initDb().catch(console.error);
  }, []);

  // Wire background sync once auth token is available
  useEffect(() => {
    initBackgroundSync(() => accessToken);
    return () => destroyBackgroundSync();
  }, [accessToken]);

  // Load downloaded slugs into Zustand store on mount
  useEffect(() => {
    loadDownloaded().catch(console.error);
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setOnboardingDone(!!val);
      setOnboardingChecked(true);
    });
  }, []);

  useEffect(() => {
    if (isLoading || !onboardingChecked) return;
    const inAuthGroup = segments[0] === "(auth)";

    if (!onboardingDone) {
      if (!inAuthGroup) router.replace("/(auth)/welcome");
      return;
    }

    if (!isAuthenticated && !inAuthGroup) {
      router.replace("/(auth)/sign-in");
    } else if (isAuthenticated && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [isLoading, isAuthenticated, segments, onboardingChecked, onboardingDone]);

  return <>{children}</>;
}

export default Sentry.wrap(function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    PlayfairDisplay_600SemiBold,
    JetBrainsMono_400Regular,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <QueryProvider>
      <AuthProvider>
        <AuthGate>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </AuthGate>
      </AuthProvider>
    </QueryProvider>
  );
});
