import { useColorScheme } from "nativewind";
import { useThemeContext } from "@/providers/ThemeProvider";
import { lightColors, darkColors, type ThemeColors } from "@/constants/theme";

interface UseThemeResult {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => Promise<void>;
  setTheme: (scheme: "light" | "dark" | "system") => Promise<void>;
  colorScheme: "light" | "dark" | "system";
}

export function useTheme(): UseThemeResult {
  // NativeWind v4: colorScheme is the resolved OS/override scheme
  const { colorScheme: resolvedScheme } = useColorScheme();
  const { colorScheme, toggleTheme, setTheme } = useThemeContext();
  const activeColors: ThemeColors = resolvedScheme === "dark" ? darkColors : lightColors;

  return {
    isDark: resolvedScheme === "dark",
    colors: activeColors,
    toggleTheme,
    setTheme,
    colorScheme,
  };
}
