/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./providers/**/*.{ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0c0e14",
        surface: "#14161f",
        sidebar: "#0f1117",
        accent: "hsl(22 92% 54%)",
        pine: "hsl(162 50% 42%)",
        amber: "#fbbf24",
        blue: "#60a5fa",
        red: "#f87171",
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
