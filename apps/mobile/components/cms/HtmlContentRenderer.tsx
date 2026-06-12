import React from "react";
import { useWindowDimensions, View } from "react-native";
import RenderHTML from "react-native-render-html";
import { useTheme } from "@/hooks/useTheme";

interface Props {
  html: string;
}

export function HtmlContentRenderer({ html }: Props) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  const tagsStyles = {
    h1: {
      fontFamily: "PlayfairDisplay_700Bold",
      fontSize: 24,
      color: colors.textPrimary,
      marginTop: 16,
      marginBottom: 8,
    },
    h2: {
      fontFamily: "PlayfairDisplay_700Bold",
      fontSize: 20,
      color: colors.textPrimary,
      marginTop: 16,
      marginBottom: 8,
    },
    h3: {
      fontFamily: "PlayfairDisplay_600SemiBold",
      fontSize: 18,
      color: colors.textPrimary,
      marginTop: 12,
      marginBottom: 6,
    },
    h4: {
      fontFamily: "PlayfairDisplay_600SemiBold",
      fontSize: 16,
      color: colors.textPrimary,
      marginTop: 12,
      marginBottom: 4,
    },
    p: {
      fontFamily: "Inter_400Regular",
      fontSize: 15,
      lineHeight: 24,
      color: colors.textSecondary,
      marginBottom: 12,
    },
    li: {
      fontFamily: "Inter_400Regular",
      fontSize: 15,
      lineHeight: 24,
      color: colors.textSecondary,
    },
    strong: { color: colors.textPrimary },
    a: { color: colors.accent, textDecorationLine: "underline" as const },
    blockquote: {
      borderLeftWidth: 3,
      borderLeftColor: colors.accent,
      paddingLeft: 12,
      marginLeft: 0,
      marginVertical: 8,
      fontStyle: "italic" as const,
      color: colors.textSecondary,
    },
    table: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      marginVertical: 8,
    },
    th: {
      fontFamily: "Inter_600SemiBold",
      color: colors.textPrimary,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 6,
    },
    td: {
      fontFamily: "Inter_400Regular",
      color: colors.textSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 6,
    },
  };

  return (
    <View className="px-4">
      <RenderHTML
        contentWidth={width - 32}
        source={{ html }}
        tagsStyles={tagsStyles}
        enableExperimentalMarginCollapsing
      />
    </View>
  );
}
