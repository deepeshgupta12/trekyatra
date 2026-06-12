import { useEffect } from "react";
import { Image, StyleSheet } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface AnimatedSplashProps {
  onFinish: () => void;
}

const DISPLAY_DURATION_MS = 1800;
const FADE_OUT_MS = 350;

/**
 * Splash composition: full-bleed background photo with a white,
 * rounded-corner card holding the logo, centered on screen. The logo
 * scales/fades in on mount, then the whole overlay fades out so it
 * crossfades into the onboarding screen mounted underneath.
 */
export function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const containerOpacity = useSharedValue(1);
  const logoScale = useSharedValue(0.85);
  const logoOpacity = useSharedValue(0);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 450, easing: Easing.out(Easing.ease) });
    logoScale.value = withSequence(
      withTiming(1.08, { duration: 500, easing: Easing.out(Easing.cubic) }),
      withTiming(1, { duration: 250, easing: Easing.inOut(Easing.ease) })
    );

    containerOpacity.value = withDelay(
      DISPLAY_DURATION_MS - FADE_OUT_MS,
      withTiming(0, { duration: FADE_OUT_MS, easing: Easing.in(Easing.ease) }, () => {
        runOnJS(onFinish)();
      })
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
      <Image
        source={require("@/assets/splash-background.jpg")}
        style={styles.background}
        resizeMode="cover"
      />
      <Animated.View style={[styles.card, logoStyle]}>
        <Image source={require("@/assets/logo.png")} style={styles.logo} resizeMode="contain" />
      </Animated.View>
    </Animated.View>
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
    marginLeft: -76,
    marginTop: -76,
    width: 152,
    height: 152,
    borderRadius: 26,
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
    width: 110,
    height: 110,
  },
});
