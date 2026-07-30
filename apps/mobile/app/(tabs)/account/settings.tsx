import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
  ActivityIndicator,
  Linking,
} from "react-native";
import { SafeArea } from "@/components/ui/SafeArea";
import { useTheme } from "@/hooks/useTheme";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/hooks/useAuth";
import { useAccountMe, useNewsletter } from "@/hooks/useAccount";
import { getAnalyticsConsent, setAnalyticsConsent } from "@/lib/consent";
import Constants from "expo-constants";

const APP_LANGUAGE_KEY = "app_language";
const BIOMETRIC_KEY = "biometric_enabled";

// Read the real marketing version from app config (app.config.ts `version`) — stays in sync per release (D24).
const APP_VERSION = Constants.expoConfig?.version ?? "1.1.0";

const LEGAL_LINKS = [
  { label: "Terms of Service", url: "https://www.trekyatra.co.in/terms" },
  { label: "Privacy Policy", url: "https://www.trekyatra.co.in/privacy" },
  { label: "Affiliate Disclosure", url: "https://www.trekyatra.co.in/affiliate-disclosure" },
  { label: "Safety Disclaimer", url: "https://www.trekyatra.co.in/safety-disclaimer" },
];

export default function SettingsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { me, updateMe, isUpdating } = useAccountMe();
  const { subscribe: subscribeNewsletter, status: newsletterStatus } = useNewsletter();

  const [nameEdit, setNameEdit] = useState("");
  const [nameEditActive, setNameEditActive] = useState(false);
  const [language, setLanguage] = useState<"en" | "hi">("en");
  const [biometric, setBiometric] = useState(false);
  const [analyticsOn, setAnalyticsOn] = useState(getAnalyticsConsent());
  const [newsletterEmail, setNewsletterEmail] = useState("");

  useEffect(() => {
    (async () => {
      const lang = await AsyncStorage.getItem(APP_LANGUAGE_KEY);
      if (lang === "hi") setLanguage("hi");
      const bio = await AsyncStorage.getItem(BIOMETRIC_KEY);
      if (bio === "true") setBiometric(true);
    })();
  }, []);

  useEffect(() => {
    if (me) setNameEdit(me.full_name ?? "");
    if (user?.email) setNewsletterEmail(user.email);
  }, [me, user]);

  async function handleSaveName() {
    if (!nameEdit.trim()) return;
    try {
      await updateMe({ full_name: nameEdit.trim() });
      setNameEditActive(false);
    } catch {
      Alert.alert("Error", "Could not update name. Please try again.");
    }
  }

  async function handleLanguageToggle(lang: "en" | "hi") {
    setLanguage(lang);
    await AsyncStorage.setItem(APP_LANGUAGE_KEY, lang);
  }

  async function handleBiometricToggle(val: boolean) {
    setBiometric(val);
    await AsyncStorage.setItem(BIOMETRIC_KEY, val ? "true" : "false");
  }

  async function handleNewsletterSubscribe() {
    if (!newsletterEmail.trim()) return;
    await subscribeNewsletter(newsletterEmail.trim());
  }

  function handleSignOut() {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: signOut },
    ]);
  }

  return (
    <SafeArea>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 16,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: "PlayfairDisplay_700Bold",
            fontSize: 22,
            color: colors.textPrimary,
          }}
        >
          Settings
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>

        {/* Profile section */}
        <SectionLabel label="Profile" colors={colors} />
        <SectionCard colors={colors}>
          {/* Name */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={labelStyle(colors)}>Display name</Text>
            {nameEditActive ? (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
                <TextInput
                  value={nameEdit}
                  onChangeText={setNameEdit}
                  style={{
                    flex: 1,
                    fontFamily: "Inter_400Regular",
                    fontSize: 15,
                    color: colors.textPrimary,
                    backgroundColor: colors.background,
                    borderRadius: 10,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderWidth: 1,
                    borderColor: colors.accent + "55",
                  }}
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                />
                <TouchableOpacity
                  onPress={handleSaveName}
                  disabled={isUpdating}
                  style={{
                    backgroundColor: colors.accent,
                    borderRadius: 10,
                    paddingHorizontal: 14,
                    justifyContent: "center",
                  }}
                >
                  {isUpdating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff" }}>
                      Save
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={() => setNameEditActive(true)}
                style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}
              >
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 15, color: colors.textPrimary, flex: 1 }}>
                  {me?.full_name ?? user?.fullName ?? "—"}
                </Text>
                <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: colors.accent }}>
                  Edit
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Email (read-only) */}
          <View style={{ paddingHorizontal: 16, paddingVertical: 14 }}>
            <Text style={labelStyle(colors)}>Email</Text>
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 15, color: colors.textSecondary, marginTop: 4 }}>
              {me?.email ?? user?.email ?? "—"}
            </Text>
          </View>
        </SectionCard>

        {/* App Preferences */}
        <SectionLabel label="App Preferences" colors={colors} />
        <SectionCard colors={colors}>
          {/* Language */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
            }}
          >
            <Text style={{ fontFamily: "Inter_500Medium", fontSize: 15, color: colors.textPrimary, flex: 1 }}>
              Language
            </Text>
            <View style={{ flexDirection: "row", gap: 6 }}>
              {(["en", "hi"] as const).map((lang) => (
                <TouchableOpacity
                  key={lang}
                  onPress={() => handleLanguageToggle(lang)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 7,
                    borderRadius: 20,
                    backgroundColor: language === lang ? colors.accent : colors.background,
                    borderWidth: 1,
                    borderColor: language === lang ? colors.accent : colors.border,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Inter_600SemiBold",
                      fontSize: 13,
                      color: language === lang ? "#fff" : colors.textSecondary,
                    }}
                  >
                    {lang === "en" ? "English" : "हिंदी"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Biometric */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: "Inter_500Medium", fontSize: 15, color: colors.textPrimary }}>
                Biometric login
              </Text>
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                Use Face ID or fingerprint to sign in
              </Text>
            </View>
            <Switch
              value={biometric}
              onValueChange={handleBiometricToggle}
              trackColor={{ false: colors.border, true: colors.accent + "88" }}
              thumbColor={biometric ? colors.accent : colors.textMuted}
            />
          </View>

          {/* Usage analytics (opt-out) */}
          <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.border }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: "Inter_500Medium", fontSize: 15, color: colors.textPrimary }}>
                Usage analytics
              </Text>
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.textSecondary, marginTop: 2 }}>
                Help improve TrekYatra with anonymous usage data
              </Text>
            </View>
            <Switch
              value={analyticsOn}
              onValueChange={(v) => { setAnalyticsOn(v); setAnalyticsConsent(v); }}
              trackColor={{ false: colors.border, true: colors.accent + "88" }}
              thumbColor={analyticsOn ? colors.accent : colors.textMuted}
            />
          </View>
        </SectionCard>

        {/* Notifications */}
        <SectionLabel label="Notifications" colors={colors} />
        <SectionCard colors={colors}>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/account/notifications" as never)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
            accessibilityRole="button"
            activeOpacity={0.7}
          >
            <Text style={{ fontFamily: "Inter_500Medium", fontSize: 15, color: colors.textPrimary, flex: 1 }}>
              Notification preferences
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        </SectionCard>

        {/* Trail Letter Newsletter */}
        <SectionLabel label="Trail Letter Newsletter" colors={colors} />
        <SectionCard colors={colors}>
          <View style={{ padding: 16 }}>
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.textSecondary, marginBottom: 12, lineHeight: 19 }}>
              Get weekly trek picks, permit windows, and trail conditions in your inbox.
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                value={newsletterEmail}
                onChangeText={setNewsletterEmail}
                placeholder="your@email.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
                style={{
                  flex: 1,
                  fontFamily: "Inter_400Regular",
                  fontSize: 14,
                  color: colors.textPrimary,
                  backgroundColor: colors.background,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 9,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              />
              <TouchableOpacity
                onPress={handleNewsletterSubscribe}
                disabled={newsletterStatus === "loading"}
                style={{
                  backgroundColor: newsletterStatus === "success" ? "#22c55e" : colors.accent,
                  borderRadius: 10,
                  paddingHorizontal: 16,
                  justifyContent: "center",
                }}
                accessibilityRole="button"
                accessibilityLabel="Subscribe to Trail Letter"
              >
                {newsletterStatus === "loading" ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff" }}>
                    {newsletterStatus === "success" ? "Subscribed!" : "Subscribe"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
            {newsletterStatus === "error" && (
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: "#ef4444", marginTop: 8 }}>
                Could not subscribe. Please try again.
              </Text>
            )}
          </View>
        </SectionCard>

        {/* About */}
        <SectionLabel label="About" colors={colors} />
        <SectionCard colors={colors}>
          <View style={{ paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: colors.textSecondary }}>
              App version <Text style={{ color: colors.textPrimary }}>{APP_VERSION}</Text>
            </Text>
          </View>
          {LEGAL_LINKS.map((link, i) => (
            <TouchableOpacity
              key={link.label}
              onPress={() => Linking.openURL(link.url)}
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingHorizontal: 16,
                paddingVertical: 13,
                borderBottomWidth: i < LEGAL_LINKS.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
              }}
              accessibilityRole="link"
              accessibilityLabel={link.label}
              activeOpacity={0.7}
            >
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: colors.textPrimary, flex: 1 }}>
                {link.label}
              </Text>
              <Ionicons name="open-outline" size={14} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </SectionCard>

        <View style={{ height: 24 }} />

        {/* Sign out */}
        <TouchableOpacity
          onPress={handleSignOut}
          accessibilityRole="button"
          accessibilityLabel="Sign out"
          activeOpacity={0.7}
          style={{
            marginHorizontal: 20,
            paddingVertical: 14,
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#ef444430",
            backgroundColor: "#ef444410",
            alignItems: "center",
          }}
        >
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 15, color: "#ef4444" }}>
            Sign out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeArea>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

interface ColorsArg {
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  surface: string;
  border: string;
  accent: string;
  background: string;
}

function SectionLabel({ label, colors }: { label: string; colors: ColorsArg }) {
  return (
    <Text
      style={{
        fontFamily: "Inter_600SemiBold",
        fontSize: 12,
        color: colors.textSecondary,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        paddingHorizontal: 20,
        paddingTop: 22,
        paddingBottom: 8,
      }}
    >
      {label}
    </Text>
  );
}

function SectionCard({ children, colors }: { children: React.ReactNode; colors: ColorsArg }) {
  return (
    <View
      style={{
        marginHorizontal: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        overflow: "hidden",
      }}
    >
      {children}
    </View>
  );
}

function labelStyle(colors: ColorsArg) {
  return {
    fontFamily: "Inter_500Medium" as const,
    fontSize: 11,
    color: colors.textSecondary,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  };
}
