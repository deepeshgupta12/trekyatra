"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  label?: string;
  subLabel?: string;
  href?: string;
  onClick?: () => void;
  dismissKey?: string;
}

const DISMISS_DAYS = 7;

export default function StickyMobileCTA({
  label = "Get a free quote",
  subLabel,
  href,
  onClick,
  dismissKey = "sticky_cta_dismissed",
}: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(dismissKey);
    if (dismissed) {
      const until = parseInt(dismissed, 10);
      if (Date.now() < until) return;
    }
    setVisible(true);
  }, [dismissKey]);

  function dismiss() {
    const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
    localStorage.setItem(dismissKey, String(until));
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border p-3 flex items-center gap-2">
      <div className="flex-1 min-w-0">
        {href ? (
          <a href={href} className="block">
            <Button variant="hero" size="default" className="w-full">{label}</Button>
          </a>
        ) : (
          <Button variant="hero" size="default" className="w-full" onClick={onClick}>{label}</Button>
        )}
        {subLabel && <p className="text-[10px] text-muted-foreground text-center mt-1">{subLabel}</p>}
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
