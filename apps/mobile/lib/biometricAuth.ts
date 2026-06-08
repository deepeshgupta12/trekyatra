import * as LocalAuthentication from "expo-local-authentication";

export async function isBiometricAvailable(): Promise<boolean> {
  const [has, enrolled] = await Promise.all([
    LocalAuthentication.hasHardwareAsync(),
    LocalAuthentication.isEnrolledAsync(),
  ]);
  return has && enrolled;
}

export async function promptBiometric(): Promise<boolean> {
  const available = await isBiometricAvailable();
  if (!available) return false;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Verify it's you",
    cancelLabel: "Use password instead",
    fallbackLabel: "Use PIN",
    disableDeviceFallback: false,
  });
  return result.success;
}
