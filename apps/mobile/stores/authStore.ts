import { create } from "zustand";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "trekyatra_access_token";
const REFRESH_KEY = "trekyatra_refresh_token";

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  isVerified: boolean;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setTokens: (accessToken: string, refreshToken: string) => Promise<void>;
  setUser: (user: AuthUser) => void;
  clearAuth: () => Promise<void>;
  loadStoredToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  accessToken: null,
  isLoading: true,
  isAuthenticated: false,

  setTokens: async (accessToken, refreshToken) => {
    await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
    set({ accessToken, isAuthenticated: true });
  },

  setUser: (user) => set({ user }),

  clearAuth: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  loadStoredToken: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      set({ accessToken: token, isAuthenticated: !!token, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
}));
