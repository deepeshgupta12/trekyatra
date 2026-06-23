import { Stack } from "expo-router";
import { useTheme } from "@/hooks/useTheme";

export default function HomeStackLayout() {
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
      <Stack.Screen
        name="trek/[slug]"
        options={{
          title: "",
          headerTransparent: true,
          headerTintColor: "#ffffff",
        }}
      />
      <Stack.Screen name="guide/[slug]" options={{ title: "" }} />
      <Stack.Screen name="packing" options={{ title: "Packing Guide" }} />
      <Stack.Screen name="permits" options={{ title: "Permits" }} />
      <Stack.Screen name="costs" options={{ title: "Trek Costs" }} />
      <Stack.Screen name="safety" options={{ title: "Safety Tips" }} />
      <Stack.Screen name="about" options={{ title: "About TrekYatra" }} />
      <Stack.Screen name="beginner" options={{ title: "Beginner Treks" }} />
      <Stack.Screen name="compare" options={{ title: "Compare Treks" }} />
      <Stack.Screen name="products" options={{ title: "Resources" }} />
      <Stack.Screen name="operators" options={{ title: "Operators" }} />
    </Stack>
  );
}
