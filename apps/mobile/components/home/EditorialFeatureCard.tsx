import { View, Text, TouchableOpacity, ImageBackground, StyleSheet } from "react-native";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

export function EditorialFeatureCard() {
  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={0.9} onPress={() => router.push("/beginner" as never)}>
        <ImageBackground
          source={{ uri: "https://images.unsplash.com/photo-1551632811-561732d1e306?w=1200&q=70" }}
          style={styles.image}
          imageStyle={styles.imageStyle}
        >
          <LinearGradient colors={["transparent", "rgba(5,8,15,0.9)"]} style={styles.gradient}>
            <Text style={styles.eyebrow}>Editorial</Text>
            <Text style={styles.title}>Your first trek — start here</Text>
            <Text style={styles.subtitle}>
              India-specific, no-nonsense guides for first-time trekkers.
            </Text>
            <Text style={styles.cta}>Read the guide →</Text>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 24, paddingHorizontal: 16 },
  image: { width: "100%", height: 200, borderRadius: 16, overflow: "hidden" },
  imageStyle: { borderRadius: 16 },
  gradient: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 16,
    borderRadius: 16,
  },
  eyebrow: { color: "#E8702A", fontSize: 11, fontWeight: "700", letterSpacing: 2, textTransform: "uppercase" },
  title: { color: "#fff", fontSize: 20, fontWeight: "700", fontFamily: "PlayfairDisplay_700Bold", marginTop: 4 },
  subtitle: { color: "rgba(255,255,255,0.8)", fontSize: 13, marginTop: 4 },
  cta: { color: "#fff", fontSize: 13, fontWeight: "700", marginTop: 10 },
});
