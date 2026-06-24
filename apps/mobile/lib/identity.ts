import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

const ANON_KEY = "ty_anonymous_id";

let _anonId: string | null = null;
let _userId: string | null = null;

export async function getAnonymousId(): Promise<string> {
  if (_anonId) return _anonId;
  const stored = await SecureStore.getItemAsync(ANON_KEY);
  if (stored) {
    _anonId = stored;
    return stored;
  }
  const id = Crypto.randomUUID();
  await SecureStore.setItemAsync(ANON_KEY, id);
  _anonId = id;
  return id;
}

export function getUserId(): string | null {
  return _userId;
}

export function setUserId(id: string | null): void {
  _userId = id;
}
