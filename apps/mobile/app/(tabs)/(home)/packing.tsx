import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { SafeArea } from "@/components/ui/SafeArea";

interface Section {
  eyebrow: string;
  title: string;
  body?: string;
  bullets?: string[];
  cards?: { title: string; body: string }[];
}

const SECTIONS: Section[] = [
  {
    eyebrow: "Clothing",
    title: "Layer like the mountains demand it",
    body: "Three layers, always: a moisture-wicking base, an insulating mid-layer, and a waterproof shell. Cotton kills above the snowline.",
    bullets: [
      "3 quick-dry t-shirts (no cotton)",
      "2 thermal base layers",
      "1 fleece + 1 down jacket",
      "Waterproof shell jacket + pants",
      "Trekking pants (avoid jeans)",
      "Warm gloves + liner gloves",
      "Woollen cap + sun cap",
      "3-4 pairs woollen/synthetic socks",
    ],
  },
  {
    eyebrow: "Footwear",
    title: "Boots — your single most important purchase",
    body: "High-ankle waterproof trekking boots, broken in over at least 50km before your trek.",
  },
  {
    eyebrow: "Gear",
    title: "Backpack, sleeping & daypack",
    cards: [
      { title: "Backpack", body: "55-65L with rain cover" },
      { title: "Sleeping bag", body: "-10°C for snow, 0°C for summer" },
      { title: "Daypack", body: "20-30L for summit day" },
    ],
  },
  {
    eyebrow: "Documents",
    title: "What to carry in your wallet",
    bullets: [
      "Govt photo ID (mandatory)",
      "Medical insurance",
      "Emergency contacts (printed)",
      "Cash + cards",
      "Permits (printed)",
    ],
  },
];

export default function PackingScreen() {
  const { colors, isDark } = useTheme();

  return (
    <SafeArea edges={["bottom"]}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.content}>
        <Text style={[styles.heroTitle, { color: colors.textPrimary }]}>
          The Indian trekker's packing system
        </Text>
        <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>
          Season-tuned, trek-tested checklists. Built around layering, weight, and the realities of
          Indian trekking.
        </Text>

        {SECTIONS.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.eyebrow}>{section.eyebrow}</Text>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{section.title}</Text>
            {section.body && (
              <Text style={[styles.sectionBody, { color: colors.textSecondary }]}>{section.body}</Text>
            )}
            {section.bullets && (
              <View style={styles.bulletList}>
                {section.bullets.map((b) => (
                  <View key={b} style={styles.bulletRow}>
                    <Text style={styles.bulletDot}>•</Text>
                    <Text style={[styles.bulletText, { color: colors.textSecondary }]}>{b}</Text>
                  </View>
                ))}
              </View>
            )}
            {section.cards && (
              <View style={styles.cardRow}>
                {section.cards.map((c) => (
                  <View
                    key={c.title}
                    style={[
                      styles.card,
                      {
                        backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(29,58,46,0.04)",
                        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(29,58,46,0.1)",
                      },
                    ]}
                  >
                    <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{c.title}</Text>
                    <Text style={[styles.cardBody, { color: colors.textSecondary }]}>{c.body}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: 16, gap: 4, paddingBottom: 32 },
  heroTitle: { fontSize: 26, fontWeight: "700", fontFamily: "PlayfairDisplay_700Bold", marginBottom: 6 },
  heroSubtitle: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  section: { marginBottom: 20, gap: 6 },
  eyebrow: { fontSize: 11, fontWeight: "700", color: "#E8702A", letterSpacing: 2, textTransform: "uppercase" },
  sectionTitle: { fontSize: 19, fontWeight: "700", fontFamily: "PlayfairDisplay_700Bold" },
  sectionBody: { fontSize: 14, lineHeight: 20 },
  bulletList: { marginTop: 4, gap: 6 },
  bulletRow: { flexDirection: "row", gap: 8 },
  bulletDot: { color: "#E8702A", fontSize: 14, lineHeight: 20 },
  bulletText: { fontSize: 14, lineHeight: 20, flex: 1 },
  cardRow: { gap: 10, marginTop: 4 },
  card: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 2 },
  cardTitle: { fontSize: 14, fontWeight: "600" },
  cardBody: { fontSize: 13 },
});
