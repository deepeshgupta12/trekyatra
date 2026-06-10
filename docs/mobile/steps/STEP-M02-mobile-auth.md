# STEP-M02 — Mobile Auth

**Status:** Done (2026-06-08)
**Phase:** Foundation
**Dependencies:** STEP-M01 (Expo bootstrap)
**Backend dependency:** STEP-M03 issues the mobile token; M02 wires the auth flow, M03 provides the endpoint

---

## Scope

Implement complete authentication for the mobile app. Users must be able to sign in / sign up with email, continue with Google, and use Apple Sign In (required by App Store guidelines). On subsequent opens, biometric re-authentication (Touch ID / Face ID) offers a frictionless login. All tokens are stored securely in the device keystore/keychain via `expo-secure-store`.

This step covers:
- Auth screens (Welcome, Sign In, Sign Up, OTP, Forgot/Reset Password)
- Secure token storage strategy (access token + refresh token)
- Google Sign In (expo-auth-session)
- Apple Sign In (expo-apple-authentication — mandatory for iOS)
- Biometric re-auth (expo-local-authentication)
- Auth state Zustand store
- Route guards (unauthenticated users redirected to auth group)
- Sign out (token purge + device deregistration)

---

## Files to Create

### Auth Screens
| File | Route | Purpose |
|------|-------|---------|
| `apps/mobile/app/(auth)/_layout.tsx` | Auth group | Full-screen stack, no tab bar |
| `apps/mobile/app/(auth)/welcome.tsx` | `/welcome` | 3-slide onboarding carousel (shown only on first launch) |
| `apps/mobile/app/(auth)/sign-in.tsx` | `/sign-in` | Email + password + Google + Apple CTA |
| `apps/mobile/app/(auth)/sign-up.tsx` | `/sign-up` | Name + email + password |
| `apps/mobile/app/(auth)/otp.tsx` | `/otp` | 6-digit OTP verification |
| `apps/mobile/app/(auth)/forgot-password.tsx` | `/forgot-password` | Request reset link |
| `apps/mobile/app/(auth)/reset-password.tsx` | `/reset-password` | Token-based password reset |

### Auth Logic
| File | Purpose |
|------|---------|
| `apps/mobile/stores/authStore.ts` | Zustand store: `user`, `accessToken`, `isLoading`, `isAuthenticated` actions |
| `apps/mobile/lib/authStorage.ts` | SecureStore read/write helpers: `saveTokens`, `loadTokens`, `clearTokens` |
| `apps/mobile/lib/authApi.ts` | Typed API calls: `signIn`, `signUp`, `refreshToken`, `signOut`, `getMe` |
| `apps/mobile/lib/googleAuth.ts` | expo-auth-session Google OAuth flow |
| `apps/mobile/lib/appleAuth.ts` | expo-apple-authentication Sign In with Apple |
| `apps/mobile/lib/biometricAuth.ts` | expo-local-authentication biometric prompt |
| `apps/mobile/components/auth/SocialSignInButtons.tsx` | Google + Apple buttons (consistent placement) |
| `apps/mobile/hooks/useAuth.ts` | Hook exposing auth store state + actions |
| `apps/mobile/hooks/useRequireAuth.ts` | Route guard hook — redirects to /sign-in if not authenticated |

---

## Auth Flow

### First-time sign-in
```
App opens
  → SecureStore: no access token found
  → Navigate to (auth)/welcome (if first launch flag not set)
  → User taps "Sign in" or "Create account"
  → Email/password OR Google OR Apple
  → POST /api/v1/auth/login (email) OR /api/v1/auth/google (Google/Apple)
  → Receive { access_token, refresh_token, user }
  → SecureStore: save access_token + refresh_token
  → authStore: set user + isAuthenticated = true
  → Navigate to (tabs)/index (Home tab)
```

### Returning user (token exists)
```
App opens
  → SecureStore: access token found
  → Decode token: check expiry
    → Not expired: GET /api/v1/auth/me with token → restore user
    → Expired: POST /api/v1/auth/mobile/token (refresh) → new access token saved
  → If biometric enabled in settings:
    → expo-local-authentication.authenticate() prompt
    → On success: proceed to home
    → On fail: redirect to sign-in screen
  → Navigate to last active tab
```

### Sign out
```
User taps "Sign out"
  → DELETE /api/v1/mobile/device/{device_id}  (unregister push token)
  → POST /api/v1/auth/logout
  → SecureStore: clearTokens()
  → authStore: reset to unauthenticated state
  → Navigate to (auth)/sign-in
  → Clear AsyncStorage behavior profile (ty_behavior_v1)
```

---

## Secure Token Storage

