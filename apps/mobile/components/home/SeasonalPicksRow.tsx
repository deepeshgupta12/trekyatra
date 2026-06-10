import { View, Text, ScrollView, StyleSheet } from "react-native";
import { TrekCard } from "@/components/trek/TrekCard";
import type { TrekListItem } from "@/lib/mobileApi";
import { useTheme } from "@/hooks/useTheme";

const MONTH_NAMES = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

interface Props {
  treks: TrekListItem[];
  loading?: boolean;
}

export function SeasonalPicksRow({ treks, loading = false }: Props) {
  const { colors } = useTheme();
  const month = MONTH_NAMES[new Date().getMonth()];

  if (!loading && treks.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: colors.textPrimary }]}>
        Best treks in {month}
      </Text>
      {loading ? (
        <View style={{ flexDirection: "row", paddingHorizontal: 16, gap: 12 }}>
          {[0, 1, 2].map((i) => (
            <View key={i} style={{ width: 160, height: 200, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.06)" }} />
          ))}
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.row}
        >
          {treks.map((trek) => (
            <TrekCard key={trek.slug} trek={trek} width={160} />
          ))}
        </ScrollView>
      )}
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
