import { useEffect } from "react";
import { Image, StyleSheet, View } from "react-native";

interface AnimatedSplashProps {
  onFinish: () => void;
}

const DISPLAY_DURATION_MS = 1800;

/**
 * Static splash composition: full-bleed background photo with a
 * white, rounded-corner card holding the logo, centered on screen.
 * Calls onFinish() after a fixed display duration.
 */
export function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  useEffect(() => {
    const timer = setTimeout(onFinish, DISPLAY_DURATION_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container} pointerEvents="none">
      <Image
        source={require("@/assets/splash-background.jpg")}
        style={styles.background}
        resizeMode="cover"
      />
      <View style={styles.card}>
        <Image source={require("@/assets/logo.png")} style={styles.logo} resizeMode="contain" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  background: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  card: {
    position: "absolute",
    left: "50%",
    top: "50%",
    marginLeft: -70,
    marginTop: -70,
    width: 140,
    height: 140,
    borderRadius: 24,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  logo: {
    width: 100,
    height: 100,
  },
});
