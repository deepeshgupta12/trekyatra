import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface TrekHeroProps {
  imageUrl: string | null;
  title: string;
  state: string | null;
  height?: number;
}

const FALLBACK_BLUR = "L6PZfSi_.AyE_3t7t7R**0o#DgR4";

export function TrekHero({ imageUrl, title, state, height = 300 }: TrekHeroProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { height: height + insets.top }]}>
      <Image
        source={imageUrl ? { uri: imageUrl } : undefined}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        placeholder={FALLBACK_BLUR}
        transition={300}
      />
      <LinearGradient
        colors={["transparent", "rgba(12,14,20,0.85)", "rgba(12,14,20,0.97)"]}
        locations={[0.3, 0.7, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.titleContainer, { paddingBottom: 20 }]}>
        {state && <Text style={styles.stateLabel}>{state}</Text>}
        <Text style={styles.title}>{title}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    justifyContent: "flex-end",
  },
  titleContainer: {
    paddingHorizontal: 20,
    gap: 4,
  },
  stateLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.65)",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ffffff",
    lineHeight: 30,
    fontFamily: "PlayfairDisplay_700Bold",
  },
});
