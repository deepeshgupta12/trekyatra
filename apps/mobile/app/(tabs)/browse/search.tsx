import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { SafeArea } from "@/components/ui/SafeArea";
import { useTheme } from "@/hooks/useTheme";
import { contentApi, type SearchSuggestion } from "@/lib/mobileApi";

export default function SearchScreen() {
  const { colors, isDark } = useTheme();
  const [query, setQuery] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["search-suggestions", query],
    queryFn: () => contentApi.getSearchSuggestions(query),
    enabled: query.trim().length >= 2,
    staleTime: 60 * 1000,
  });

  const results = data ?? [];

  const handleSelect = (item: SearchSuggestion) => {
    if (item.page_type === "trek_guide") {
      router.push(`/(tabs)/(home)/trek/${item.slug}` as never);
    } else {
      router.push(`/(tabs)/(home)/guide/${item.slug}` as never);
    }
  };

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
        </View>
      </View>

      {query.trim().length < 2 ? (
        <View style={styles.center}>
          <Text style={[styles.placeholderText, { color: colors.textMuted }]}>
            Start typing to search
          </Text>
        </View>
      ) : isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.saffron} />
        </View>
      ) : results.length === 0 ? (
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
          renderItem={({ item }) => (
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
                <Text style={[styles.resultTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                  {item.title}
                </Text>
                {item.seo_description ? (
                  <Text style={[styles.resultDesc, { color: colors.textMuted }]} numberOfLines={2}>
                    {item.seo_description}
                  </Text>
                ) : null}
              </View>
            </TouchableOpacity>
          )}
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
  },
  placeholderText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
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
  resultTitle: {
    fontSize: 14,
    fontWeight: "600",
    fontFamily: "Inter_600SemiBold",
  },
  resultDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
