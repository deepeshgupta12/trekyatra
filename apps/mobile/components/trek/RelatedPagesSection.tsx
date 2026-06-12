import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { contentApi, type RelatedPage } from "@/lib/mobileApi";

interface RelatedPagesSectionProps {
  slug: string;
}

const PAGE_TYPE_LABELS: Record<string, string> = {
  trek_guide: "Trek Guide",
  packing_list: "Packing",
  permit_guide: "Permits",
  cost_guide: "Costs",
  safety_guide: "Safety",
  beginner_guide: "Beginner",
};

function routeForPage(page: RelatedPage): string {
  if (page.page_type === "trek_guide") return `/trek/${page.slug}`;
  return `/guide/${page.slug}`;
}

export function RelatedPagesSection({ slug }: RelatedPagesSectionProps) {
  const { colors, isDark } = useTheme();
  const [pages, setPages] = useState<RelatedPage[]>([]);

  useEffect(() => {
    contentApi
      .getRelatedPages(slug)
      .then(setPages)
      .catch(() => {});
  }, [slug]);

  if (pages.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: colors.textPrimary }]}>In this cluster</Text>
      <View style={styles.list}>
        {pages.map((page) => (
          <TouchableOpacity
            key={page.id}
            style={[
              styles.row,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(29,58,46,0.04)",
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(29,58,46,0.08)",
              },
            ]}
            activeOpacity={0.85}
            onPress={() => router.push(routeForPage(page) as never)}
          >
            <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
              {page.title}
            </Text>
            <View style={[styles.tag, { backgroundColor: "#E8702A1A" }]}>
              <Text style={[styles.tagText, { color: "#E8702A" }]}>
                {PAGE_TYPE_LABELS[page.page_type] ?? page.page_type}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  heading: {
    fontSize: 17,
    fontWeight: "700",
    fontFamily: "PlayfairDisplay_700Bold",
    marginBottom: 12,
  },
  list: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
