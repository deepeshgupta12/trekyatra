import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from "expo-speech-recognition";
import { SafeArea } from "@/components/ui/SafeArea";
import { useTheme } from "@/hooks/useTheme";
import { contentApi, type SearchSuggestion, type SemanticSearchResult } from "@/lib/mobileApi";
import { useRecentSearches } from "@/hooks/useRecentSearches";
import { useTrendingSearches } from "@/hooks/useTrendingSearches";
import { useSemanticSearch } from "@/hooks/useSemanticSearch";
import { trackSearch } from "@/lib/analytics";

const VOICE_AVAILABLE =
  Platform.OS !== "web" && ExpoSpeechRecognitionModule.isRecognitionAvailable();

export default function SearchScreen() {
  const { colors, isDark } = useTheme();
  const [query, setQuery] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches } =
    useRecentSearches();
  const { data: trending } = useTrendingSearches();
  const { data: semanticData } = useSemanticSearch(query);

  const { data, isLoading } = useQuery({
    queryKey: ["search-suggestions", query],
    queryFn: () => contentApi.getSearchSuggestions(query),
    enabled: query.trim().length >= 2,
    staleTime: 60 * 1000,
  });

  const results = data ?? [];
  const trendingQueries = trending ?? [];
  const resultSlugs = new Set(results.map((r) => r.slug));
  const semanticResults = (semanticData ?? []).filter((r) => !resultSlugs.has(r.slug));

  // Track a search once per distinct settled query (search-as-you-type → one event per query).
  const lastTrackedQuery = useRef("");
  useEffect(() => {
    const q = query.trim();
    if (q.length >= 2 && data && q !== lastTrackedQuery.current) {
      lastTrackedQuery.current = q;
      trackSearch(q, results.length + semanticResults.length);
    }
  }, [data, query]);

  useSpeechRecognitionEvent("start", () => setIsRecording(true));
  useSpeechRecognitionEvent("end", () => setIsRecording(false));
  useSpeechRecognitionEvent("error", () => setIsRecording(false));
  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results[0]?.transcript;
    if (transcript) setQuery(transcript);
  });

  const handleMicPress = async () => {
    try {
      if (isRecording) {
        ExpoSpeechRecognitionModule.stop();
        return;
      }
      // In Expo Go the NSSpeechRecognitionUsageDescription plist key is absent,
      // which causes a native TCC crash before JS can catch anything. Detect Expo
      // Go early and show a friendly message instead of crashing.
      if ((Constants as Record<string, unknown>).appOwnership === "expo") {
        Alert.alert(
          "Voice Search Unavailable",
          "Voice search requires the full TrekYatra app. Please download or rebuild the app to enable this feature.",
          [{ text: "OK" }]
        );
        return;
      }
      const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Microphone Permission Required",
          "Please enable microphone access in Settings to use voice search.",
          [{ text: "OK" }]
        );
        return;
      }
      ExpoSpeechRecognitionModule.start({ lang: "en-US", interimResults: true });
    } catch (error) {
      console.warn("Voice search unavailable:", error);
      setIsRecording(false);
      Alert.alert("Voice Search", "Voice search is temporarily unavailable. Please try again later.");
    }
  };

  const navigateToResult = (slug: string, pageType: string) => {
    if (pageType === "trek_guide") {
      router.push(`/(tabs)/(home)/trek/${slug}` as never);
    } else {
      router.push(`/(tabs)/(home)/guide/${slug}` as never);
    }
  };

  const handleSelect = (item: SearchSuggestion | SemanticSearchResult) => {
    addRecentSearch(query);
    contentApi.logSearch(query, item.slug, item.page_type);
    navigateToResult(item.slug, item.page_type);
  };

  const renderResultRow = (item: SearchSuggestion | SemanticSearchResult, smartMatch: boolean) => (
    <TouchableOpacity
      style={[styles.resultRow, { borderColor: colors.border }]}
      activeOpacity={0.7}
      onPress={() => handleSelect(item)}
    >
      {item.hero_image_url ? (
        <Image source={{ uri: item.hero_image_url }} style={styles.thumb} />
      ) : (
        <View
          style={[
            styles.thumb,
            { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(29,58,46,0.08)" },
          ]}
        />
      )}
      <View style={styles.resultText}>
        <View style={styles.resultTitleRow}>
          <Text style={[styles.resultTitle, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.title}
          </Text>
          {smartMatch && (
            <View style={[styles.badge, { backgroundColor: colors.accent + "1A" }]}>
              <Text style={[styles.badgeText, { color: colors.accent }]}>Smart match</Text>
            </View>
          )}
        </View>
        {item.seo_description ? (
          <Text style={[styles.resultDesc, { color: colors.textMuted }]} numberOfLines={2}>
            {item.seo_description}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  const showEmptyQueryState = query.trim().length < 2;

  return (
    <SafeArea>
      <View style={styles.inputWrapper}>
        <View
          style={[
            styles.inputBar,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Ionicons name="search" size={18} color={colors.saffron} />
          <TextInput
            autoFocus
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => addRecentSearch(query)}
            placeholder="Search treks, regions, seasons…"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { color: colors.textPrimary }]}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")} accessibilityLabel="Clear search">
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
          {VOICE_AVAILABLE && (
            <TouchableOpacity onPress={handleMicPress} accessibilityLabel="Voice search">
              <Ionicons
                name={isRecording ? "mic" : "mic-outline"}
                size={18}
                color={isRecording ? colors.saffron : colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {showEmptyQueryState ? (
        <FlatList
          data={[]}
          renderItem={null}
          keyExtractor={() => ""}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <View>
              {recentSearches.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                      Recent Searches
                    </Text>
                    <TouchableOpacity onPress={clearRecentSearches}>
                      <Text style={[styles.clearAllText, { color: colors.textMuted }]}>
                        Clear all
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.chipRow}>
                    {recentSearches.map((term) => (
                      <TouchableOpacity
                        key={term}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(29,58,46,0.06)",
                            borderColor: colors.border,
                          },
                        ]}
                        activeOpacity={0.7}
                        onPress={() => setQuery(term)}
                      >
                        <Text style={[styles.chipText, { color: colors.textSecondary }]}>{term}</Text>
                        <TouchableOpacity
                          onPress={() => removeRecentSearch(term)}
                          accessibilityLabel={`Remove ${term}`}
                        >
                          <Ionicons name="close" size={14} color={colors.textMuted} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {trendingQueries.length > 0 && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                    Trending Searches
                  </Text>
                  <View style={styles.chipRow}>
                    {trendingQueries.map((term) => (
                      <TouchableOpacity
                        key={term}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(29,58,46,0.06)",
                            borderColor: colors.border,
                          },
                        ]}
                        activeOpacity={0.7}
                        onPress={() => setQuery(term)}
                      >
                        <Ionicons name="trending-up" size={14} color={colors.saffron} />
                        <Text style={[styles.chipText, { color: colors.textSecondary }]}>{term}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {recentSearches.length === 0 && trendingQueries.length === 0 && (
                <View style={styles.center}>
                  <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
                    Start typing to search
                  </Text>
                </View>
              )}
            </View>
          }
        />
      ) : isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.saffron} />
        </View>
      ) : results.length === 0 && semanticResults.length === 0 ? (
        <View style={styles.center}>
          <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
            No results for "{query}"
          </Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.slug}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            semanticResults.length > 0 ? (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                  Suggested for you
                </Text>
                {semanticResults.map((item) => (
                  <View key={item.slug}>{renderResultRow(item, item.matched_by !== "text")}</View>
                ))}
              </View>
            ) : null
          }
          renderItem={({ item }) => renderResultRow(item, false)}
        />
      )}
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  inputWrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    paddingVertical: 0,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    flexGrow: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    marginBottom: 10,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    textDecorationLine: "underline",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    fontFamily: "Inter_400Regular",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
  },
  resultText: {
    flex: 1,
    gap: 2,
  },
  resultTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
    flexShrink: 1,
  },
  resultDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
});
