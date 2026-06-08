import { Platform } from "react-native";
import * as AppleAuthentication from "expo-apple-authentication";

export function isAppleAuthAvailable(): boolean {
  return Platform.OS === "ios";
}

export async function signInWithApple(): Promise<{ identityToken: string; email: string | null; fullName: string | null }> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error("Apple Sign In did not return an identity token.");
  }

  const fullName = credential.fullName
    ? [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(" ") || null
    : null;

  return {
    identityToken: credential.identityToken,
    email: credential.email ?? null,
    fullName,
  };
}
