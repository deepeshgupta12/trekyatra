import type { ConfigContext, ExpoConfig } from "expo/config";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ config }: ConfigContext): any => ({
  ...config,
  name: "TrekYatra",
  slug: "trekyatra",
  version: "1.1.0",
  // OTA (EAS Update): ship JS/asset fixes without an App Store review. runtimeVersion
  // is tied to the marketing version — a native rebuild (new version) starts a new
  // runtime, and only updates built against a matching runtimeVersion are delivered.
  runtimeVersion: { policy: "appVersion" },
  updates: {
    url: "https://u.expo.dev/6f97fbb4-7f04-47a8-8bb7-f6d2629f72e2",
    fallbackToCacheTimeout: 0,
  },
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    backgroundColor: "#0c0e14",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "in.co.trekyatra.app",
    // Build number is unique PER marketing version. New version 1.1.0 (redesign) → resets
    // to "1" (1.1.0 (1) can't collide with 1.0.0 (2)). Bump on each rebuild of the SAME
    // version, or switch to EAS remote autoIncrement later.
    buildNumber: "1",
    // Generates the com.apple.developer.applesignin entitlement during EAS prebuild.
    // Without this the native Apple Sign-In sheet (expo-apple-authentication, lib/appleAuth.ts)
    // fails at runtime → Guideline 4.8 rejection (we also offer Google sign-in).
    usesAppleSignIn: true,
    config: {
      usesNonExemptEncryption: false,
    },
    // Apple privacy manifest (mandatory since May 2024). Declares the "required reason" APIs
    // that RN/Expo use (UserDefaults via AsyncStorage, file timestamps, boot time, disk space)
    // with Apple's approved reason codes, plus collected-data types. NSPrivacyCollectedDataTypes
    // MUST stay consistent with the App Store Connect privacy "nutrition labels".
    privacyManifests: {
      NSPrivacyTracking: false,
      NSPrivacyTrackingDomains: [],
      NSPrivacyCollectedDataTypes: [
        {
          NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeEmailAddress",
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: ["NSPrivacyCollectedDataTypePurposeAppFunctionality"],
        },
        {
          NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeCoarseLocation",
          NSPrivacyCollectedDataTypeLinked: true,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: ["NSPrivacyCollectedDataTypePurposeAppFunctionality"],
        },
        {
          NSPrivacyCollectedDataType: "NSPrivacyCollectedDataTypeProductInteraction",
          NSPrivacyCollectedDataTypeLinked: false,
          NSPrivacyCollectedDataTypeTracking: false,
          NSPrivacyCollectedDataTypePurposes: ["NSPrivacyCollectedDataTypePurposeAnalytics"],
        },
      ],
      NSPrivacyAccessedAPITypes: [
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryUserDefaults",
          NSPrivacyAccessedAPITypeReasons: ["CA92.1"],
        },
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryFileTimestamp",
          NSPrivacyAccessedAPITypeReasons: ["C617.1"],
        },
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategorySystemBootTime",
          NSPrivacyAccessedAPITypeReasons: ["35F9.1"],
        },
        {
          NSPrivacyAccessedAPIType: "NSPrivacyAccessedAPICategoryDiskSpace",
          NSPrivacyAccessedAPITypeReasons: ["E174.1"],
        },
      ],
    },
    infoPlist: {
      // Required by expo-speech-recognition — without this the app crashes on first mic tap.
      NSSpeechRecognitionUsageDescription:
        "TrekYatra uses speech recognition to let you search for treks by voice.",
      NSMicrophoneUsageDescription:
        "TrekYatra needs microphone access for voice search.",
      // Required by expo-location (foreground only — no background location used)
      NSLocationWhenInUseUsageDescription:
        "TrekYatra uses your location to show treks near you. We never track you in the background.",
      // Real copy for expo-image-picker (trip-report photos, M17) — Apple rejects generic
      // "$(PRODUCT_NAME)" permission strings.
      NSCameraUsageDescription:
        "TrekYatra needs camera access so you can add your own photos to trip reports.",
      NSPhotoLibraryUsageDescription:
        "TrekYatra needs photo-library access so you can attach photos to your trip reports.",
      CFBundleURLTypes: [
        {
          CFBundleURLSchemes: [
            "com.googleusercontent.apps.445487374089-1qgsnnn3428nuf6qvtiff6bobmvfgvjr",
          ],
        },
      ],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0c0e14",
    },
    package: "in.co.trekyatra.app",
    permissions: ["android.permission.INTERNET"],
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/icon.png",
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-secure-store",
    "expo-web-browser",
    "expo-local-authentication",
    "expo-sqlite",
    "expo-image",
    "expo-sharing",
    [
      "expo-location",
      {
        locationWhenInUsePermission:
          "TrekYatra uses your location to show treks near you. We never track you in the background.",
      },
    ],
    [
      "expo-speech-recognition",
      {
        microphonePermission: "Allow TrekYatra to use the microphone for voice search.",
        speechRecognitionPermission: "Allow TrekYatra to use speech recognition for voice search.",
        androidSpeechServicePackages: ["com.google.android.googlequicksearchbox"],
      },
    ],
  ],
  scheme: [
    "trekyatra",
    "com.googleusercontent.apps.445487374089-1qgsnnn3428nuf6qvtiff6bobmvfgvjr",
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    eas: {
      projectId: process.env.EXPO_PROJECT_ID ?? "6f97fbb4-7f04-47a8-8bb7-f6d2629f72e2",
    },
  },
});
