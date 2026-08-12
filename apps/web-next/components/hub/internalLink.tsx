import Link from "next/link";
import type { ReactNode } from "react";
import { JsLink } from "./JsLink";

/**
 * Per-page internal-link deduper. Call `createHubLinker()` once at the top of a page render, then use
 * the returned `ilink(href, label)` for every internal link. The FIRST time a given href is used it
 * renders a real crawlable `<a href>`; every later use of the SAME href renders a JsLink (JS-navigated,
 * no <a href>). This guarantees exactly one crawlable link per destination per page, the first/most
 * prominent one, which is the recommended internal-linking pattern for search engines.
 *
 * Because server components render synchronously in source order, calling ilink in JSX order matches
 * DOM order, so the "first instance" is the earliest one on the page.
 */
export function createHubLinker() {
  const seen = new Set<string>();
  return function ilink(href: string, label: ReactNode, className = "text-accent hover:underline font-medium") {
    if (seen.has(href)) {
      return <JsLink href={href} className={className}>{label}</JsLink>;
    }
    seen.add(href);
    return <Link href={href} className={className}>{label}</Link>;
  };
}
