import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri, useAuthRequest, ResponseType } from "expo-auth-session";

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export const discovery = {
  authorizationEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
  tokenEndpoint: "https://oauth2.googleapis.com/token",
};

export function getGoogleAuthConfig() {
  return {
    clientId: GOOGLE_CLIENT_ID,
    scopes: ["openid", "profile", "email"],
    responseType: ResponseType.Token,
    redirectUri: makeRedirectUri({
      scheme: "trekyatra",
      path: "oauth2redirect",
    }),
  };
}
