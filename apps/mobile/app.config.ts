import type { ConfigContext, ExpoConfig } from "expo/config";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default ({ config }: ConfigContext): any => ({
  ...config,
  name: "TrekYatra",
  slug: "trekyatra",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  splash: {
    backgroundColor: "#0c0e14",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "in.co.trekyatra.app",
    config: {
      usesNonExemptEncryption: false,
    },
    infoPlist: {
      // Required by expo-speech-recognition — without this the app crashes on first mic tap.
      NSSpeechRecognitionUsageDescription:
        "TrekYatra uses speech recognition to let you search for treks by voice.",
      NSMicrophoneUsageDescription:
        "TrekYatra needs microphone access for voice search.",
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
      projectId: process.env.EXPO_PROJECT_ID ?? "",
    },
  },
});
