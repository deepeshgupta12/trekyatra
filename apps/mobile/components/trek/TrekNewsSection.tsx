import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { contentApi, type NewsArticle } from "@/lib/mobileApi";

interface TrekNewsSectionProps {
  slug: string;
}

function formatDate(d: string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function TrekNewsSection({ slug }: TrekNewsSectionProps) {
  const { colors, isDark } = useTheme();
  const [articles, setArticles] = useState<NewsArticle[]>([]);

  useEffect(() => {
    contentApi
      .getNewsByTrek(slug)
      .then(setArticles)
      .catch(() => {});
  }, [slug]);

  if (articles.length === 0) return null;

  return (
    <View style={styles.container}>
      <Text style={[styles.heading, { color: colors.textPrimary }]}>Trek News</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {/* N10: text-only cards — news images are not available, so no thumbnail (was showing
            empty grey placeholders). A small eyebrow + title + date reads cleaner. */}
        {articles.map((article) => (
          <TouchableOpacity
            key={article.slug}
            style={[
              styles.card,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(29,58,46,0.04)",
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(29,58,46,0.08)",
              },
            ]}
            activeOpacity={0.85}
            onPress={() => router.push(`/news/${article.slug}` as never)}
          >
            <View style={styles.eyebrowRow}>
              <Ionicons name="newspaper-outline" size={12} color={colors.accent} />
              <Text style={[styles.eyebrow, { color: colors.accent }]}>TREK NEWS</Text>
            </View>
            <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={4}>
              {article.title}
            </Text>
            {article.published_at ? (
              <Text style={[styles.date, { color: colors.textMuted }]}>{formatDate(article.published_at)}</Text>
            ) : null}
          </TouchableOpacity>
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
    gap: 12,
  },
  card: {
    width: 220,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    justifyContent: "space-between",
  },
  eyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 8,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
    lineHeight: 19,
    fontFamily: "PlayfairDisplay_600SemiBold",
  },
  date: {
    fontSize: 11,
    marginTop: 10,
  },
});
