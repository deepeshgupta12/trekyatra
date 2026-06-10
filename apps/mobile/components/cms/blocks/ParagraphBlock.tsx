import React from "react";
import { Text } from "react-native";

interface Props {
  content: string;
}

export function ParagraphBlock({ content }: Props) {
  return (
    <Text
      className="text-base text-gray-800 leading-relaxed mb-4"
      accessibilityRole="text"
    >
      {content}
    </Text>
  );
}
