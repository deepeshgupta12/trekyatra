declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    plausible?: (event: string, opts?: { props?: Record<string, unknown> }) => void;
  }
}

export function trackEvent(name: string, properties?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;

  // GA4
  if (typeof window.gtag === "function") {
    window.gtag("event", name, properties ?? {});
  }

  // Plausible
  if (typeof window.plausible === "function") {
    window.plausible(name, { props: properties });
  }
}
