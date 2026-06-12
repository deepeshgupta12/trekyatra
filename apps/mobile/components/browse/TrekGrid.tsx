import type { ReactElement } from "react";
import { FlatList, View, Text, ActivityIndicator, StyleSheet, Dimensions } from "react-native";
import { TrekCard } from "@/components/trek/TrekCard";
import { useTheme } from "@/hooks/useTheme";
import type { TrekListItem } from "@/lib/mobileApi";

interface TrekGridProps {
  treks: TrekListItem[];
  isLoading: boolean;
  isFetchingMore: boolean;
  onEndReached: () => void;
  emptyMessage?: string;
  ListHeaderComponent?: ReactElement;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const COLUMN_GAP = 12;
const CARD_WIDTH = (SCREEN_WIDTH - 16 * 2 - COLUMN_GAP) / 2;

export function TrekGrid({
  treks,
  isLoading,
  isFetchingMore,
  onEndReached,
  emptyMessage,
  ListHeaderComponent,
}: TrekGridProps) {
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={styles.center}>
        {ListHeaderComponent}
        <ActivityIndicator color={colors.saffron} />
      </View>
    );
  }

  if (treks.length === 0) {
    return (
      <View>
        {ListHeaderComponent}
        <View style={styles.center}>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>
            {emptyMessage ?? "No treks match your filters"}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <FlatList
      data={treks}
      keyExtractor={(item) => item.slug}
      numColumns={2}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => <TrekCard trek={item} width={CARD_WIDTH} />}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={
        isFetchingMore ? (
          <View style={styles.footer}>
            <ActivityIndicator color={colors.saffron} />
          </View>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  row: {
    gap: COLUMN_GAP,
    marginBottom: 12,
  },
  center: {
    paddingVertical: 48,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  footer: {
    paddingVertical: 16,
    alignItems: "center",
  },
});
