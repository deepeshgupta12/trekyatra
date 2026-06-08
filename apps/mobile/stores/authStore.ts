import { create } from "zustand";
import { saveTokens, loadTokens, clearTokens } from "@/lib/authStorage";

export interface AuthUser {
  id: string;
  email: string | null;
  fullName: string | null;
  isVerified: boolean;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setAuth: (accessToken: string, refreshToken: string, user: AuthUser) => Promise<void>;
  setUser: (user: AuthUser) => void;
  setLoading: (loading: boolean) => void;
  clearAuth: () => Promise<void>;
  loadStoredToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isLoading: true,
  isAuthenticated: false,

  setAuth: async (accessToken, refreshToken, user) => {
    await saveTokens(accessToken, refreshToken);
    set({ accessToken, refreshToken, user, isAuthenticated: true, isLoading: false });
  },

  setUser: (user) => set({ user }),

  setLoading: (loading) => set({ isLoading: loading }),

  clearAuth: async () => {
    await clearTokens();
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },

  loadStoredToken: async () => {
    try {
      const { access, refresh } = await loadTokens();
      set({ accessToken: access, refreshToken: refresh, isAuthenticated: !!access, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
}));
