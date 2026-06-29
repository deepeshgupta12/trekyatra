import * as Location from "expo-location";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CACHE_KEY = "ty_user_location";
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export interface UserLocation {
  lat: number;
  lon: number;
  ts: number;
}

export async function getUserLocation(): Promise<UserLocation | null> {
  try {
    const cached = await AsyncStorage.getItem(CACHE_KEY);
    if (cached) {
      const loc: UserLocation = JSON.parse(cached);
      if (Date.now() - loc.ts < CACHE_TTL_MS) return loc;
    }
  } catch {
    // cache miss — proceed to request
  }

  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== Location.PermissionStatus.GRANTED) return null;

  try {
    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    const loc: UserLocation = {
      lat: pos.coords.latitude,
      lon: pos.coords.longitude,
      ts: Date.now(),
    };
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(loc));
    return loc;
  } catch {
    return null;
  }
}

export async function clearLocationCache(): Promise<void> {
  await AsyncStorage.removeItem(CACHE_KEY);
}
