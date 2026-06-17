import { Tabs } from "expo-router";
import { CustomTabBar } from "@/components/tabs/CustomTabBar";

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Home",
          tabBarAccessibilityLabel: "Home tab",
        }}
      />
      <Tabs.Screen
        name="browse"
        options={{
          title: "Explore",
          tabBarAccessibilityLabel: "Explore tab",
        }}
      />
      <Tabs.Screen
        name="treksage"
        options={{
          title: "TrekSage",
          tabBarAccessibilityLabel: "TrekSage AI assistant",
        }}
      />
      <Tabs.Screen
        name="plan"
        options={{
          title: "Plan",
          tabBarAccessibilityLabel: "Plan my trek",
        }}
      />
      <Tabs.Screen
        name="saved"
        options={{
          title: "Saved",
          tabBarAccessibilityLabel: "Saved treks",
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: "You",
          tabBarAccessibilityLabel: "Your account",
        }}
      />
      <Tabs.Screen
        name="downloads"
        options={{
          href: null,
          title: "Downloads",
        }}
      />
    </Tabs>
  );
}
