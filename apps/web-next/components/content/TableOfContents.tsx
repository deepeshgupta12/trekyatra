"use client";

import { useEffect, useState } from "react";

interface TocItem {
  id: string;
  label: string;
}

interface Props {
  items: TocItem[];
}

export default function TableOfContents({ items }: Props) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    if (!items.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the topmost visible section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-10% 0px -70% 0px",
        threshold: 0,
      }
    );

    items.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  return (
    <div className="max-h-[calc(100vh-13rem)] overflow-y-auto space-y-1 pr-1">
      <div className="text-xs uppercase tracking-widest text-muted-foreground mb-3">On this page</div>
      {items.map((item) => {
        const isActive = item.id === activeId;
        return (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById(item.id);
              if (el) {
                el.scrollIntoView({ behavior: "smooth", block: "start" });
                setActiveId(item.id);
                // Update URL hash without triggering a full navigation
                history.pushState(null, "", `#${item.id}`);
              }
            }}
            className={`block text-sm py-1.5 px-3 rounded-lg transition-all duration-150 ${
              isActive
                ? "text-accent bg-accent/10 font-medium border-l-2 border-accent pl-2.5"
                : "text-foreground/60 hover:text-foreground hover:bg-muted/50 border-l-2 border-transparent pl-2.5"
            }`}
          >
            {item.label}
          </a>
        );
      })}
    </div>
  );
}
