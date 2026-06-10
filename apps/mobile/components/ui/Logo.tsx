import { View, Text, Image } from "react-native";
import { useTheme } from "@/hooks/useTheme";

const logoAsset = require("@/assets/logo.png");

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
