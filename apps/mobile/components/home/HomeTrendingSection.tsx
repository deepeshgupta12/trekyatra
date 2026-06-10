import { View, Text, ScrollView, StyleSheet } from "react-native";
import { TrekCard } from "@/components/trek/TrekCard";
import type { TrekListItem } from "@/lib/mobileApi";
import { useTheme } from "@/hooks/useTheme";

type HomeState = "A" | "B" | "C" | "D";

function headingForState(state: HomeState): string {
  switch (state) {
    case "B": return "Recommended for you";
    case "D": return "Continue exploring";
    default:  return "Trending this month";
  }
}

interface Props {
  treks: TrekListItem[];
  state: HomeState;
  loading?: boolean;
}

export function HomeTrendingSection({ treks, state, loading = false }: Props) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: colors.textPrimary }]}>
        {headingForState(state)}
      </Text>
      {loading ? (
        <SkeletonRow />
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {treks.map((trek) => (
            <TrekCard key={trek.slug} trek={trek} width={180} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function SkeletonRow() {
  return (
    <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 12 }}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={{ width: 180, height: 220, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)" }} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    gap: 12,
  },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
    paddingHorizontal: 16,
  },
  row: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
});
