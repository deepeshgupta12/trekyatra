/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./providers/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Dark mode legacy tokens
        background: "#0c0e14",
        surface: "#14161f",
        sidebar: "#0f1117",
        // TrekYatra brand tokens
        pine: {
          DEFAULT: "#1D3A2E",
          dark: "#0c1a12",
        },
        saffron: "#E8702A",
        sky: "#5298C9",
        earth: "#6B4929",
        mist: "#EBF2F2",
        paper: "#FAF5EE",
        // Shared accent (= saffron)
        accent: "hsl(22 92% 54%)",
        // Utility
        amber: "#fbbf24",
        blue: "#60a5fa",
        red: "#f87171",
        purple: "#c084fc",
      },
      fontFamily: {
        display: ["PlayfairDisplay_600SemiBold"],
        sans: ["Inter_400Regular"],
        "sans-medium": ["Inter_500Medium"],
        "sans-semi": ["Inter_600SemiBold"],
        mono: ["JetBrainsMono_400Regular"],
      },
    },
  },
  plugins: [],
};
