import { View, TouchableOpacity, Text, Platform, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/hooks/useTheme";
import { GlassSurface } from "@/components/ui/GlassSurface";

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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  navigation: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [k: string]: any;
}

const SAFFRON = "#E8702A";
const FAB_SIZE = 56;
const TAB_HEIGHT = Platform.OS === "ios" ? 64 : 56;

export function CustomTabBar({ state, descriptors, navigation }: TabBarProps) {
  const { isDark } = useTheme();

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
        if (route.name === "downloads") return null;
        const isFocused = state.index === index;
        const isCenter = route.name === "treksage";

        function onPress() {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
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
            style={{
              flex: 1,
              alignItems: "center",
              justifyContent: "flex-end",
              paddingBottom: 2,
            }}
          >
            <Ionicons name={iconName} size={22} color={iconColor} />
            <Text
              style={{
                fontSize: 10,
                marginTop: 3,
                fontFamily: "Inter_500Medium",
                color: iconColor,
              }}
            >
              {typeof options.tabBarLabel === "string" ? options.tabBarLabel : labelText}
            </Text>
          </TouchableOpacity>
        );
      })}
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
