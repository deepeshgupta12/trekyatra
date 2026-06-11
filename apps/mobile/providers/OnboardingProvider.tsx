import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const ONBOARDING_KEY = "trekyatra_onboarding_done";

interface OnboardingContextValue {
  isLoading: boolean;
  done: boolean;
  markDone: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | undefined>(undefined);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setDone(!!val);
      setIsLoading(false);
    });
  }, []);

  async function markDone() {
    await AsyncStorage.setItem(ONBOARDING_KEY, "1");
    setDone(true);
  }

  return (
    <OnboardingContext.Provider value={{ isLoading, done, markDone }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error("useOnboarding must be used within OnboardingProvider");
  return ctx;
}
