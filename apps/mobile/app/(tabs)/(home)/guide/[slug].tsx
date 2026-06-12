import { View, Text, ScrollView, ActivityIndicator, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useEffect, useState } from "react";
import { useTheme } from "@/hooks/useTheme";
import { SafeArea } from "@/components/ui/SafeArea";
import { CMSContentRenderer } from "@/components/cms/CMSContentRenderer";
import { contentApi, type CMSPage } from "@/lib/mobileApi";
import type { Block } from "@/components/cms/types";

export default function CMSGuideScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { colors } = useTheme();
  const [page, setPage] = useState<CMSPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true);
    contentApi
      .getCmsPage(slug)
      .then((data) => {
        if (!cancelled) setPage(data);
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

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color="#E8702A" size="large" />
      </View>
    );
  }

  if (error || !page) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textSecondary }}>This page could not be loaded.</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={{ color: "#E8702A", fontWeight: "600" }}>← Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeArea edges={["bottom"]}>
      <ScrollView style={styles.flex} contentContainerStyle={{ paddingBottom: 32 }}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>{page.title}</Text>
          {page.seo_description && (
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{page.seo_description}</Text>
          )}
        </View>
        <CMSContentRenderer bodyJson={page.body_json as Block[] | null} />
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  backBtn: { marginTop: 4 },
  header: { padding: 16, gap: 6 },
  title: { fontSize: 24, fontWeight: "700", fontFamily: "PlayfairDisplay_700Bold" },
  subtitle: { fontSize: 14, lineHeight: 20 },
});
