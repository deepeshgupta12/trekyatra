import { View, TouchableOpacity, Platform, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useTheme } from "@/hooks/useTheme";
import { GlassSurface } from "@/components/ui/GlassSurface";
import { useDrawerStore } from "@/stores/drawerStore";

// Inline type — avoids importing from expo-router's internal build path
interface TabRoute {
  key: string;
  name: string;
}

interface TabDescriptorOptions {
  // Permissive — expo-router passes render functions too
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tabBarLabel?: any;
  title?: string;
  tabBarAccessibilityLabel?: string;
  href?: string | null;
}

interface TabBarProps {
  state: { routes: TabRoute[]; index: number };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  descriptors: Record<string, { options: TabDescriptorOptions; [k: string]: any }>;
  // expo-router internal navigation type is not publicly exported
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
}

const SAFFRON = "#E8702A";
const FAB_SIZE = 54;
const TAB_HEIGHT = Platform.OS === "ios" ? 56 : 50;

export function CustomTabBar({ state, descriptors, navigation }: TabBarProps) {
  const { isDark } = useTheme();
  const openDrawer = useDrawerStore((s) => s.open);

  const borderColor = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";
  const inactiveColor = isDark ? "rgba(255,255,255,0.40)" : "rgba(29,58,46,0.45)";
  const paddingBottom = Platform.OS === "ios" ? 20 : 8;

  return (
    <View
      style={{
        height: TAB_HEIGHT + (Platform.OS === "ios" ? 20 : 0),
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: isDark ? 0.3 : 0.08,
        shadowRadius: 8,
        elevation: 8,
      }}
      accessibilityRole="tablist"
    >
      <GlassSurface
        rounded="none"
        bordered={false}
        style={[StyleSheet.absoluteFill, { borderTopWidth: 1, borderTopColor: borderColor }]}
      />
      <View
        style={{
          flexDirection: "row",
          paddingBottom,
          paddingTop: 8,
          alignItems: "flex-end",
          flex: 1,
        }}
      >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        if (options.href === null) return null;
        // account and saved are in the hamburger drawer; downloads is internal
        if (route.name === "downloads" || route.name === "account" || route.name === "saved") return null;
        const isFocused = state.index === index;
        const isCenter = route.name === "treksage";

        function onPress() {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!event.defaultPrevented) {
            if (isFocused && route.name === "(home)") {
              // Already on home tab — pop any sub-screens (e.g. About) back to root
              router.navigate("/(tabs)/(home)" as never);
            } else if (!isFocused) {
              navigation.navigate(route.name);
            }
          }
        }

        function onLongPress() {
          navigation.emit({ type: "tabLongPress", target: route.key });
        }

        if (isCenter) {
          return (
            <View
              key={route.key}
              style={{ flex: 1, alignItems: "center", justifyContent: "flex-end" }}
            >
              <TouchableOpacity
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityRole="tab"
                accessibilityLabel={options.tabBarAccessibilityLabel ?? "Plan my trek"}
                accessibilityState={{ selected: isFocused }}
                style={{
                  width: FAB_SIZE,
                  height: FAB_SIZE,
                  borderRadius: FAB_SIZE / 2,
                  backgroundColor: SAFFRON,
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: Platform.OS === "ios" ? 12 : 4,
                  marginTop: -20,
                  shadowColor: SAFFRON,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <Ionicons name="chatbubbles" size={22} color="#ffffff" />
              </TouchableOpacity>
            </View>
          );
        }

        const iconName = getIconName(route.name, isFocused);
        const iconColor = isFocused ? SAFFRON : inactiveColor;
        const labelText = getLabelText(route.name);

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            onLongPress={onLongPress}
            accessibilityRole="tab"
            accessibilityLabel={options.tabBarAccessibilityLabel ?? labelText}
            accessibilityState={{ selected: isFocused }}
            testID={`tab-${route.name}`}
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "center",
              paddingBottom: Platform.OS === "ios" ? 14 : 6,
            }}
          >
            <Ionicons name={iconName} size={24} color={iconColor} />
            {isFocused && (
              <View
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 2,
                  backgroundColor: SAFFRON,
                  marginTop: 4,
                }}
              />
            )}
          </TouchableOpacity>
        );
      })}

        {/* Hamburger menu button — replaces account + saved tabs */}
        <TouchableOpacity
          onPress={openDrawer}
          accessibilityRole="button"
          accessibilityLabel="Open menu"
          testID="tab-menu"
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            paddingBottom: Platform.OS === "ios" ? 14 : 6,
          }}
        >
          <Ionicons name="menu" size={24} color={inactiveColor} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function getIconName(
  routeName: string,
  focused: boolean
): React.ComponentProps<typeof Ionicons>["name"] {
  switch (routeName) {
    case "(home)":
      return focused ? "home" : "home-outline";
    case "browse":
      return focused ? "compass" : "compass-outline";
    case "plan":
      return focused ? "sparkles" : "sparkles-outline";
    case "saved":
      return focused ? "bookmark" : "bookmark-outline";
    case "account":
      return focused ? "person-circle" : "person-circle-outline";
    default:
      return "ellipse-outline";
  }
}

function getLabelText(routeName: string): string {
  switch (routeName) {
    case "(home)":
      return "Home";
    case "browse":
      return "Explore";
    case "treksage":
      return "TrekSage";
    case "plan":
      return "Plan";
    case "saved":
      return "Saved";
    case "account":
      return "You";
    default:
      return routeName;
  }
}