```typescript
// lib/authStorage.ts
import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY  = 'trekyatra_access_token';
const REFRESH_KEY = 'trekyatra_refresh_token';
const DEVICE_KEY  = 'trekyatra_device_id';

export async function saveTokens(access: string, refresh: string) {
  await SecureStore.setItemAsync(ACCESS_KEY, access);
  await SecureStore.setItemAsync(REFRESH_KEY, refresh);
}

export async function loadTokens(): Promise<{ access: string | null; refresh: string | null }> {
  const [access, refresh] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);
  return { access, refresh };
}

export async function clearTokens() {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY),
    SecureStore.deleteItemAsync(REFRESH_KEY),
  ]);
}
```

---

## Zustand Auth Store

```typescript
// stores/authStore.ts
interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setLoading: (v: boolean) => void;
}
```

---

## API Wiring

All auth API calls use the **same FastAPI endpoints** as the web, with one addition from Step M03:

| Endpoint | Method | Used for |
|----------|--------|---------|
| `/api/v1/auth/login` | POST | Email/password sign in |
| `/api/v1/auth/register` | POST | Email sign up |
| `/api/v1/auth/google` | POST | Google OAuth token exchange |
| `/api/v1/auth/me` | GET | Restore user session (Bearer header) |
| `/api/v1/auth/logout` | POST | Server-side session invalidation |
| `/api/v1/auth/forgot-password` | POST | Send password reset email |
| `/api/v1/auth/reset-password` | POST | Token-based password reset |
| `/api/v1/auth/mobile/token` | POST | Refresh expired access token (Step M03) |

