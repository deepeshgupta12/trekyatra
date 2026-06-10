import { View, Text, ScrollView, StyleSheet } from "react-native";
import { TrekCard } from "./TrekCard";
import type { TrekListItem } from "@/lib/mobileApi";
import { useTheme } from "@/hooks/useTheme";

interface TrekRelatedRowProps {
  treks: TrekListItem[];
  heading?: string;
}

export function TrekRelatedRow({ treks, heading = "Related Treks" }: TrekRelatedRowProps) {
  const { colors } = useTheme();

  if (treks.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: colors.textPrimary }]}>{heading}</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {treks.map((trek) => (
          <TrekCard key={trek.slug} trek={trek} width={160} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 8,
  },
  heading: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  row: {
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
});
