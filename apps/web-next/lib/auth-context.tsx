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
import { addBookmarkBySlug } from "@/lib/api";

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

  // Merge any bookmarks queued while the user was logged out
  const flushPendingBookmarks = useCallback(async () => {
    try {
      const pending = JSON.parse(
        localStorage.getItem("pendingBookmarks") ?? "[]",
      ) as string[];
      if (pending.length === 0) return;
      for (const slug of pending) {
        try {
          await addBookmarkBySlug(slug);
        } catch {
          // best-effort; skip failures
        }
      }
      localStorage.removeItem("pendingBookmarks");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("bookmark-changed"));
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setIsLoading(false));
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await loginEmail({ email, password });
    setUser(res.user);
    await flushPendingBookmarks();
  }, [flushPendingBookmarks]);

  const signup = useCallback(
    async (payload: {
      email: string;
      password: string;
      full_name?: string;
      display_name?: string;
    }) => {
      const res = await signupEmail(payload);
      setUser(res.user);
      await flushPendingBookmarks();
    },
    [flushPendingBookmarks],
  );

  const loginWithGoogle = useCallback(async (access_token: string) => {
    const res = await googleAuth(access_token);
    setUser(res.user);
    await flushPendingBookmarks();
  }, [flushPendingBookmarks]);

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
