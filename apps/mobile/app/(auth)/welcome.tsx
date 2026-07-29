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
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { GlassSurface } from "@/components/ui/GlassSurface";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("screen");
const SAFFRON = "#E8702A";
const PINE = "#1D3A2E";

type IoniconName = React.ComponentProps<typeof Ionicons>["name"];

interface Slide {
  headline: string;
  subtext: string;
  icon: IoniconName;
  photo: ImageSourcePropType;
}

const SLIDES: Slide[] = [
  {
    headline: "250+ India-first trek guides",
    subtext: "Curated by editors who've been there — from Sahyadris to Sikkim",
    icon: "compass",
    photo: require("@/assets/onboarding-1.jpg") as ImageSourcePropType,
  },
  {
    headline: "Trust-first safety intel",
    subtext: "Permits, weather windows, AMS, and risk grades verified by certified guides",
    icon: "shield-checkmark",
    photo: require("@/assets/onboarding-2.jpg") as ImageSourcePropType,
  },
  {
    headline: "Plan in 60 seconds — picked for you",
    subtext: "AI matches you to the right trek by season, fitness & budget — with personalised picks every time you open the app",
    icon: "sparkles",
    photo: require("@/assets/onboarding-3.jpg") as ImageSourcePropType,
  },
  {
    headline: "Trek offline. Book with trusted operators",
    subtext: "Download routes, elevation profiles & camp coords for no-signal trails, then connect with verified local operators to book",
    icon: "download",
    photo: require("@/assets/onboarding-4.jpg") as ImageSourcePropType,
  },
];

export default function WelcomeScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const { markDone } = useOnboarding();

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_W);
    setCurrentIndex(index);
  }

  async function handleGetStarted() {
    // → personalization onboarding (it marks onboarding done + saves prefs at the end).
    router.push("/(auth)/onboarding" as never);
  }

  async function handleSignIn() {
    await markDone();
    router.replace("/(auth)/sign-in");
  }

  async function handleSkip() {
    await markDone();
    router.replace("/(auth)/sign-up");
  }

  function goToNext() {
    const next = currentIndex + 1;
    scrollRef.current?.scrollTo({ x: SCREEN_W * next, animated: true });
    setCurrentIndex(next);
  }

  function goToPrev() {
    const prev = currentIndex - 1;
    if (prev < 0) return;
    scrollRef.current?.scrollTo({ x: SCREEN_W * prev, animated: true });
    setCurrentIndex(prev);
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
            {/* Smooth dark gradient overlay from bottom for text legibility */}
            <LinearGradient
              colors={[
                "transparent",
                "rgba(5,8,15,0.25)",
                "rgba(5,8,15,0.65)",
                "rgba(5,8,15,0.92)",
              ]}
              locations={[0, 0.4, 0.7, 1]}
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
          </ImageBackground>
        ))}
      </ScrollView>

      {/* Top gradient — keeps status bar / back button legible over bright photos */}
      <LinearGradient
        colors={["rgba(5,8,15,0.45)", "transparent"]}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 140,
        }}
        pointerEvents="none"
      />

      {/* Back button — hidden on first slide */}
      {currentIndex > 0 && (
        <TouchableOpacity
          onPress={goToPrev}
          accessibilityLabel="Previous slide"
          accessibilityRole="button"
          style={{
            position: "absolute",
            top: insets.top + 12,
            left: 20,
          }}
        >
          <GlassSurface
            rounded="xl"
            style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
          >
            <Ionicons name="chevron-back" size={22} color="#ffffff" />
          </GlassSurface>
        </TouchableOpacity>
      )}

      {/* Skip button — jumps straight to login/sign-up from any slide */}
      {!isLast && (
        <TouchableOpacity
          onPress={handleSkip}
          accessibilityLabel="Skip onboarding"
          accessibilityRole="button"
          style={{
            position: "absolute",
            top: insets.top + 12,
            right: 20,
          }}
        >
          <GlassSurface
            rounded="xl"
            style={{
              paddingHorizontal: 16,
              height: 40,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "Inter_600SemiBold",
                fontSize: 14,
                color: "#ffffff",
              }}
            >
              Skip
            </Text>
          </GlassSurface>
        </TouchableOpacity>
      )}

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
          <GlassSurface
            rounded="lg"
            style={{
              width: 52,
              height: 52,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 20,
            }}
          >
            <Ionicons
              name={SLIDES[currentIndex].icon}
              size={26}
              color="#ffffff"
            />
          </GlassSurface>
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
