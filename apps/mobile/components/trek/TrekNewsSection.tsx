import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { resizedImageUrl } from "@/lib/imageUrl";
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
            onPress={() => router.push(`/(tabs)/(home)/news/${article.slug}` as never)}
          >
            {article.hero_image_url ? (
              <Image source={{ uri: resizedImageUrl(article.hero_image_url, 400) ?? article.hero_image_url }} style={styles.image} />
            ) : (
              <View style={[styles.image, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(29,58,46,0.06)" }]} />
            )}
            <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
              {article.title}
            </Text>
            {article.published_at && (
              <Text style={[styles.date, { color: colors.textMuted }]}>{formatDate(article.published_at)}</Text>
            )}
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
    width: 180,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    padding: 10,
  },
  image: {
    width: "100%",
    height: 90,
    borderRadius: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },
  date: {
    fontSize: 11,
    marginTop: 6,
  },
});
