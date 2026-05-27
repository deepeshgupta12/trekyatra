"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  startSession,
  endSession,
  trackPageView,
  flushQueue,
} from "@/lib/analytics";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const initialised = useRef(false);

  // Start session on first mount
  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;
    startSession();

    // Flush on tab close / navigation away
    const handleUnload = () => {
      flushQueue();
      endSession();
    };
    window.addEventListener("beforeunload", handleUnload);
    return () => window.removeEventListener("beforeunload", handleUnload);
  }, []);

  // Track page view on every route change
  useEffect(() => {
    trackPageView(window.location.href, document.title);
  }, [pathname]);

  return <>{children}</>;
}
