import { useEffect } from "react";
import { Image, StyleSheet, Text } from "react-native";
import Svg, { Circle, Defs, G, Path, RadialGradient, Stop } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { fonts } from "@/constants/theme";

const AnimatedPath = Animated.createAnimatedComponent(Path);

const TRAIL_LENGTH = 200;

interface AnimatedSplashProps {
  onFinish: () => void;
}

/**
 * "The Trail Comes Alive" cinematic splash sequence.
 * Code-based SVG + Reanimated approximation of a hand-illustrated
 * Lottie animation: dawn mountains -> trail draws upward -> waypoint
 * icons -> trail becomes the logo -> sunrise glow -> tagline.
 */
export function AnimatedSplash({ onFinish }: AnimatedSplashProps) {
  const mountainOpacity = useSharedValue(0);
  const trailOpacity = useSharedValue(0);
  const trailDashOffset = useSharedValue(TRAIL_LENGTH);
  const iconsOpacity = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.6);
  const glowOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);
  const containerOpacity = useSharedValue(1);

  useEffect(() => {
    mountainOpacity.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) });

    trailOpacity.value = withSequence(
      withDelay(500, withTiming(1, { duration: 200 })),
      withDelay(1500, withTiming(0, { duration: 300 }))
    );
    trailDashOffset.value = withDelay(
      500,
      withTiming(0, { duration: 900, easing: Easing.out(Easing.cubic) })
    );

    iconsOpacity.value = withDelay(1400, withTiming(1, { duration: 700 }));

    logoOpacity.value = withDelay(2200, withTiming(1, { duration: 500 }));
    logoScale.value = withDelay(2200, withSpring(1, { damping: 9, stiffness: 110 }));

    glowOpacity.value = withDelay(2800, withTiming(1, { duration: 500 }));

    taglineOpacity.value = withDelay(3300, withTiming(1, { duration: 500 }));

    containerOpacity.value = withDelay(
      3800,
      withTiming(0, { duration: 350 }, (finished) => {
        if (finished) runOnJS(onFinish)();
      })
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({ opacity: containerOpacity.value }));
  const iconsStyle = useAnimatedStyle(() => ({ opacity: iconsOpacity.value }));
  const taglineStyle = useAnimatedStyle(() => ({ opacity: taglineOpacity.value }));
  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));

  const trailAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: trailDashOffset.value,
    opacity: trailOpacity.value,
  }));

  const mountainAnimatedProps = useAnimatedProps(() => ({
    opacity: mountainOpacity.value,
  }));

  const glowAnimatedProps = useAnimatedProps(() => ({
    opacity: glowOpacity.value,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 100 200" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <RadialGradient id="sunrise" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#E8702A" stopOpacity={0.9} />
            <Stop offset="60%" stopColor="#E8702A" stopOpacity={0.25} />
            <Stop offset="100%" stopColor="#E8702A" stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Sunrise glow behind the peak */}
        <AnimatedCircle cx={58} cy={96} r={42} fill="url(#sunrise)" animatedProps={glowAnimatedProps} />

        {/* Dawn mountain silhouette */}
        <AnimatedG animatedProps={mountainAnimatedProps}>
          <Path d="M0,150 L20,115 L40,135 L60,90 L80,125 L100,110 L100,200 L0,200 Z" fill="#202b3d" />
          <Path d="M0,170 L15,140 L35,155 L55,118 L75,150 L95,135 L100,145 L100,200 L0,200 Z" fill="#10151f" />
        </AnimatedG>

        {/* Glowing trail drawn upward, becomes the path to the logo */}
        <AnimatedPath
          d="M50,196 C55,176 40,166 48,146 C56,126 42,111 58,97"
          stroke="#E8702A"
          strokeWidth={1.6}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={TRAIL_LENGTH}
          animatedProps={trailAnimatedProps}
        />
      </Svg>

      {/* Waypoint icons along the trail */}
      <Animated.View style={[styles.icon, { left: "43%", top: "73%" }, iconsStyle]}>
        <Ionicons name="triangle" size={14} color="#F0934D" />
      </Animated.View>
      <Animated.View style={[styles.icon, { left: "48%", top: "60%" }, iconsStyle]}>
        <Ionicons name="leaf" size={14} color="#3F7A5E" />
      </Animated.View>
      <Animated.View style={[styles.icon, { left: "58%", top: "50%" }, iconsStyle]}>
        <Ionicons name="sparkles" size={12} color="#FAF5EE" />
      </Animated.View>

      {/* Logo settles at the peak as the trail's destination */}
      <Animated.View style={[styles.logoWrap, logoStyle]}>
        <Image source={require("@/assets/logo.png")} style={styles.logo} resizeMode="contain" />
      </Animated.View>

      {/* Tagline */}
      <Animated.View style={[styles.taglineWrap, taglineStyle]}>
        <Text style={styles.tagline}>Explore. Dream. Discover.</Text>
      </Animated.View>
    </Animated.View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0c0e14",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  icon: {
    position: "absolute",
  },
  logoWrap: {
    position: "absolute",
    left: "50%",
    top: "38%",
    marginLeft: -70,
    marginTop: -70,
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 140,
    height: 140,
  },
  taglineWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: "58%",
    alignItems: "center",
  },
  tagline: {
    fontFamily: fonts.bodyMed,
    fontSize: 14,
    letterSpacing: 1,
    color: "#FAF5EE",
  },
});
