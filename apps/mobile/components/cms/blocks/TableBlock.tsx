import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";

interface Props {
  headers: string[];
  rows: string[][];
}

export function TableBlock({ headers, rows }: Props) {
  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={true}>
        <View>
          {/* Header row */}
          <View style={styles.headerRow}>
            {headers.map((h, i) => (
              <Text key={i} style={styles.headerCell}>{h}</Text>
            ))}
          </View>
          {/* Data rows */}
          {rows.map((row, ri) => (
            <View key={ri} style={[styles.dataRow, ri % 2 === 1 && styles.altRow]}>
              {row.map((cell, ci) => (
                <Text key={ci} style={styles.dataCell}>{cell}</Text>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const COL_MIN_WIDTH = 120;

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
  },
  headerCell: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: COL_MIN_WIDTH,
  },
  dataRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    backgroundColor: "#ffffff",
  },
  altRow: {
    backgroundColor: "#f9fafb",
  },
  dataCell: {
    fontSize: 13,
    color: "#374151",
    paddingHorizontal: 12,
    paddingVertical: 10,
    minWidth: COL_MIN_WIDTH,
  },
});
