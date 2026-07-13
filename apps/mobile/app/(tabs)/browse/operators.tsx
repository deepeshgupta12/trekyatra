import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { useState, useMemo } from "react";
import { Ionicons } from "@expo/vector-icons";
import { SafeArea } from "@/components/ui/SafeArea";
import { useTheme } from "@/hooks/useTheme";
import { useOperators } from "@/hooks/useOperators";
import { OperatorCard } from "@/components/operators/OperatorCard";

const REGIONS = ["All", "Uttarakhand", "Himachal Pradesh", "Kashmir", "Sikkim", "Northeast"];

export default function OperatorsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const [activeRegion, setActiveRegion] = useState<string | undefined>(undefined);
  const [search, setSearch] = useState("");

  const { data: operators, isLoading, isError, refetch } = useOperators(activeRegion);

  const filtered = useMemo(() => {
    if (!operators) return [];
    if (!search.trim()) return operators;
    const q = search.toLowerCase();
    return operators.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.region?.some((r) => r.toLowerCase().includes(q)) ||
        o.trek_types?.some((t) => t.toLowerCase().includes(q))
    );
  }, [operators, search]);

  return (
    <SafeArea>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 16,
          paddingTop: 12,
          paddingBottom: 8,
        }}
      >
        <TouchableOpacity
          onPress={() => router.navigate("/(tabs)/browse" as never)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Go back to browse"
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text
            style={{
              fontFamily: "PlayfairDisplay_700Bold",
              fontSize: 22,
              color: colors.textPrimary,
            }}
          >
            Trek Operators
          </Text>
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 12,
              color: colors.textSecondary,
            }}
          >
            Vetted operators across India
          </Text>
        </View>
      </View>

      {/* Search */}
      <View
        style={{
          marginHorizontal: 16,
          marginBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.surface,
          borderRadius: 14,
          borderWidth: 1,
          borderColor: colors.border,
          paddingHorizontal: 12,
          gap: 8,
        }}
      >
        <Ionicons name="search" size={16} color={colors.textMuted} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search operators…"
          placeholderTextColor={colors.textMuted}
          style={{
            flex: 1,
            fontFamily: "Inter_400Regular",
            fontSize: 14,
            color: colors.textPrimary,
            paddingVertical: 11,
          }}
          accessibilityLabel="Search operators"
          clearButtonMode="while-editing"
        />
      </View>

      {/* Region chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 12 }}
      >
        {REGIONS.map((region) => {
          const isActive = region === "All" ? !activeRegion : activeRegion === region;
          return (
            <TouchableOpacity
              key={region}
              onPress={() => setActiveRegion(region === "All" ? undefined : region)}
              accessibilityRole="button"
              accessibilityLabel={`Filter by ${region}`}
              testID={`region-chip-${region}`}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 7,
                borderRadius: 20,
                backgroundColor: isActive ? colors.accent : colors.surface,
                borderWidth: 1,
                borderColor: isActive ? colors.accent : colors.border,
              }}
            >
              <Text
                style={{
                  fontFamily: "Inter_600SemiBold",
                  fontSize: 13,
                  color: isActive ? "#fff" : colors.textSecondary,
                }}
              >
                {region}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      {isLoading ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : isError ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <Ionicons name="alert-circle-outline" size={40} color={colors.textMuted} />
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: colors.textSecondary,
              textAlign: "center",
              marginTop: 12,
              marginBottom: 16,
            }}
          >
            Could not load operators. Check your connection and try again.
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={{
              backgroundColor: colors.accent,
              borderRadius: 12,
              paddingHorizontal: 20,
              paddingVertical: 10,
            }}
            accessibilityRole="button"
          >
            <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff" }}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 }}>
          <Ionicons name="briefcase-outline" size={40} color={colors.textMuted} />
          <Text
            style={{
              fontFamily: "Inter_400Regular",
              fontSize: 14,
              color: colors.textSecondary,
              textAlign: "center",
              marginTop: 12,
            }}
          >
            {search.trim()
              ? `No operators match "${search}".`
              : "No operators found for this region yet."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 32 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <OperatorCard
              operator={item}
              onPress={() =>
                router.push(`/(tabs)/browse/operators/${item.slug}` as never)
              }
            />
          )}
        />
      )}
    </SafeArea>
  );
}
