import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Image, ActivityIndicator, StyleSheet } from "react-native";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { SafeArea } from "@/components/ui/SafeArea";
import { contentApi, type CMSPage } from "@/lib/mobileApi";

interface Props {
  pageType: string;
  title: string;
  subtitle: string;
  emptyText: string;
}

export function CMSHubScreen({ pageType, title, subtitle, emptyText }: Props) {
  const { colors, isDark } = useTheme();
  const [pages, setPages] = useState<CMSPage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    contentApi
      .getCmsPagesByType(pageType)
      .then((data) => {
        if (!cancelled) setPages(data);
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
  }, [pageType]);

  return (
    <SafeArea edges={["bottom"]}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color="#E8702A" />
          </View>
        )}

        {!loading && (error || pages.length === 0) && (
          <View style={styles.center}>
            <Text style={{ color: colors.textMuted, textAlign: "center" }}>{emptyText}</Text>
          </View>
        )}

        {pages.map((page) => (
          <TouchableOpacity
            key={page.slug}
            style={[
              styles.card,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(29,58,46,0.04)",
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(29,58,46,0.1)",
              },
            ]}
            activeOpacity={0.8}
            onPress={() => router.push(`/guide/${page.slug}` as never)}
          >
            {page.hero_image_url && (
              <Image source={{ uri: page.hero_image_url }} style={styles.cardImage} />
            )}
            <View style={styles.cardBody}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{page.title}</Text>
              {page.seo_description && (
                <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                  {page.seo_description}
                </Text>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: "700", fontFamily: "PlayfairDisplay_700Bold" },
  subtitle: { fontSize: 14, marginTop: -6, marginBottom: 4 },
  center: { paddingVertical: 32, alignItems: "center" },
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  cardImage: { width: "100%", height: 140 },
  cardBody: { padding: 14, gap: 4 },
  cardTitle: { fontSize: 15, fontWeight: "600" },
  cardDesc: { fontSize: 13, lineHeight: 18 },
});
