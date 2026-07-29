import { View, TouchableOpacity, Platform, StyleSheet, Text } from "react-native";
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
const FLOAT_RADIUS = 26;

export function CustomTabBar({ state, descriptors, navigation }: TabBarProps) {
  const { isDark } = useTheme();
  const openDrawer = useDrawerStore((s) => s.open);

  const borderColor = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.08)";
  const inactiveColor = isDark ? "rgba(255,255,255,0.40)" : "rgba(29,58,46,0.45)";
  const paddingBottom = Platform.OS === "ios" ? 20 : 8;

  return (
    // Outer reserves the SAME height as before (content padding on every screen is
    // unchanged); only the inner bar floats — inset margins, rounded corners, full glass.
    <View
      style={{ height: TAB_HEIGHT + (Platform.OS === "ios" ? 20 : 0) }}
      accessibilityRole="tablist"
    >
      <View
        style={{
          position: "absolute",
          left: 10,
          right: 10,
          top: 0,
          bottom: 4,
          borderRadius: FLOAT_RADIUS,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: isDark ? 0.42 : 0.15,
          shadowRadius: 16,
          elevation: 12,
        }}
      >
        <GlassSurface
          rounded="none"
          bordered
          style={[StyleSheet.absoluteFill, { borderRadius: FLOAT_RADIUS, borderWidth: 1, borderColor }]}
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
              style={{ flex: 1, alignItems: "center", justifyContent: "flex-end", paddingBottom: Platform.OS === "ios" ? 10 : 6, gap: 3 }}
            >
              <TouchableOpacity
                onPress={onPress}
                onLongPress={onLongPress}
                accessibilityRole="tab"
                accessibilityLabel={options.tabBarAccessibilityLabel ?? "TrekSage AI"}
                accessibilityState={{ selected: isFocused }}
                style={{
                  width: FAB_SIZE,
                  height: FAB_SIZE,
                  borderRadius: FAB_SIZE / 2,
                  backgroundColor: isFocused ? "#c4601f" : SAFFRON,
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: -18,
                  shadowColor: SAFFRON,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 12,
                  elevation: 8,
                }}
              >
                <Ionicons name="chatbubbles" size={22} color="#ffffff" />
              </TouchableOpacity>
              <Text
                style={{
                  fontSize: 10,
                  fontWeight: isFocused ? "700" : "500",
                  color: isFocused ? SAFFRON : inactiveColor,
                  fontFamily: "Inter_500Medium",
                  letterSpacing: 0.2,
                }}
                numberOfLines={1}
              >
                TrekSage
              </Text>
            </View>
          );
        }

        const iconName = getIconName(route.name, isFocused);
        const iconColor = isFocused ? SAFFRON : inactiveColor;
        const labelText = getLabelText(route.name);
        const labelColor = isFocused ? SAFFRON : inactiveColor;

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
              justifyContent: "flex-end",
              paddingBottom: Platform.OS === "ios" ? 10 : 6,
              gap: 3,
            }}
          >
            <Ionicons name={iconName} size={22} color={iconColor} />
            <Text
              style={{
                fontSize: 10,
                fontWeight: isFocused ? "700" : "500",
                color: labelColor,
                fontFamily: "Inter_500Medium",
                letterSpacing: 0.2,
              }}
              numberOfLines={1}
            >
              {labelText}
            </Text>
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
