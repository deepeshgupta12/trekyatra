import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";

interface FAQItem {
  question: string;
  answer: string;
}

interface Props {
  items: FAQItem[];
}

function FAQItem({ question, answer }: FAQItem) {
  const [open, setOpen] = useState(false);

  return (
    <View className="border-b border-gray-100 last:border-0">
      <TouchableOpacity
        onPress={() => setOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={question}
        accessibilityState={{ expanded: open }}
        className="flex-row items-center justify-between py-3.5 px-1"
        activeOpacity={0.7}
      >
        <Text className="text-sm font-medium text-gray-800 flex-1 pr-3">{question}</Text>
        <Text className="text-gray-400 text-base">{open ? "−" : "+"}</Text>
      </TouchableOpacity>
      {open && (
        <Text className="text-sm text-gray-600 leading-relaxed pb-3.5 px-1">{answer}</Text>
      )}
    </View>
  );
}

export function FAQBlock({ items }: Props) {
  return (
    <View className="my-4 bg-gray-50 rounded-xl px-4 py-1">
      {items.map((item, i) => (
        <FAQItem key={i} {...item} />
      ))}
    </View>
  );
}