**Mobile tokens use `Authorization: Bearer <access_token>` header** (not cookies, which don't work well in React Native).

---

## Apple Sign In (Mandatory for iOS)

Apple requires any app with third-party sign-in options to also offer Sign in with Apple. Failure to include it results in App Store rejection.

```typescript
// lib/appleAuth.ts
import * as AppleAuthentication from 'expo-apple-authentication';

export async function signInWithApple() {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  // credential.identityToken → send to /api/v1/auth/apple for server-side verification
  return credential;
}
```

Backend needs `/api/v1/auth/apple` endpoint (extend existing auth module, verify Apple identity token).

---

## Biometric Re-auth

```typescript
// lib/biometricAuth.ts
import * as LocalAuthentication from 'expo-local-authentication';

export async function promptBiometric(): Promise<boolean> {
  const has = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  if (!has || !enrolled) return false; // fall through to PIN/password

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Verify it\'s you',
    cancelLabel: 'Use password instead',
    fallbackLabel: 'Use PIN',
  });
  return result.success;
}
```

Biometric is a re-auth on app resume (not first sign-in). Setting stored in AsyncStorage: `biometric_enabled: boolean`.

---

## Welcome Onboarding Carousel

3 slides shown only on first launch (AsyncStorage flag `onboarding_done`):

| Slide | Headline | Subtext | Image |
|-------|---------|---------|-------|
| 1 | 250+ trek guides, offline | Download guides for trails with no signal | Trek in snow |
| 2 | Plan your perfect trek | Answer 6 questions. Get matched to the right trek. | Wizard mockup |
| 3 | Permit alerts & conditions | Get notified before permit windows close. | Alert screenshot |

Last slide has "Get Started" CTA → navigates to sign-up, and "Sign In" link.

---

## Route Guards

```typescript
// hooks/useRequireAuth.ts
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/(auth)/sign-in');
    }
  }, [isAuthenticated, isLoading]);
}
```

Protected routes: `/saved`, `/account`, `/plan` (full results + lead capture require auth).

---

## New Packages

```json
"expo-auth-session": "~5.5.0",
"expo-apple-authentication": "~6.4.0",
"expo-local-authentication": "~14.0.0",
"expo-web-browser": "~13.0.0"
```

---

## Verification

### Manual smoke tests
1. **TC-M02-01**: Sign up with new email → OTP verification → lands on Home tab
2. **TC-M02-02**: Sign in with existing email → biometric prompt (if enrolled) → Home tab
3. **TC-M02-03**: Google sign-in → completes OAuth → token stored → Home tab
4. **TC-M02-04**: Apple sign-in (iOS only) → identity token verified → Home tab
5. **TC-M02-05**: Kill app + reopen → biometric prompt → auto-login without entering password
6. **TC-M02-06**: Sign out → SecureStore cleared → lands on Sign In screen → can sign in again
7. **TC-M02-07**: Access `/saved` tab without auth → redirected to Sign In
8. **TC-M02-08**: Expired token (mock 0-second expiry in dev) → refresh token used → transparent re-auth
9. **TC-M02-09**: Forgot password → receives email → reset link → new password works

---

## Notes

- `expo-local-authentication` requires a dev build (not Expo Go) — use `eas build --profile development` from Step M01
- Google OAuth redirect URI must be added to the Google Cloud Console Authorized Redirect URIs: `com.trekyatra.app:/oauth2redirect`
- Apple Sign In requires the `Sign In with Apple` capability enabled in the Xcode provisioning profile and in Apple Developer portal
- The backend must extend existing `auth.py` to also accept Bearer token in the `Authorization` header (in addition to the existing HttpOnly cookie) since cookies are unreliable in React Native
- Apple Sign In backend endpoint deferred to M04 — `signInWithApple()` in AuthProvider throws a user-friendly error; Apple button does not appear (onApple not passed to SocialSignInButtons)
- Google OAuth uses `ResponseType.Token` (implicit flow) — exchanges access_token via existing `/auth/google` endpoint, then `/auth/mobile/token` for Bearer token pair
- `@react-native-async-storage/async-storage@2.2.0` added to package.json (needed for onboarding flag + welcome.tsx)
- `.expo/types/router.d.ts` manually updated to include new routes: welcome, otp, forgot-password, reset-password

---

## Google OAuth Pending Setup (Developer Action Required)

Google Sign In will return `EXPO_PUBLIC_GOOGLE_CLIENT_ID is empty` and silently fail until the following setup is completed:

### Step 1 — Create Expo Account
1. Go to [expo.dev](https://expo.dev) → Sign Up (or Log In if you have one)
2. Create a new project named `trekyatra` (matches `apps/mobile/app.config.ts` slug)
3. Note your Expo username — you will use it in step 4

### Step 2 — Create Google OAuth Web Client (for Expo Go + dev builds)
1. Go to [Google Cloud Console](https://console.cloud.google.com) → APIs & Services → Credentials
2. Click **+ Create Credentials** → **OAuth 2.0 Client ID**
3. Application type: **Web application**
4. Name: `TrekYatra Mobile (Expo Dev)`
5. Under **Authorized redirect URIs**, add:
   ```
   https://auth.expo.io/@YOUR_EXPO_USERNAME/trekyatra
   ```
   (Replace `YOUR_EXPO_USERNAME` with your actual Expo username from Step 1)
6. Click **Create** → Copy the **Client ID** (looks like `xxxxx.apps.googleusercontent.com`)

### Step 3 — Create Google OAuth Native Clients (for production EAS builds)
Repeat credential creation twice:
- **Android** type → package: `in.co.trekyatra.app`
- **iOS** type → bundle ID: `in.co.trekyatra.app`

These native client IDs are used in `apps/mobile/app.config.ts` under `googleServicesFile` (via Firebase in M14).

### Step 4 — Set env var locally
Edit `apps/mobile/.env.local`:
```
EXPO_PUBLIC_GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
```
(Use the **Web** client ID from Step 2 — not the Android/iOS client IDs)

### Step 5 — Test Google Sign In in Expo Go
```bash
cd apps/mobile && npx expo start
# Scan QR code with Expo Go app
# Tap "Continue with Google" → browser opens auth.expo.io → completes OAuth
```

> **Status:** `[ ]` Not yet configured (2026-06-08)

---

## Frontend Test Cases — Step M02: Mobile Auth

### TC-M02-F01: Email sign-up happy path
**Prerequisite:** Fresh app install (or cleared AsyncStorage)
**Steps:**
1. Launch app → Welcome carousel appears (3 slides)
2. Tap "Get Started" on last slide
3. Tap "Create account" → Sign Up screen
4. Enter full name, email, password (min 8 chars) → tap "Create account"
**Expected:** User created → lands on Home tab → account tab shows user name
**Pass =** No error, user profile loaded in account tab

### TC-M02-F02: Email sign-in happy path
**Steps:**
1. From sign-in screen, enter registered email + password
2. Tap "Sign in"
**Expected:** Navigates to Home tab, tokens stored in SecureStore
**Pass =** Home tab loads, Account tab shows user details

### TC-M02-F03: Google Sign In (requires EXPO_PUBLIC_GOOGLE_CLIENT_ID set)
**Prerequisite:** `.env.local` has valid Google client ID, Expo account created
**Steps:**
1. Tap "Continue with Google"
2. Browser opens Google auth flow → approve permissions
3. Returns to app
**Expected:** Auth completes, user lands on Home tab
**Pass =** User profile populated, SecureStore has access token

### TC-M02-F04: Route guard — saved tab
**Steps:**
1. Open app without signing in (skip onboarding)
2. Tap Saved tab
**Expected:** Redirected to Sign In screen
**Pass =** Sign In screen appears, not Saved content

### TC-M02-F05: Route guard — account tab
**Steps:**
1. Open app without signing in
2. Tap Account tab
**Expected:** Redirected to Sign In screen
**Pass =** Sign In screen appears

### TC-M02-F06: Forgot password flow
**Steps:**
1. Sign In screen → tap "Forgot password?"
2. Enter registered email → tap "Send reset link"
**Expected:** Success message: "Check your email for a reset link"
**Pass =** No error, success state shown

### TC-M02-F07: Onboarding shown only once
**Steps:**
1. Fresh install → onboarding carousel shows (3 slides)
2. Complete onboarding → sign in
3. Kill app, reopen
**Expected:** Onboarding does NOT show again; goes directly to sign-in or home
**Pass =** No carousel on second launch

### TC-M02-F08: Sign out
**Steps:**
1. Sign in successfully
2. Go to Account tab → tap "Sign out"
**Expected:** App navigates to Sign In screen, tokens cleared
**Pass =** Account tab now shows sign-in redirect on next visit

### TC-M02-F09: Mobile layout (375px)
**Device:** iPhone SE / small Android device (375px wide)
**Steps:**
1. Open welcome, sign-in, sign-up screens
**Expected:** No horizontal overflow, all form fields visible, buttons full-width
**Pass =** No clipping or cut-off elements on small screen

## Implementation Completed (2026-06-08)

### Files Created
| File | Purpose |
|------|---------|
| `apps/mobile/lib/authStorage.ts` | SecureStore helpers: saveTokens, loadTokens, clearTokens, getOrCreateDeviceId |
| `apps/mobile/lib/authApi.ts` | signIn, signUp, getMe, refreshAccessToken, signOutServer, forgotPassword, resetPassword, signInWithGoogle |
| `apps/mobile/lib/googleAuth.ts` | expo-auth-session Google OAuth (ResponseType.Token) |
| `apps/mobile/lib/appleAuth.ts` | expo-apple-authentication native Apple Sign In |
| `apps/mobile/lib/biometricAuth.ts` | expo-local-authentication isBiometricAvailable + promptBiometric |
| `apps/mobile/hooks/useAuth.ts` | Re-exports useAuth from AuthProvider |
| `apps/mobile/hooks/useRequireAuth.ts` | Route guard: redirects unauthenticated users to sign-in |
| `apps/mobile/components/auth/SocialSignInButtons.tsx` | Google + Apple (iOS only when handler provided) buttons |
| `apps/mobile/app/(auth)/welcome.tsx` | 3-slide onboarding carousel, AsyncStorage flag, Get Started + Sign in CTAs |
| `apps/mobile/app/(auth)/otp.tsx` | Placeholder (OTP verification coming M04) |
| `apps/mobile/app/(auth)/forgot-password.tsx` | Email input → POST /auth/forgot-password → success state |
| `apps/mobile/app/(auth)/reset-password.tsx` | Password + confirm → POST /auth/reset-password with token param |
| `apps/mobile/.env.example` | EXPO_PUBLIC_API_URL, EXPO_PUBLIC_GOOGLE_CLIENT_ID, EXPO_PUBLIC_SENTRY_DSN |

### Files Modified
| File | Change |
|------|--------|
| `apps/mobile/app/(auth)/sign-in.tsx` | Full rewrite: email+password form, Google OAuth, forgot-password link |
| `apps/mobile/app/(auth)/sign-up.tsx` | Full rewrite: fullName+email+password form |
| `apps/mobile/app/(auth)/_layout.tsx` | Added welcome, otp, forgot-password, reset-password to Stack |
| `apps/mobile/app/_layout.tsx` | Added AuthGate component with onboarding check + auth-aware redirect |
| `apps/mobile/app/(tabs)/saved.tsx` | Added useRequireAuth() route guard |
| `apps/mobile/app/(tabs)/account.tsx` | Added useRequireAuth() route guard |
| `apps/mobile/stores/authStore.ts` | Replaced setTokens with setAuth (stores user), added setLoading, uses authStorage lib |
| `apps/mobile/providers/AuthProvider.tsx` | Added signIn, signUp, signInWithGoogle, signInWithApple methods |
| `apps/mobile/lib/googleAuth.ts` | Added ResponseType.Token for implicit OAuth flow |
| `apps/mobile/package.json` | Added @react-native-async-storage/async-storage@2.2.0 |
| `apps/mobile/.expo/types/router.d.ts` | Added welcome, otp, forgot-password, reset-password typed routes |
| `apps/mobile/app.config.ts` | Added expo-web-browser and expo-local-authentication to plugins |
