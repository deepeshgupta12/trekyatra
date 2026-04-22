"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  getCurrentUser,
  googleAuth,
  loginEmail,
  logoutApi,
  signupEmail,
  type UserResponse,
} from "@/lib/auth-api";

type AuthContextValue = {
  user: UserResponse | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (payload: {
    email: string;
    password: string;
    full_name?: string;
    display_name?: string;
  }) => Promise<void>;
  loginWithGoogle: (access_token: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    const current = await getCurrentUser();
    setUser(current);
  }, []);

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await loginEmail({ email, password });
    setUser(res.user);
  }, []);

  const signup = useCallback(
    async (payload: {
      email: string;
      password: string;
      full_name?: string;
      display_name?: string;
    }) => {
      const res = await signupEmail(payload);
      setUser(res.user);
    },
    []
  );

  const loginWithGoogle = useCallback(async (access_token: string) => {
    const res = await googleAuth(access_token);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    await logoutApi();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, loginWithGoogle, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
