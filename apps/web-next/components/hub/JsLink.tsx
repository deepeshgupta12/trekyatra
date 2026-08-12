"use client";

import { useRouter } from "next/navigation";
import type { ReactNode, KeyboardEvent } from "react";

/**
 * A JavaScript-navigated "link" that is NOT a crawlable <a href>. Used for the SECOND and later
 * occurrences of the same internal URL on a page, so search engines see exactly one real <a href>
 * per destination (the first, most prominent instance) while users still get a clickable, keyboard
 * accessible control everywhere else. See createHubLinker().
 */
export function JsLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  const router = useRouter();
  function go() {
    router.push(href);
  }
  function onKey(e: KeyboardEvent<HTMLSpanElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      go();
    }
  }
  return (
    <span role="link" tabIndex={0} onClick={go} onKeyDown={onKey} className={`cursor-pointer ${className}`}>
      {children}
    </span>
  );
}
