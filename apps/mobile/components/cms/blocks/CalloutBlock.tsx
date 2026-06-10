import React from "react";
import { View, Text } from "react-native";

interface Props {
  variant: "warning" | "tip" | "info";
  content: string;
}

const STYLES = {
  warning: {
    container: "bg-amber-50 border-amber-300",
    icon: "⚠️",
    label: "Warning",
    labelClass: "text-amber-700",
    textClass: "text-amber-800",
  },
  tip: {
    container: "bg-green-50 border-green-300",
    icon: "💡",
    label: "Tip",
    labelClass: "text-green-700",
    textClass: "text-green-800",
  },
  info: {
    container: "bg-blue-50 border-blue-300",
    icon: "ℹ️",
    label: "Note",
    labelClass: "text-blue-700",
    textClass: "text-blue-800",
  },
};

export function CalloutBlock({ variant, content }: Props) {
  const s = STYLES[variant];
  return (
    <View className={`my-4 rounded-xl border-l-4 px-4 py-3 ${s.container}`}>
      <Text className={`text-xs font-semibold mb-1 ${s.labelClass}`}>
        {s.icon} {s.label}
      </Text>
      <Text className={`text-sm leading-relaxed ${s.textClass}`}>{content}</Text>
    </View>
  );
}
