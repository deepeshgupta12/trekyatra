"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

interface DayData {
  day: number;
  title: string;
  activities: string[];
  notes?: string | null;
}

export default function ItineraryDay({ day }: { day: DayData }) {
  const [open, setOpen] = useState(day.day === 1);

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-accent/10 text-accent text-xs font-bold flex items-center justify-center flex-shrink-0">
            {day.day}
          </span>
          <span className="font-medium text-foreground text-sm">{day.title}</span>
        </div>
        {open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border bg-muted/10">
          <ul className="space-y-1 mb-2">
            {day.activities.map((act, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                <span className="text-accent mt-0.5">•</span>
                {act}
              </li>
            ))}
          </ul>
          {day.notes && (
            <p className="text-xs text-muted-foreground italic">{day.notes}</p>
          )}
        </div>
      )}
    </div>
  );
}
