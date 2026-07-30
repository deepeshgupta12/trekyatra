import { View, Text, Image } from "react-native";
import { useTheme } from "@/hooks/useTheme";

// D25: logo.png is a dark/pine mark that disappears on the dark background. In dark mode use the
// adaptive-icon foreground (designed to read on the #0c0e14 dark bg) so the logo stays visible.
const logoLight = require("@/assets/logo.png");
const logoDark = require("@/assets/adaptive-icon.png");

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  light?: boolean;
}

const sizes = {
  sm: { image: 24, text: "text-base" },
  md: { image: 32, text: "text-xl" },
  lg: { image: 40, text: "text-2xl" },
};

export function Logo({ size = "md", showText = true, light = false }: LogoProps) {
  const { isDark } = useTheme();
  const s = sizes[size];
  const textColor = light || !isDark ? "#1D3A2E" : "#ffffff";
  const logoAsset = isDark && !light ? logoDark : logoLight;

  return (
    <View className="flex-row items-center gap-2">
      <Image
        source={logoAsset}
        style={{ width: s.image, height: s.image }}
        resizeMode="contain"
        accessibilityLabel="TrekYatra logo"
      />
      {showText && (
        <Text
          className={`font-display font-semibold ${s.text}`}
          style={{ color: textColor, letterSpacing: -0.5 }}
        >
          TrekYatra
        </Text>
      )}
    </View>
  );
}
