"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Renders `children` only after the component has mounted on the client.
 *
 * On the server and on the FIRST client render it returns `fallback` (null by default), so
 * the server HTML and the initial hydration output match exactly — there is nothing to
 * hydrate for the gated subtree. The children then appear in a post-mount re-render, which
 * is a normal client update, not part of hydration.
 *
 * Used to host client-only, below-fold personalization sections (RecentlyViewed /
 * PersonalisedFeed) so the `next/dynamic({ ssr:false })` Suspense boundary is created
 * post-hydration instead of being hydrated — which clears the benign React hydration
 * warnings (#418/#423/#425) those boundaries emit in the production build. Behaviour is
 * otherwise unchanged: those sections were already client-only (they read localStorage).
 */
export function ClientOnly({ children, fallback = null }: { children: ReactNode; fallback?: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return <>{mounted ? children : fallback}</>;
}
