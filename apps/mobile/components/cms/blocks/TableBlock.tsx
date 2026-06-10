import React from "react";
import { View, Text, ScrollView } from "react-native";

interface Props {
  headers: string[];
  rows: string[][];
}

export function TableBlock({ headers, rows }: Props) {
  return (
    <View className="my-4 rounded-xl border border-gray-200 overflow-hidden">
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View>
          {/* Header row */}
          <View className="flex-row bg-gray-100">
            {headers.map((h, i) => (
              <Text
                key={i}
                className="text-xs font-semibold text-gray-700 px-3 py-2.5 min-w-[100px]"
              >
                {h}
              </Text>
            ))}
          </View>
          {/* Data rows */}
          {rows.map((row, ri) => (
            <View
              key={ri}
              className={`flex-row border-t border-gray-100 ${ri % 2 === 1 ? "bg-gray-50" : "bg-white"}`}
            >
              {row.map((cell, ci) => (
                <Text
                  key={ci}
                  className="text-sm text-gray-700 px-3 py-2.5 min-w-[100px]"
                >
                  {cell}
                </Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
