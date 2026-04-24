"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface FAQItem {
  q: string;
  a: string;
}

interface Props {
  items: FAQItem[];
  className?: string;
}

export default function FAQAccordion({ items, className = "" }: Props) {
  const [open, setOpen] = useState<number | null>(0);

  if (!items.length) return null;

  return (
    <div className={`space-y-3 ${className}`}>
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div
            key={i}
            className={`rounded-2xl border transition-colors duration-200 ${
              isOpen
                ? "border-accent/40 bg-accent/5"
                : "border-border bg-surface-muted hover:border-border/80"
            }`}
          >
            <button
              className="w-full flex items-start justify-between gap-4 px-5 py-4 text-left"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span className={`font-semibold text-sm leading-snug ${isOpen ? "text-accent" : "text-foreground"}`}>
                {item.q}
              </span>
              <ChevronDown
                className={`h-4 w-4 flex-shrink-0 mt-0.5 transition-transform duration-200 ${
                  isOpen ? "rotate-180 text-accent" : "text-muted-foreground"
                }`}
              />
            </button>
            {isOpen && (
              <div className="px-5 pb-5">
                <div
                  className="text-sm text-foreground/80 leading-relaxed prose prose-sm max-w-none cms-section"
                  dangerouslySetInnerHTML={{ __html: item.a }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
