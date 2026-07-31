import { View, Text, ScrollView, StyleSheet } from "react-native";
import { TrekCard } from "@/components/trek/TrekCard";
import { useTheme } from "@/hooks/useTheme";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import type { TrekViewEntry } from "@/lib/behaviorProfile";

interface Props {
  views: TrekViewEntry[];
}

const CARD_W = 180;

function fmt(input: number | string | null): string {
  if (input == null) return "";
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

/**
 * STEP-M30 N02/N03 — Recently viewed uses the SAME TrekCard as the other Home sections, with a
 * caption showing last-viewed + last-updated dates. Rendered above "Continue exploring" for repeat
 * users (see HomeScreen ordering).
 */
export function RecentlyViewedRow({ views }: Props) {
  const { colors } = useTheme();
  const items = useRecentlyViewed(views);

  if (items.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: colors.textPrimary }]}>Recently viewed</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {items.map((item) => (
          <View key={item.trek.slug} style={styles.cell}>
            <TrekCard trek={item.trek} width={CARD_W} noMargin />
            <View style={styles.dates}>
              <Text style={[styles.dateLine, { color: colors.textMuted }]} numberOfLines={1}>
                Viewed {fmt(item.viewedAt)}
              </Text>
              {item.updatedAt ? (
                <Text style={[styles.dateLine, { color: colors.textMuted }]} numberOfLines={1}>
                  Updated {fmt(item.updatedAt)}
                </Text>
              ) : null}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 24, gap: 12 },
  heading: {
    fontSize: 18,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
    paddingHorizontal: 16,
  },
  row: { paddingHorizontal: 16, gap: 12 },
  cell: { width: CARD_W },
  dates: { marginTop: 6, gap: 1 },
  dateLine: { fontSize: 11, fontWeight: "500" },
});
