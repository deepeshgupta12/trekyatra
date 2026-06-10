// Light mode — TrekYatra brand identity
export const lightColors = {
  background: "#FAF5EE",      // Paper — page backgrounds
  surface: "#FFFFFF",          // White cards
  surfaceAlt: "#EBF2F2",      // Mist — subtle card backgrounds
  border: "rgba(0,0,0,0.08)",
  borderSubtle: "rgba(0,0,0,0.05)",
  pine: "#1D3A2E",            // Primary text + headings
  saffron: "#E8702A",         // CTAs + active states + FAB
  sky: "#5298C9",             // Links + info badges
  earth: "#6B4929",           // Secondary text + captions
  mist: "#EBF2F2",            // Borders + dividers
  paper: "#FAF5EE",           // Page background
  textPrimary: "#1D3A2E",
  textSecondary: "rgba(29,58,46,0.70)",
  textMuted: "rgba(29,58,46,0.45)",
  textFaint: "rgba(29,58,46,0.25)",
  accent: "#E8702A",          // Saffron — shared with dark mode
  accentGlow: "#F0934D",
  tabBar: "#FFFFFF",
  tabBarBorder: "rgba(0,0,0,0.08)",
} as const;

// Dark mode — existing dark palette
export const darkColors = {
  background: "#0c0e14",
  surface: "#14161f",
  surfaceAlt: "#1a1d28",
  sidebar: "#0f1117",
  border: "rgba(255,255,255,0.10)",
  borderSubtle: "rgba(255,255,255,0.08)",
  pine: "#1D3A2E",
  saffron: "#E8702A",
  sky: "#5298C9",
  earth: "#6B4929",
  mist: "#EBF2F2",
  paper: "#FAF5EE",
  textPrimary: "#ffffff",
  textSecondary: "rgba(255,255,255,0.70)",
  textMuted: "rgba(255,255,255,0.40)",
  textFaint: "rgba(255,255,255,0.25)",
  accent: "#E8702A",          // Saffron — same in both modes
  accentGlow: "#F0934D",
  tabBar: "#0f1117",
  tabBarBorder: "rgba(255,255,255,0.10)",
} as const;

// Backward-compat alias used by components not yet migrated to useTheme()
export const colors = darkColors;

export type LightColors = typeof lightColors;
export type DarkColors = typeof darkColors;
export type ThemeColors = LightColors | DarkColors;

export const fonts = {
  display: "PlayfairDisplay_600SemiBold",
  body: "Inter_400Regular",
  bodyMed: "Inter_500Medium",
  bodySemi: "Inter_600SemiBold",
  mono: "JetBrainsMono_400Regular",
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  "2xl": 24,
  "3xl": 32,
  "4xl": 40,
  "5xl": 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
} as const;

export type ColorKey = keyof typeof darkColors;
export type SpacingKey = keyof typeof spacing;
