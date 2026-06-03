export const colors = {
  background: "#0c0e14",
  surface: "#14161f",
  sidebar: "#0f1117",
  border: "rgba(255,255,255,0.10)",
  borderSubtle: "rgba(255,255,255,0.08)",
  accent: "hsl(22, 92%, 54%)",
  accentGlow: "hsl(22, 92%, 70%)",
  pine: "hsl(162, 50%, 42%)",
  amber: "#fbbf24",
  blue: "#60a5fa",
  red: "#f87171",
  purple: "#c084fc",
  textPrimary: "#ffffff",
  textSecondary: "rgba(255,255,255,0.70)",
  textMuted: "rgba(255,255,255,0.40)",
  textFaint: "rgba(255,255,255,0.25)",
} as const;

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

export type ColorKey = keyof typeof colors;
export type SpacingKey = keyof typeof spacing;
