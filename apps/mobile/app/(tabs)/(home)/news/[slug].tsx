import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { SafeArea } from "@/components/ui/SafeArea";
import { HtmlContentRenderer } from "@/components/cms/HtmlContentRenderer";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { resizedImageUrl } from "@/lib/imageUrl";
import { trackNewsArticleViewed } from "@/lib/analytics";
import { contentApi, type CMSPage } from "@/lib/mobileApi";

function formatDate(d: string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

export default function NewsArticleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { colors } = useTheme();
  const [page, setPage] = useState<CMSPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [heroFailed, setHeroFailed] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    setError(false);
    contentApi
      .getCmsPage(slug)
      .then((data) => {
        if (cancelled) return;
        setPage(data);
        trackNewsArticleViewed(data.slug, data.title).catch(() => {});
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const BackBar = (
    <TouchableOpacity
      style={[styles.backBtn, { backgroundColor: colors.surface }]}
      onPress={() => router.back()}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeArea edges={["top", "bottom"]}>
        <ScrollView style={styles.flex} contentContainerStyle={{ paddingBottom: 32 }}>
          <SkeletonLoader height={220} borderRadius={0} />
          <View style={styles.header}>
            <SkeletonLoader height={28} width="90%" />
            <SkeletonLoader height={28} width="60%" />
            <SkeletonLoader height={14} width="35%" style={{ marginTop: 8 }} />
          </View>
          <View style={{ paddingHorizontal: 16, gap: 12, marginTop: 8 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <SkeletonLoader key={i} height={14} width={i % 3 === 2 ? "70%" : "100%"} />
            ))}
          </View>
        </ScrollView>
      </SafeArea>
    );
  }

  if (error || !page) {
    return (
      <SafeArea edges={["top", "bottom"]}>
        <View style={styles.center}>
          <Text style={{ color: colors.textSecondary }}>This article could not be loaded.</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={{ color: "#E8702A", fontWeight: "600" }}>← Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeArea>
    );
  }

  const heroUri = page.hero_image_url
    ? heroFailed
      ? page.hero_image_url
      : resizedImageUrl(page.hero_image_url, 800)
    : null;

  return (
    <SafeArea edges={["bottom"]}>
      <ScrollView style={styles.flex} contentContainerStyle={{ paddingBottom: 40 }}>
        <View>
          {heroUri ? (
            <Image
              source={{ uri: heroUri }}
              style={styles.hero}
              contentFit="cover"
              transition={220}
              cachePolicy="memory-disk"
              onError={() => { if (!heroFailed) setHeroFailed(true); }}
            />
          ) : (
            <View style={[styles.hero, { backgroundColor: colors.surface }]} />
          )}
          <View style={styles.backBarWrap}>{BackBar}</View>
        </View>

        <View style={styles.header}>
          <Text style={[styles.badge, { color: colors.accent }]}>TREK NEWS</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{page.title}</Text>
          {page.published_at ? (
            <Text style={[styles.date, { color: colors.textMuted }]}>{formatDate(page.published_at)}</Text>
          ) : null}
        </View>

        <View style={styles.body}>
          <HtmlContentRenderer html={page.content_html} />
        </View>
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  hero: { width: "100%", height: 220 },
  backBarWrap: { position: "absolute", top: 12, left: 12 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  header: { paddingHorizontal: 16, paddingTop: 16, gap: 6 },
  badge: { fontSize: 11, fontWeight: "700", letterSpacing: 1 },
  title: { fontSize: 24, fontWeight: "700", fontFamily: "PlayfairDisplay_700Bold", lineHeight: 30 },
  date: { fontSize: 13, marginTop: 2 },
  body: { paddingHorizontal: 16, marginTop: 8 },
});
