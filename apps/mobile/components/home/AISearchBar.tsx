import { TouchableOpacity, Text, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { useTheme } from "@/hooks/useTheme";

interface AISearchBarProps {
  /** Tapping the bar (opens the search / TrekSage screen). */
  onPress: () => void;
  /** Tapping the mic (starts voice search). Hidden when omitted. */
  onVoicePress?: () => void;
  placeholder?: string;
  testID?: string;
}

/**
 * Redesign (v1.1) AI-first search entry — a frosted GlassSurface bar with a saffron
 * sparkle-search glyph and a voice mic. It's an entry point (not a live input): tapping
 * navigates to the full search / TrekSage screen. Voice uses the already-installed
 * expo-speech-recognition (wired by the parent).
 */
export function AISearchBar({
  onPress,
  onVoicePress,
  placeholder = "Ask TrekSage or search treks…",
  testID,
}: AISearchBarProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="search"
      accessibilityLabel="Search treks or ask TrekSage"
      testID={testID ?? "ai-search-bar"}
    >
      <GlassSurface rounded="lg" style={styles.bar}>
        <Ionicons name="sparkles" size={16} color={colors.accent} />
        <Text style={[styles.placeholder, { color: colors.textSecondary }]} numberOfLines={1}>
          {placeholder}
        </Text>
        {onVoicePress ? (
          <TouchableOpacity
            onPress={onVoicePress}
            hitSlop={8}
            style={[styles.mic, { backgroundColor: colors.accent }]}
            accessibilityRole="button"
            accessibilityLabel="Voice search"
            testID="ai-search-voice"
          >
            <Ionicons name="mic" size={15} color="#ffffff" />
          </TouchableOpacity>
        ) : null}
      </GlassSurface>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 13,
    paddingLeft: 15,
    paddingRight: 8,
  },
  placeholder: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  mic: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
});
