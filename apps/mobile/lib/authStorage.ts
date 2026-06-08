import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

const ACCESS_KEY = "trekyatra_access_token";
const REFRESH_KEY = "trekyatra_refresh_token";
const DEVICE_KEY = "trekyatra_device_id";

export async function saveTokens(access: string, refresh: string): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_KEY, access),
    SecureStore.setItemAsync(REFRESH_KEY, refresh),
  ]);
}

export async function loadTokens(): Promise<{ access: string | null; refresh: string | null }> {
  const [access, refresh] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_KEY),
    SecureStore.getItemAsync(REFRESH_KEY),
  ]);
  return { access, refresh };
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_KEY).catch(() => {}),
    SecureStore.deleteItemAsync(REFRESH_KEY).catch(() => {}),
  ]);
}

export async function getOrCreateDeviceId(): Promise<string> {
  const stored = await SecureStore.getItemAsync(DEVICE_KEY);
  if (stored) return stored;
  // Generate a stable device UUID using expo-crypto
  const newId = Crypto.randomUUID();
  await SecureStore.setItemAsync(DEVICE_KEY, newId);
  return newId;
}

export async function getDeviceId(): Promise<string | null> {
  return SecureStore.getItemAsync(DEVICE_KEY);
}
