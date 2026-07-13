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
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import {
  JetBrainsMono_400Regular,
} from "@expo-google-fonts/jetbrains-mono";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import { ThemeProvider } from "@/providers/ThemeProvider";
import { OnboardingProvider, useOnboarding } from "@/providers/OnboardingProvider";
import { initDb } from "@/db/client";
import { initBackgroundSync, destroyBackgroundSync } from "@/services/backgroundSync";
import { useOfflineStore } from "@/stores/offlineStore";
import { usePlanWizardStore } from "@/stores/planWizardStore";
import { AnimatedSplash } from "@/components/ui/AnimatedSplash";
import { AppDrawer } from "@/components/layout/AppDrawer";
import { incrementOpenCount, requestAndRegisterPushToken, saveToInbox } from "@/services/notificationService";
import * as Notifications from "expo-notifications";
import { AnalyticsProvider } from "@/providers/AnalyticsProvider";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.2,
  environment: process.env.NODE_ENV ?? "development",
  enabled: !!process.env.EXPO_PUBLIC_SENTRY_DSN,
});

SplashScreen.preventAutoHideAsync();

function AuthGate({ children }: { children: ReactNode }) {
  const { isLoading, isAuthenticated, accessToken } = useAuth();
  const { isLoading: onboardingLoading, done: onboardingDone } = useOnboarding();
  const segments = useSegments();
  const router = useRouter();
  const loadDownloaded = useOfflineStore((s) => s.loadDownloaded);
  const planAnswers = usePlanWizardStore((s) => s.answers);

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

  // Push notifications — request permission on 2nd open, listen for foreground notifs
  useEffect(() => {
    incrementOpenCount().then((count) => {
      if (count >= 2) requestAndRegisterPushToken().catch(() => {});
    });

    const sub = Notifications.addNotificationReceivedListener((notification) => {
      saveToInbox(notification).catch(() => {});
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (isLoading || onboardingLoading) return;
    const inAuthGroup = segments[0] === "(auth)";

    if (!onboardingDone) {
      if (!inAuthGroup) router.replace("/(auth)/welcome");
      return;
    }

    // Anonymous browsing is allowed for (tabs) — auth-gated screens use
    // useRequireAuth() to redirect individually (e.g. account, saved).
    if (isAuthenticated && inAuthGroup) {
      // If the user signed in while a completed plan wizard is pending, send
      // them straight to results so their answers aren't lost.
      const hasPendingPlan = planAnswers.intent.length > 0 || planAnswers.months.length > 0;
      router.replace(hasPendingPlan ? ("/(tabs)/plan/results" as never) : "/(tabs)/(home)");
    }
  }, [isLoading, isAuthenticated, segments, onboardingLoading, onboardingDone]);

  return <>{children}</>;
}

export default Sentry.wrap(function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
    JetBrainsMono_400Regular,
  });
  const [animationDone, setAnimationDone] = useState(false);
  const fontsReady = fontsLoaded || fontError;

  useEffect(() => {
    if (fontsReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsReady]);

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ThemeProvider>
        <QueryProvider>
          <OnboardingProvider>
            <AuthProvider>
              <AnalyticsProvider>
              <AuthGate>
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                  <Stack.Screen name="notifications" options={{ headerShown: false, presentation: "modal" }} />
                  <Stack.Screen name="+not-found" />
                </Stack>
                <AppDrawer />
              </AuthGate>
              </AnalyticsProvider>
            </AuthProvider>
          </OnboardingProvider>
        </QueryProvider>
        {(!animationDone || !fontsReady) && (
          <AnimatedSplash onFinish={() => setAnimationDone(true)} />
        )}
      </ThemeProvider>
    </SafeAreaProvider>
  );
});
