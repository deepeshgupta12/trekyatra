import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

interface TrekHeroProps {
  imageUrl: string | null;
  title: string;
  state: string | null;
  height?: number;
  onShare?: () => void;
}

const FALLBACK_BLUR = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

export function TrekHero({ imageUrl, title, state, height = 360, onShare }: TrekHeroProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { height: height + insets.top }]}>
      <Image
        source={imageUrl ? { uri: imageUrl } : undefined}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        placeholder={FALLBACK_BLUR}
        transition={400}
      />
      {/* Multi-stop gradient: transparent top → dark bottom */}
      <LinearGradient
        colors={["rgba(0,0,0,0.15)", "transparent", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.88)"]}
        locations={[0, 0.25, 0.65, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Back button */}
      <TouchableOpacity
        style={[styles.backBtn, { top: insets.top + 12 }]}
        onPress={() => router.back()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel="Go back"
      >
        <Ionicons name="chevron-back" size={22} color="#fff" />
      </TouchableOpacity>

      {/* Share button */}
      {onShare && (
        <TouchableOpacity
          style={[styles.shareBtn, { top: insets.top + 12 }]}
          onPress={onShare}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Share trek"
        >
          <Ionicons name="share-outline" size={20} color="#fff" />
        </TouchableOpacity>
      )}

      {/* Title + breadcrumb */}
      <View style={[styles.titleContainer, { paddingBottom: 22 }]}>
        {state && (
          <View style={styles.statePill}>
            <Text style={styles.stateLabel}>{state.toUpperCase()}</Text>
          </View>
        )}
        <Text style={styles.title} numberOfLines={3}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    justifyContent: "flex-end",
  },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  shareBtn: {
    position: "absolute",
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  titleContainer: {
    paddingHorizontal: 20,
    gap: 8,
  },
  statePill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(232,112,42,0.85)",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  stateLabel: {
    fontSize: 10,
    color: "#ffffff",
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#ffffff",
    lineHeight: 34,
    fontFamily: "PlayfairDisplay_700Bold",
    textShadowColor: "rgba(0,0,0,0.4)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
});
