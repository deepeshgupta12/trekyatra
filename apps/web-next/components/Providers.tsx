"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { useState } from "react";
import { AuthProvider } from "@/lib/auth-context";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { ConsentBanner } from "@/components/analytics/ConsentBanner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  // NOTE: GoogleOAuthProvider is intentionally NOT here. It injects the ~95 KB
  // accounts.google.com/gsi/client script on mount, so wrapping the whole app loaded GSI
  // on every page (PSI #5). It now lives inside components/auth/GoogleAuthButton, which
  // only the sign-in/sign-up pages and the plan AuthGate modal render.
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <AnalyticsProvider>
            {children}
            <ConsentBanner />
          </AnalyticsProvider>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
