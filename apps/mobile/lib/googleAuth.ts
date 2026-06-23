import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri, ResponseType, exchangeCodeAsync } from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

export const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
};

// iOS OAuth client — reversed client ID registered in Info.plist (CFBundleURLTypes) and scheme[].
// Google redirects to this scheme after the user authenticates.
const GOOGLE_REVERSED_SCHEME =
  "com.googleusercontent.apps.445487374089-1qgsnnn3428nuf6qvtiff6bobmvfgvjr";

export const googleRedirectUri = makeRedirectUri({
  scheme: GOOGLE_REVERSED_SCHEME,
});

// Authorization Code + PKCE — the correct modern flow for native mobile apps.
// The implicit (Token) flow sends code_challenge_method which Google rejects for that grant type.
export function getGoogleAuthConfig() {
  return {
    clientId: GOOGLE_CLIENT_ID,
    scopes: ["openid", "profile", "email"],
    responseType: ResponseType.Code,
    redirectUri: googleRedirectUri,
    usePKCE: true,
  };
}

export { exchangeCodeAsync };
