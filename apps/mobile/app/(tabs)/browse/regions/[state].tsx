import { useLayoutEffect } from "react";
import { Text, StyleSheet } from "react-native";
import { useLocalSearchParams, useNavigation } from "expo-router";
import { SafeArea } from "@/components/ui/SafeArea";
import { TrekGrid } from "@/components/browse/TrekGrid";
import { useTheme } from "@/hooks/useTheme";
import { useExplore } from "@/hooks/useExplore";

export default function RegionHubScreen() {
  const { colors } = useTheme();
  const { state } = useLocalSearchParams<{ state: string }>();
  const navigation = useNavigation();
  const regionName = decodeURIComponent(state ?? "");

  useLayoutEffect(() => {
    navigation.setOptions({ title: regionName });
  }, [navigation, regionName]);

  const { pages, isLoading, isFetchingMore, loadMore } = useExplore({
    trekState: regionName,
  });

  const header = (
    <Text style={[styles.heading, { color: colors.textPrimary }]}>
      Treks in {regionName}
    </Text>
  );

  return (
    <SafeArea>
      <TrekGrid
        treks={pages}
        isLoading={isLoading}
        isFetchingMore={isFetchingMore}
        onEndReached={loadMore}
        emptyMessage={`No treks found in ${regionName} yet`}
        ListHeaderComponent={header}
      />
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
});
