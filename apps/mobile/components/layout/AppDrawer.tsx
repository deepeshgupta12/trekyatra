import { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDrawerStore } from "@/stores/drawerStore";
import { useAuth } from "@/providers/AuthProvider";
import { useTheme } from "@/hooks/useTheme";

const DRAWER_WIDTH = Dimensions.get("window").width * 0.78;
const SAFFRON = "#E8702A";

interface MenuItem {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  label: string;
  route: string;
  authRequired?: boolean;
}

const AUTH_MENU: MenuItem[] = [
  { icon: "bookmark-outline", label: "Saved Treks", route: "/(tabs)/saved" as never, authRequired: true },
  { icon: "git-compare-outline", label: "Comparisons", route: "/(tabs)/(home)/compare" as never, authRequired: true },
  { icon: "mail-outline", label: "Enquiries", route: "/(tabs)/account/enquiries" as never, authRequired: true },
  { icon: "download-outline", label: "Downloads", route: "/(tabs)/account/downloads" as never, authRequired: true },
  { icon: "settings-outline", label: "Settings", route: "/(tabs)/account/settings" as never, authRequired: true },
];

const COMMON_MENU: MenuItem[] = [
  { icon: "storefront-outline", label: "Browse Operators", route: "/(tabs)/browse/operators" as never },
  { icon: "bag-outline", label: "Trek Resources", route: "/(tabs)/browse/products" as never },
];

const INFO_MENU: MenuItem[] = [
  { icon: "information-circle-outline", label: "About TrekYatra", route: "/(tabs)/browse" as never },
  { icon: "shield-checkmark-outline", label: "Safety Tips", route: "/(tabs)/browse" as never },
];

function InitialsAvatar({ name, size = 44 }: { name: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((w) => w[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    >
      <Text style={styles.avatarText}>{initials || "U"}</Text>
    </View>
  );
}

export function AppDrawer() {
  const { isOpen, close } = useDrawerStore();
  const { isAuthenticated, user, signOut } = useAuth();
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const translateX = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setRendered(true);
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: true,
          damping: 20,
          stiffness: 200,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (rendered) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: DRAWER_WIDTH,
          useNativeDriver: true,
          damping: 20,
          stiffness: 260,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => setRendered(false));
    }
  }, [isOpen]);

  if (!rendered) return null;

  const bg = isDark ? "#14161f" : "#ffffff";
  const divider = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.07)";
  const rowBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";

  function navigate(route: string) {
    close();
    setTimeout(() => router.push(route as never), 150);
  }

  function handleSignOut() {
    close();
    setTimeout(() => signOut(), 150);
  }

  function renderRow(item: MenuItem) {
    return (
      <TouchableOpacity
        key={item.label}
        style={[styles.row, { backgroundColor: rowBg }]}
        onPress={() => navigate(item.route)}
        activeOpacity={0.7}
      >
        <View style={[styles.rowIcon, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(29,58,46,0.06)" }]}>
          <Ionicons name={item.icon} size={18} color={colors.textSecondary} />
        </View>
        <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{item.label}</Text>
        <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
      </TouchableOpacity>
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Dark overlay */}
      <TouchableWithoutFeedback onPress={close}>
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: "rgba(0,0,0,0.45)", opacity: overlayOpacity },
          ]}
        />
      </TouchableWithoutFeedback>

      {/* Drawer panel — slides from right */}
      <Animated.View
        style={[
          styles.panel,
          {
            width: DRAWER_WIDTH,
            right: 0,
            backgroundColor: bg,
            paddingTop: insets.top + (Platform.OS === "android" ? 8 : 0),
            paddingBottom: insets.bottom + 16,
            transform: [{ translateX }],
          },
        ]}
      >
        {/* Header row */}
        <View style={[styles.panelHeader, { borderBottomColor: divider }]}>
          <Text style={[styles.panelTitle, { color: colors.textPrimary }]}>Menu</Text>
          <TouchableOpacity onPress={close} style={styles.closeBtn} hitSlop={10}>
            <Ionicons name="close" size={22} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
          {/* Auth section */}
          {isAuthenticated && user ? (
            <>
              <View style={[styles.profileSection, { borderBottomColor: divider }]}>
                <InitialsAvatar name={user.fullName ?? user.email ?? "User"} />
                <View style={styles.profileInfo}>
                  <Text style={[styles.profileName, { color: colors.textPrimary }]} numberOfLines={1}>
                    {user.fullName ?? "Trekker"}
                  </Text>
                  <Text style={[styles.profileEmail, { color: colors.textMuted }]} numberOfLines={1}>
                    {user.email}
                  </Text>
                </View>
              </View>

              <View style={[styles.section, { borderBottomColor: divider }]}>
                {AUTH_MENU.map(renderRow)}
              </View>
            </>
          ) : (
            <View style={[styles.authSection, { borderBottomColor: divider }]}>
              <Text style={[styles.authPrompt, { color: colors.textMuted }]}>
                Sign in to save treks, compare routes, and track your enquiries.
              </Text>
              <View style={styles.authBtns}>
                <TouchableOpacity
                  style={styles.signInBtn}
                  onPress={() => navigate("/(auth)/sign-in")}
                  activeOpacity={0.85}
                >
                  <Text style={styles.signInText}>Sign In</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.signUpBtn, { borderColor: SAFFRON }]}
                  onPress={() => navigate("/(auth)/sign-up")}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.signUpText, { color: SAFFRON }]}>Create Account</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Explore section */}
          <View style={[styles.section, { borderBottomColor: divider }]}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>EXPLORE</Text>
            {COMMON_MENU.map(renderRow)}
          </View>

          {/* Info section */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>MORE</Text>
            {INFO_MENU.map(renderRow)}
            {isAuthenticated && (
              <TouchableOpacity
                style={[styles.row, { backgroundColor: "rgba(239,68,68,0.06)" }]}
                onPress={handleSignOut}
                activeOpacity={0.7}
              >
                <View style={[styles.rowIcon, { backgroundColor: "rgba(239,68,68,0.08)" }]}>
                  <Ionicons name="log-out-outline" size={18} color="#ef4444" />
                </View>
                <Text style={[styles.rowLabel, { color: "#ef4444" }]}>Sign Out</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    top: 0,
    bottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: -4, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 20,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  panelTitle: { fontSize: 17, fontWeight: "700", fontFamily: "PlayfairDisplay_700Bold" },
  closeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  avatar: {
    backgroundColor: SAFFRON,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 15, fontWeight: "700" },
  profileEmail: { fontSize: 12, marginTop: 2 },
  authSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 14,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  authPrompt: { fontSize: 13, lineHeight: 19 },
  authBtns: { flexDirection: "row", gap: 10 },
  signInBtn: {
    flex: 1,
    backgroundColor: SAFFRON,
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: "center",
  },
  signInText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  signUpBtn: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 11,
    alignItems: "center",
  },
  signUpText: { fontWeight: "700", fontSize: 14 },
  section: { paddingHorizontal: 12, paddingBottom: 12, borderBottomWidth: 1, gap: 2 },
  sectionLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1, paddingHorizontal: 4, paddingTop: 8, paddingBottom: 4 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 12,
  },
  rowIcon: {
    width: 34,
    height: 34,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { flex: 1, fontSize: 14, fontWeight: "600" },
});
