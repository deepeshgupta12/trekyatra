import { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
  ImageBackground,
  StatusBar,
  type ImageSourcePropType,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");
const ONBOARDING_KEY = "trekyatra_onboarding_done";
const SAFFRON = "#E8702A";
const PINE = "#1D3A2E";
const SKY = "#5298C9";
const EARTH = "#6B4929";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

interface Slide {
  headline: string;
  subtext: string;
  icon: IoniconName;
  iconColor: string;
  photo: ImageSourcePropType;
}

const SLIDES: Slide[] = [
  {
    headline: "250+ India-first trek guides",
    subtext: "Curated by editors who've been there — from Sahyadris to Sikkim",
    icon: "compass",
    iconColor: SAFFRON,
    photo: require("@/assets/onboarding-1.jpg") as ImageSourcePropType,
  },
  {
    headline: "Trust-first safety intel",
    subtext: "Permits, weather windows, AMS, and risk grades verified by certified guides",
    icon: "shield-checkmark",
    iconColor: PINE,
    photo: require("@/assets/onboarding-2.jpg") as ImageSourcePropType,
  },
  {
    headline: "Offline maps & GPX",
    subtext: "Download routes, elevation profiles & camp coords. Trail-ready, no signal",
    icon: "map",
    iconColor: SKY,
    photo: require("@/assets/onboarding-3.jpg") as ImageSourcePropType,
  },
  {
    headline: "Plan in 60 seconds",
    subtext: "AI matches you to the right trek by season, fitness, budget & start city",
    icon: "sparkles",
    iconColor: EARTH,
    photo: require("@/assets/onboarding-4.jpg") as ImageSourcePropType,
  },
];

export default function WelcomeScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setCurrentIndex(index);
  }

  async function handleGetStarted() {
    await AsyncStorage.setItem(ONBOARDING_KEY, "1");
    router.replace("/(auth)/sign-up");
  }

  async function handleSignIn() {
    await AsyncStorage.setItem(ONBOARDING_KEY, "1");
    router.replace("/(auth)/sign-in");
  }

  function goToNext() {
    const next = currentIndex + 1;
    scrollRef.current?.scrollTo({ x: SCREEN_W * next, animated: true });
    setCurrentIndex(next);
  }

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <View style={{ flex: 1, backgroundColor: PINE }}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Full-bleed photo carousel — positioned absolute to fill screen */}
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        scrollEventThrottle={16}
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
        bounces={false}
      >
        {SLIDES.map((slide, i) => (
          <ImageBackground
            key={i}
            source={slide.photo}
            style={{ width: SCREEN_W, height: SCREEN_H }}
            resizeMode="cover"
          >
            {/* Layered dark gradient overlay from bottom for text legibility */}
            {[0.05, 0.15, 0.3, 0.5, 0.65, 0.75, 0.85].map((opacity, idx) => (
              <View
                key={idx}
                pointerEvents="none"
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: `${(idx + 1) * (55 / 7)}%`,
                  backgroundColor: `rgba(5,8,15,${opacity})`,
                }}
              />
            ))}
          </ImageBackground>
        ))}
      </ScrollView>

      {/* Slide content overlay */}
      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          justifyContent: "flex-end",
          paddingBottom: insets.bottom + 16,
        }}
        pointerEvents="box-none"
      >
        {/* Icon + text for current slide */}
        <View style={{ paddingHorizontal: 28, marginBottom: 32 }}>
          <View
            style={{
              width: 52,
              height: 52,
              borderRadius: 14,
              backgroundColor: "rgba(255,255,255,0.15)",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <Ionicons
              name={SLIDES[currentIndex].icon}
              size={26}
              color={SLIDES[currentIndex].iconColor}
            />
          </View>
          <Text
            style={{
              fontFamily: "PlayfairDisplay_600SemiBold",
              fontSize: 30,
              lineHeight: 38,
              color: "#ffffff",
              marginBottom: 12,
            }}
          >
            {SLIDES[currentIndex].headline}
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 15,
              lineHeight: 22,
              color: "rgba(255,255,255,0.72)",
            }}
          >
            {SLIDES[currentIndex].subtext}
          </Text>
        </View>

        {/* Progress dots */}
        <View
          style={{
            flexDirection: "row",
            paddingHorizontal: 28,
            gap: 6,
            marginBottom: 28,
          }}
        >
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === currentIndex ? 22 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor:
                  i === currentIndex ? SAFFRON : "rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </View>

        {/* CTA buttons */}
        <View style={{ paddingHorizontal: 24, gap: 12 }}>
          {isLast ? (
            <>
              <TouchableOpacity
                onPress={handleGetStarted}
                accessibilityLabel="Start exploring TrekYatra"
                accessibilityRole="button"
                style={{
                  backgroundColor: SAFFRON,
                  borderRadius: 14,
                  paddingVertical: 15,
                  alignItems: "center",
                  shadowColor: SAFFRON,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.45,
                  shadowRadius: 12,
                  elevation: 6,
                }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_600SemiBold",
                    fontSize: 16,
                    color: "#ffffff",
                    letterSpacing: 0.2,
                  }}
                >
                  Start exploring →
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSignIn}
                accessibilityLabel="Sign in to existing account"
                accessibilityRole="button"
                style={{ alignItems: "center", paddingVertical: 10 }}
              >
                <Text
                  style={{
                    fontFamily: "Inter_400Regular",
                    fontSize: 14,
                    color: "rgba(255,255,255,0.55)",
                  }}
                >
                  Already have an account?{" "}
                  <Text style={{ color: SAFFRON, fontFamily: "Inter_600SemiBold" }}>
                    Sign in
                  </Text>
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              onPress={goToNext}
              accessibilityLabel="Next slide"
              accessibilityRole="button"
              style={{
                backgroundColor: SAFFRON,
                borderRadius: 14,
                paddingVertical: 15,
                alignItems: "center",
                shadowColor: SAFFRON,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 10,
                elevation: 6,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 16,
                  color: "#ffffff",
                  letterSpacing: 0.2,
                }}
              >
                Next →
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}
