import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useAuthStore, type AuthUser } from "@/stores/authStore";

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { user, accessToken, isLoading, isAuthenticated, clearAuth, loadStoredToken } =
    useAuthStore();

  useEffect(() => {
    loadStoredToken();
  }, [loadStoredToken]);

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        isAuthenticated,
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
