import { useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeArea } from "@/components/ui/SafeArea";
import { Button } from "@/components/ui/Button";
import { colors } from "@/constants/theme";

const { width: SCREEN_W } = Dimensions.get("window");
const ONBOARDING_KEY = "trekyatra_onboarding_done";

const SLIDES = [
  {
    headline: "250+ trek guides, offline",
    subtext: "Download complete guides for trails with no signal.",
    emoji: "🏔️",
  },
  {
    headline: "Plan your perfect trek",
    subtext: "Answer 6 questions. Get matched to the right trail for you.",
    emoji: "✨",
  },
  {
    headline: "Permit alerts & conditions",
    subtext: "Get notified before permit windows close.",
    emoji: "🔔",
  },
];

export default function WelcomeScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

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

  const isLast = currentIndex === SLIDES.length - 1;

  return (
    <SafeArea>
      <View className="flex-1">
        {/* Slides */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          className="flex-1"
        >
          {SLIDES.map((slide, i) => (
            <View
              key={i}
              style={{ width: SCREEN_W }}
              className="flex-1 items-center justify-center px-8"
            >
              <Text className="text-7xl mb-8">{slide.emoji}</Text>
              <Text className="font-display text-3xl text-white text-center mb-4 leading-tight">
                {slide.headline}
              </Text>
              <Text className="text-white/60 text-base text-center leading-relaxed">
                {slide.subtext}
              </Text>
            </View>
          ))}
        </ScrollView>

        {/* Dot indicators */}
        <View className="flex-row justify-center gap-2 mb-8">
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={{
                width: i === currentIndex ? 20 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor: i === currentIndex ? colors.accent : colors.textMuted,
              }}
            />
          ))}
        </View>

        {/* CTA */}
        <View className="px-6 pb-8 gap-3">
          {isLast ? (
            <>
              <Button
                variant="hero"
                size="lg"
                onPress={handleGetStarted}
                accessibilityLabel="Get started"
              >
                Get Started
              </Button>
              <TouchableOpacity onPress={handleSignIn} className="items-center py-2">
                <Text className="text-white/50 text-sm">
                  Already have an account?{" "}
                  <Text className="text-accent font-semibold">Sign in</Text>
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <Button
              variant="ghost"
              size="md"
              onPress={() => {
                const next = currentIndex + 1;
                scrollRef.current?.scrollTo({ x: SCREEN_W * next, animated: true });
                setCurrentIndex(next);
              }}
              accessibilityLabel="Next slide"
            >
              Next →
            </Button>
          )}
        </View>
      </View>
    </SafeArea>
  );
}
