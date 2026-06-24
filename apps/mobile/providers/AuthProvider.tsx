import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuthStore, type AuthUser } from "@/stores/authStore";
import * as authApiLib from "@/lib/authApi";
import { signInWithApple as nativeAppleSignIn } from "@/lib/appleAuth";
import { promptBiometric } from "@/lib/biometricAuth";
import { setUserId as setAnalyticsUserId } from "@/lib/identity";

const BIOMETRIC_KEY = "biometric_enabled";

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  requiresBiometric: boolean;
  clearBiometricGate: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName?: string) => Promise<void>;
  signInWithGoogle: (googleAccessToken: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, accessToken, isLoading, isAuthenticated, setAuth, clearAuth, loadStoredToken } =
    useAuthStore();
  const [requiresBiometric, setRequiresBiometric] = useState(false);

  useEffect(() => {
    async function boot() {
      await loadStoredToken();
      const { accessToken: tok } = useAuthStore.getState();
      if (!tok) return;
      const bioPref = await AsyncStorage.getItem(BIOMETRIC_KEY);
      if (bioPref !== "true") return;
      // Token exists + biometric enabled → gate the session
      setRequiresBiometric(true);
      const passed = await promptBiometric();
      if (passed) {
        setRequiresBiometric(false);
      } else {
        setRequiresBiometric(false);
        await clearAuth();
      }
    }
    boot();
  }, []);

  async function resolveUser(result: authApiLib.MobileAuthResult): Promise<AuthUser> {
    try {
      const me = await authApiLib.getMe(result.access_token);
      return {
        id: me.id,
        email: me.email ?? null,
        fullName: me.full_name ?? null,
        isVerified: me.is_verified_email,
      };
    } catch {
      return {
        id: result.user_id,
        email: result.email ?? null,
        fullName: result.full_name ?? null,
        isVerified: false,
      };
    }
  }

  async function signIn(email: string, password: string): Promise<void> {
    const result = await authApiLib.signIn(email, password);
    const user = await resolveUser(result);
    await setAuth(result.access_token, result.refresh_token, user);
    setAnalyticsUserId(user.id);
  }

  async function signUp(email: string, password: string, fullName?: string): Promise<void> {
    const result = await authApiLib.signUp(email, password, fullName);
    const user = await resolveUser(result);
    await setAuth(result.access_token, result.refresh_token, user);
    setAnalyticsUserId(user.id);
  }

  async function signInWithGoogle(googleAccessToken: string): Promise<void> {
    const result = await authApiLib.signInWithGoogle(googleAccessToken);
    const user = await resolveUser(result);
    await setAuth(result.access_token, result.refresh_token, user);
    setAnalyticsUserId(user.id);
  }

  async function signInWithApple(): Promise<void> {
    // Apple backend endpoint coming in M04
    await nativeAppleSignIn();
    throw new Error("Apple Sign In is not yet available. Please use email or Google sign-in.");
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated,
        requiresBiometric,
        clearBiometricGate: () => setRequiresBiometric(false),
        signIn,
        signUp,
        signInWithGoogle,
        signInWithApple,
        signOut: async () => { setAnalyticsUserId(null); await clearAuth(); },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
