import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

const HERO_IMAGE = require("@/assets/onboarding-1.jpg");
const FALLBACK_BLUR = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

export function HomeHero() {
  return (
    <View style={styles.container}>
      <Image
        source={HERO_IMAGE}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        placeholder={FALLBACK_BLUR}
        transition={300}
      />
      <LinearGradient
        colors={["rgba(13,20,16,0.15)", "rgba(13,20,16,0.55)", "rgba(13,20,16,0.85)"]}
        locations={[0, 0.6, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>
        <Text style={styles.wordmark}>TrekYatra</Text>
        <Text style={styles.tagline}>India&apos;s trekking guide</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 200,
    justifyContent: "flex-end",
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
    gap: 4,
  },
  wordmark: {
    fontSize: 26,
    fontWeight: "700",
    color: "#ffffff",
    fontFamily: "PlayfairDisplay_700Bold",
  },
  tagline: {
    fontSize: 13,
    color: "rgba(255,255,255,0.80)",
  },
});
