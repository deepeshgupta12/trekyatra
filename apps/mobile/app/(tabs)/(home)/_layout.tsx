import { Stack } from "expo-router";
import { useTheme } from "@/hooks/useTheme";

export default function HomeStackLayout() {
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
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
    </Stack>
  );
}
