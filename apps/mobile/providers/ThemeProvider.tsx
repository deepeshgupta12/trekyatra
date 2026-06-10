import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useColorScheme } from "nativewind";
import AsyncStorage from "@react-native-async-storage/async-storage";

type ColorScheme = "light" | "dark" | "system";

interface ThemeContextValue {
  colorScheme: ColorScheme;
  isDark: boolean;
  setTheme: (scheme: ColorScheme) => Promise<void>;
  toggleTheme: () => Promise<void>;
}

const THEME_KEY = "trekyatra_color_scheme";

const ThemeContext = createContext<ThemeContextValue>({
  colorScheme: "system",
  isDark: false,
  setTheme: async () => {},
  toggleTheme: async () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  // NativeWind v4: setColorScheme + colorScheme come from the hook
  const { setColorScheme, colorScheme: resolvedScheme } = useColorScheme();
  const [savedScheme, setSavedScheme] = useState<ColorScheme>("system");
  const isDark = resolvedScheme === "dark";

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY)
      .then((saved) => {
        const scheme = (saved as ColorScheme | null) ?? "system";
        setSavedScheme(scheme);
        setColorScheme(scheme);
      })
      .catch(() => {});
  }, []);

  async function setTheme(scheme: ColorScheme): Promise<void> {
    setSavedScheme(scheme);
    setColorScheme(scheme);
    await AsyncStorage.setItem(THEME_KEY, scheme);
  }

  async function toggleTheme(): Promise<void> {
    const next: ColorScheme = isDark ? "light" : "dark";
    await setTheme(next);
  }

  return (
    <ThemeContext.Provider value={{ colorScheme: savedScheme, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useThemeContext(): ThemeContextValue {
  return useContext(ThemeContext);
}
