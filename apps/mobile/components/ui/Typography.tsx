import { Text, type TextProps } from "react-native";
import { colors, fonts } from "@/constants/theme";

interface TypographyProps extends TextProps {
  children: React.ReactNode;
}

export function Display({ children, style, ...props }: TypographyProps) {
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily: fonts.display,
          fontSize: 28,
          lineHeight: 36,
          color: colors.textPrimary,
          fontWeight: "600",
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Heading({ children, style, ...props }: TypographyProps) {
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily: fonts.bodySemi,
          fontSize: 20,
          lineHeight: 28,
          color: colors.textPrimary,
          fontWeight: "600",
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Body({ children, style, ...props }: TypographyProps) {
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily: fonts.body,
          fontSize: 15,
          lineHeight: 22,
          color: colors.textSecondary,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Caption({ children, style, ...props }: TypographyProps) {
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily: fonts.body,
          fontSize: 12,
          lineHeight: 18,
          color: colors.textMuted,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function Mono({ children, style, ...props }: TypographyProps) {
  return (
    <Text
      {...props}
      style={[
        {
          fontFamily: fonts.mono,
          fontSize: 13,
          lineHeight: 20,
          color: colors.textSecondary,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export const Typography = { Display, Heading, Body, Caption, Mono };
