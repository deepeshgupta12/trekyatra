"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { useState } from "react";
import { AuthProvider } from "@/lib/auth-context";

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AuthProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </AuthProvider>
      </GoogleOAuthProvider>
    </QueryClientProvider>
  );
}
