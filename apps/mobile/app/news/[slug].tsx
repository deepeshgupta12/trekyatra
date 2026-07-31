import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/hooks/useTheme";
import { HtmlContentRenderer } from "@/components/cms/HtmlContentRenderer";
import { SkeletonLoader } from "@/components/ui/SkeletonLoader";
import { trackNewsArticleViewed } from "@/lib/analytics";
import { contentApi, type CMSPage } from "@/lib/mobileApi";

function formatDate(d: string | null): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
}

const HEADER_BG = "#0c0e14"; // matches the web news hero block

/**
 * News article detail (STEP-M30 N11/N12). Root-level route (no tab switch). Mirrors the mobile-web
 * `/news/[slug]` layout: a dark header block (eyebrow + title + meta) — NO hero image, since news
 * images are not available — then the prose body. Fixes the old empty-grey-hero gap and the literal
 * "news/[slug]" stack header.
 */
export default function NewsArticleScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [page, setPage] = useState<CMSPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

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

  const backButton = (
    <TouchableOpacity
      style={[styles.backBtn, { top: insets.top + 8 }]}
      onPress={() => router.back()}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      accessibilityRole="button"
      accessibilityLabel="Go back"
    >
      <Ionicons name="chevron-back" size={22} color="#fff" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.flex, { backgroundColor: colors.background }]}>
        <View style={[styles.headerBlock, { paddingTop: insets.top + 56 }]}>
          <SkeletonLoader height={14} width="30%" />
          <SkeletonLoader height={30} width="90%" style={{ marginTop: 10 }} />
          <SkeletonLoader height={30} width="70%" style={{ marginTop: 6 }} />
        </View>
        <View style={{ paddingHorizontal: 16, gap: 12, marginTop: 20 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <SkeletonLoader key={i} height={14} width={i % 3 === 2 ? "70%" : "100%"} />
          ))}
        </View>
        {backButton}
      </View>
    );
  }

  if (error || !page) {
    return (
      <View style={[styles.flex, styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>This article could not be loaded.</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: "#E8702A", fontWeight: "600" }}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.flex, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.flex} contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        {/* Dark header block (web parity) — no image */}
        <View style={[styles.headerBlock, { paddingTop: insets.top + 56 }]}>
          <Text style={styles.eyebrow}>📰  TREK NEWS</Text>
          <Text style={styles.title}>{page.title}</Text>
          {page.seo_description ? (
            <Text style={styles.dek} numberOfLines={3}>{page.seo_description}</Text>
          ) : null}
          {page.published_at ? (
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.6)" />
              <Text style={styles.metaText}>{formatDate(page.published_at)}</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaText}>TrekYatra Editorial</Text>
            </View>
          ) : null}
        </View>

        <View style={styles.body}>
          <HtmlContentRenderer html={page.content_html} />
        </View>
      </ScrollView>

      {backButton}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  headerBlock: {
    backgroundColor: HEADER_BG,
    paddingHorizontal: 20,
    paddingBottom: 26,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  eyebrow: {
    color: "#E8702A",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  title: {
    color: "#fff",
    fontSize: 26,
    fontFamily: "PlayfairDisplay_700Bold",
    lineHeight: 33,
  },
  dek: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 12,
  },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 16 },
  metaText: { color: "rgba(255,255,255,0.6)", fontSize: 12 },
  metaDot: { color: "rgba(255,255,255,0.35)", fontSize: 12 },
  backBtn: {
    position: "absolute",
    left: 14,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  body: { paddingHorizontal: 16, marginTop: 16 },
});
