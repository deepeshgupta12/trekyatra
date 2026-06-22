import { Stack } from "expo-router";
import { useTheme } from "@/hooks/useTheme";

export default function BrowseStackLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackButtonDisplayMode: "minimal",
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: { fontFamily: "PlayfairDisplay_700Bold", fontSize: 17 },
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="search" options={{ title: "Search" }} />
      <Stack.Screen name="regions/[state]" options={{ title: "" }} />
      <Stack.Screen name="seasons/[season]" options={{ title: "" }} />
      <Stack.Screen name="operators" options={{ headerShown: false }} />
      <Stack.Screen name="operators/[slug]" options={{ headerShown: false }} />
    </Stack>
  );
}
