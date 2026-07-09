import { ScrollView, View, Text, TouchableOpacity, Linking, StyleSheet, Image } from "react-native";
import { SafeArea } from "@/components/ui/SafeArea";
import { useTheme } from "@/hooks/useTheme";

const LINKS = [
  { label: "Website", url: "https://trekyatra.co.in" },
  { label: "Privacy Policy", url: "https://trekyatra.co.in/privacy" },
  { label: "Terms of Service", url: "https://trekyatra.co.in/terms" },
  { label: "Contact Us", url: "https://trekyatra.co.in/contact" },
];

export default function AboutScreen() {
  const { colors } = useTheme();

  return (
    <SafeArea edges={["top", "bottom"]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={[styles.logoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Image
            source={require("@/assets/logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={[styles.appName, { color: colors.textPrimary }]}>TrekYatra</Text>
          <Text style={[styles.tagline, { color: colors.textSecondary }]}>India's trekking guide</Text>
          <Text style={[styles.version, { color: colors.textMuted }]}>Version 1.0.0</Text>
        </View>

        <Text style={[styles.body, { color: colors.textSecondary }]}>
          TrekYatra helps adventurers discover, plan, and complete India's most incredible treks — from Himalayan high passes to Western Ghats ridgelines.
        </Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          We combine verified route data, insider permit knowledge, seasonal conditions, and curated operator recommendations to make every trek safe, well-planned, and unforgettable.
        </Text>

        <View style={styles.linksSection}>
          {LINKS.map((link) => (
            <TouchableOpacity
              key={link.label}
              style={[styles.linkRow, { borderBottomColor: colors.border }]}
              onPress={() => Linking.openURL(link.url)}
              activeOpacity={0.7}
            >
              <Text style={[styles.linkLabel, { color: colors.textPrimary }]}>{link.label}</Text>
              <Text style={[styles.linkArrow, { color: colors.textMuted }]}>↗</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.footer, { color: colors.textMuted }]}>
          © 2026 TrekYatra. Made with ❤️ for Indian trekkers.
        </Text>
      </ScrollView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 48, gap: 16 },
  logoCard: {
    alignItems: "center",
    padding: 28,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
    marginBottom: 8,
  },
  logoImage: { width: 80, height: 80 },
  appName: { fontSize: 24, fontWeight: "700", fontFamily: "PlayfairDisplay_700Bold" },
  tagline: { fontSize: 14 },
  version: { fontSize: 12, marginTop: 4 },
  body: { fontSize: 14, lineHeight: 22 },
  linksSection: { marginTop: 8, borderRadius: 16, overflow: "hidden" },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  linkLabel: { fontSize: 15, fontWeight: "500" },
  linkArrow: { fontSize: 16 },
  footer: { fontSize: 12, textAlign: "center", marginTop: 8 },
});
