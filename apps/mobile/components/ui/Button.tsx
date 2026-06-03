import { Pressable, Text, ActivityIndicator, type PressableProps } from "react-native";
import { colors } from "@/constants/theme";

type ButtonVariant = "hero" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends PressableProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  children: React.ReactNode;
  accessibilityLabel: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  hero: "bg-accent rounded-xl",
  outline: "border border-white/20 rounded-xl bg-transparent",
  ghost: "bg-transparent rounded-xl",
};

const textStyles: Record<ButtonVariant, string> = {
  hero: "text-white font-semibold",
  outline: "text-white/70 font-medium",
  ghost: "text-white/60 font-medium",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-4 py-2",
  md: "px-5 py-3",
  lg: "px-6 py-4",
};

const textSizeStyles: Record<ButtonSize, string> = {
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

export function Button({
  variant = "hero",
  size = "md",
  loading = false,
  children,
  disabled,
  accessibilityLabel,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      {...props}
      disabled={isDisabled}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      className={`flex-row items-center justify-center ${variantStyles[variant]} ${sizeStyles[size]} ${isDisabled ? "opacity-50" : "active:opacity-70"}`}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "hero" ? colors.textPrimary : colors.textMuted}
        />
      ) : (
        <Text
          className={`${textStyles[variant]} ${textSizeStyles[size]}`}
          style={{ fontFamily: "Inter_600SemiBold" }}
        >
          {children}
        </Text>
      )}
    </Pressable>
  );
}
