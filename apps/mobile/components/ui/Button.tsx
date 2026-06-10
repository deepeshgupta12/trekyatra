import { Pressable, Text, ActivityIndicator, StyleSheet, type PressableProps, type ViewStyle } from "react-native";
import { useTheme } from "@/hooks/useTheme";

type ButtonVariant = "hero" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends PressableProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
  accessibilityLabel: string;
}

const variantClass: Record<ButtonVariant, string> = {
  hero: "bg-saffron rounded-xl",
  outline: "border border-white/20 rounded-xl bg-transparent",
  ghost: "bg-transparent rounded-xl",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "px-4 py-2",
  md: "px-5 py-3.5",
  lg: "px-6 py-4",
};

const textSizeClass: Record<ButtonSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

const heroShadow: ViewStyle = {
  shadowColor: "#E8702A",
  shadowOffset: { width: 0, height: 4 },
  shadowOpacity: 0.4,
  shadowRadius: 10,
  elevation: 6,
};

export function Button({
  variant = "hero",
  size = "md",
  loading = false,
  children,
  disabled,
  accessibilityLabel,
  style,
  ...props
}: ButtonProps) {
  const { isDark } = useTheme();
  const isDisabled = disabled || loading;

  const textColor =
    variant === "hero"
      ? "#ffffff"
      : isDark
      ? "rgba(255,255,255,0.70)"
      : "rgba(29,58,46,0.70)";

  const indicatorColor =
    variant === "hero" ? "#ffffff" : isDark ? "rgba(255,255,255,0.40)" : "rgba(29,58,46,0.40)";

  const extraStyle = variant === "hero" ? heroShadow : undefined;

  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      style={StyleSheet.flatten([extraStyle, style as ViewStyle])}
      className={`flex-row items-center justify-center ${variantClass[variant]} ${sizeClass[size]} ${isDisabled ? "opacity-50" : "active:opacity-75"}`}
    >
      {loading ? (
        <ActivityIndicator size="small" color={indicatorColor} />
      ) : (
        <Text
          style={{ fontFamily: "Inter_600SemiBold", color: textColor }}
          className={textSizeClass[size]}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}
