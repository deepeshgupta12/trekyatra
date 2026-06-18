import { Stack } from "expo-router";

export default function PlanLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="step-1" />
      <Stack.Screen name="step-2" />
      <Stack.Screen name="step-3" />
      <Stack.Screen name="step-4" />
      <Stack.Screen name="step-5" />
      <Stack.Screen name="step-6" />
      <Stack.Screen name="results" />
    </Stack>
  );
}
