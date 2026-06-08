import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useAuthStore, type AuthUser } from "@/stores/authStore";
import * as authApiLib from "@/lib/authApi";
import { signInWithApple as nativeAppleSignIn } from "@/lib/appleAuth";

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
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

  useEffect(() => {
    loadStoredToken();
  }, [loadStoredToken]);

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
  }

  async function signUp(email: string, password: string, fullName?: string): Promise<void> {
    const result = await authApiLib.signUp(email, password, fullName);
    const user = await resolveUser(result);
    await setAuth(result.access_token, result.refresh_token, user);
  }

  async function signInWithGoogle(googleAccessToken: string): Promise<void> {
    const result = await authApiLib.signInWithGoogle(googleAccessToken);
    const user = await resolveUser(result);
    await setAuth(result.access_token, result.refresh_token, user);
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
        signIn,
        signUp,
        signInWithGoogle,
        signInWithApple,
        signOut: clearAuth,
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
