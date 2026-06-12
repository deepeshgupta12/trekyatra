import { useEffect, useState } from "react";
import { View, Text, ScrollView, Image, ActivityIndicator, StyleSheet, Linking, TouchableOpacity } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { SafeArea } from "@/components/ui/SafeArea";
import { contentApi, type Operator } from "@/lib/mobileApi";

export default function OperatorsScreen() {
  const { colors, isDark } = useTheme();
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contentApi
      .getOperators()
      .then((data) => setOperators(data.filter((o) => o.active)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <SafeArea edges={["bottom"]}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>Trusted trek operators</Text>
        <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
          Verified operators across India's trekking regions — book with confidence.
        </Text>

        {loading && (
          <View style={styles.center}>
            <ActivityIndicator color="#E8702A" />
          </View>
        )}

        {!loading && operators.length === 0 && (
          <Text style={[styles.helperText, { color: colors.textMuted }]}>
            No operators are listed yet — check back soon.
          </Text>
        )}

        {operators.map((op) => (
          <View
            key={op.id}
            style={[
              styles.card,
              {
                backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(29,58,46,0.04)",
                borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(29,58,46,0.1)",
              },
            ]}
          >
            <View style={styles.cardHeader}>
              {op.logo_url ? (
                <Image source={{ uri: op.logo_url }} style={styles.logo} />
              ) : (
                <View style={[styles.logo, styles.logoFallback]}>
                  <Text style={styles.logoLetter}>{op.name.charAt(0)}</Text>
                </View>
              )}
              <View style={styles.cardHeaderText}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{op.name}</Text>
                {op.region && <Text style={[styles.cardMeta, { color: colors.textMuted }]}>{op.region}</Text>}
              </View>
              {op.rating_avg != null && (
                <Text style={styles.rating}>★ {op.rating_avg.toFixed(1)}</Text>
              )}
            </View>
            {op.description_long && (
              <Text style={[styles.cardDesc, { color: colors.textSecondary }]} numberOfLines={3}>
                {op.description_long}
              </Text>
            )}
            {op.trek_types && op.trek_types.length > 0 && (
              <View style={styles.tagRow}>
                {op.trek_types.map((tt) => (
                  <View key={tt} style={[styles.tag, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(29,58,46,0.06)" }]}>
                    <Text style={[styles.tagText, { color: colors.textSecondary }]}>{tt}</Text>
                  </View>
                ))}
              </View>
            )}
            {op.website_url && (
              <TouchableOpacity onPress={() => Linking.openURL(op.website_url!)}>
                <Text style={styles.link}>Visit website →</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 14, paddingBottom: 32 },
  heroTitle: { fontSize: 26, fontWeight: "700", fontFamily: "PlayfairDisplay_700Bold" },
  heroSubtitle: { fontSize: 14, lineHeight: 20, marginBottom: 4 },
  center: { paddingVertical: 24, alignItems: "center" },
  helperText: { fontSize: 13, textAlign: "center", marginTop: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: { width: 44, height: 44, borderRadius: 10 },
  logoFallback: { backgroundColor: "#E8702A", alignItems: "center", justifyContent: "center" },
  logoLetter: { color: "#fff", fontSize: 18, fontWeight: "700" },
  cardHeaderText: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: "600" },
  cardMeta: { fontSize: 12 },
  rating: { color: "#E8702A", fontSize: 13, fontWeight: "700" },
  cardDesc: { fontSize: 13, lineHeight: 18 },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  tagText: { fontSize: 11, fontWeight: "500" },
  link: { color: "#E8702A", fontSize: 13, fontWeight: "600", marginTop: 2 },
});
