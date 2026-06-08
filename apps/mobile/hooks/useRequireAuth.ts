import { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAuth } from "./useAuth";

export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/(auth)/sign-in");
    }
  }, [isAuthenticated, isLoading, router]);
}
