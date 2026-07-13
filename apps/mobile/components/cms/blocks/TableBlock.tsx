import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";

interface Props {
  headers: string[];
  rows: string[][];
}

export function TableBlock({ headers, rows }: Props) {
  const numCols = Math.max(headers.length, ...rows.map((r) => r.length), 1);

  return (
    <View style={styles.container}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexShrink: 0 }}>
          {/* Header row */}
          {headers.length > 0 && (
            <View style={styles.headerRow}>
              {headers.map((h, i) => (
                <View key={i} style={styles.headerCell}>
                  <Text style={styles.headerText}>{h}</Text>
                </View>
              ))}
            </View>
          )}
          {/* Data rows */}
          {rows.map((row, ri) => (
            <View key={ri} style={[styles.dataRow, ri % 2 === 1 && styles.altRow]}>
              {Array.from({ length: numCols }).map((_, ci) => (
                <View key={ci} style={styles.dataCell}>
                  <Text style={styles.dataText}>{row[ci] ?? ""}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const COL_WIDTH = 160;

const styles = StyleSheet.create({
  container: {
    marginVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  headerRow: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerCell: {
    width: COL_WIDTH,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  headerText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1f2937",
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
    width: COL_WIDTH,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRightWidth: 1,
    borderRightColor: "#f3f4f6",
  },
  dataText: {
    fontSize: 13,
    color: "#374151",
    lineHeight: 18,
  },
});
