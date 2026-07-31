import type { ReactElement } from "react";
import { FlatList, ScrollView, View, Text, ActivityIndicator, StyleSheet, Dimensions } from "react-native";
import { TrekCard } from "@/components/trek/TrekCard";
import { TrekCardSkeleton } from "@/components/ui/SkeletonLoader";
import { useTheme } from "@/hooks/useTheme";
import type { TrekListItem } from "@/lib/mobileApi";

interface TrekGridProps {
  treks: TrekListItem[];
  isLoading: boolean;
  isFetchingMore: boolean;
  onEndReached: () => void;
  emptyMessage?: string;
  ListHeaderComponent?: ReactElement;
  /** Overrides the default empty state (e.g. no-results + similar treks — STEP-M30 N05). */
  renderEmpty?: ReactElement;
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const COLUMN_GAP = 12;
// Math.floor per the hard-won grid rule — sub-pixel width silently wraps a 2-col row to 1.
const CARD_WIDTH = Math.floor((SCREEN_WIDTH - 16 * 2 - COLUMN_GAP) / 2);

export function TrekGrid({
  treks,
  isLoading,
  isFetchingMore,
  onEndReached,
  emptyMessage,
  ListHeaderComponent,
  renderEmpty,
}: TrekGridProps) {
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {ListHeaderComponent}
        <View style={[styles.list, styles.skeletonGrid]}>
          {Array.from({ length: 6 }).map((_, i) => (
            <TrekCardSkeleton key={i} width={CARD_WIDTH} height={CARD_WIDTH * 1.4} />
          ))}
        </View>
      </ScrollView>
    );
  }

  // NOTE: always render the FlatList — even with zero results. A previous version returned a plain
  // <View> for the empty state, which made the whole Explore screen unscrollable whenever a filter
  // narrowed results to nothing (D12). numColumns is dropped when empty so ListEmptyComponent can
  // span full width without the column wrapper.
  const isEmpty = treks.length === 0;
  return (
    <FlatList
      data={treks}
      keyExtractor={(item) => item.slug}
      numColumns={isEmpty ? 1 : 2}
      key={isEmpty ? "empty" : "grid"}
      columnWrapperStyle={isEmpty ? undefined : styles.row}
      contentContainerStyle={styles.list}
      renderItem={({ item }) => <TrekCard trek={item} width={CARD_WIDTH} noMargin />}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.5}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        renderEmpty ?? (
          <View style={styles.center}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {emptyMessage ?? "No treks match your filters"}
            </Text>
          </View>
        )
      }
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
  skeletonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: COLUMN_GAP,
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
