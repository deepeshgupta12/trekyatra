"use client";

import { useState } from "react";
import type { ReportOut } from "@/lib/reports";
import { PhotoGallery } from "./PhotoGallery";

const conditionBadge: Record<string, string> = {
  open: "text-emerald-600 bg-emerald-50 border border-emerald-200 dark:text-emerald-400 dark:bg-emerald-400/10 dark:border-emerald-400/20",
  caution: "text-amber-600 bg-amber-50 border border-amber-200 dark:text-amber-400 dark:bg-amber-400/10 dark:border-amber-400/20",
  closed: "text-red-600 bg-red-50 border border-red-200 dark:text-red-400 dark:bg-red-400/10 dark:border-red-400/20",
  unknown: "text-foreground/50 bg-foreground/5 border border-foreground/10",
};

const conditionLabel: Record<string, string> = {
  open: "● Open",
  caution: "⚠ Caution",
  closed: "✕ Closed",
  unknown: "? Unknown",
};

interface Props {
  report: ReportOut;
}

export function TripReportCard({ report }: Props) {
  const [galleryIndex, setGalleryIndex] = useState<number | null>(null);

  const photos = report.media.map((m) => m.url);

  const formattedDate = new Date(report.trek_date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const initials = "U"; // anonymous — no username exposed in public response

  return (
    <>
      <div className="py-5 border-b border-foreground/8 last:border-0">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center text-accent font-semibold text-sm shrink-0">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span
                className={`text-xs font-medium px-2 py-0.5 rounded-full ${conditionBadge[report.condition] ?? conditionBadge.unknown}`}
              >
                {conditionLabel[report.condition] ?? report.condition}
              </span>
              <span className="text-xs text-foreground/40">·</span>
              <span className="text-xs text-foreground/50">{formattedDate}</span>
            </div>
            {report.title && (
              <p className="text-sm font-semibold text-foreground mb-1">{report.title}</p>
            )}
            <p className="text-sm text-foreground/75 leading-relaxed whitespace-pre-line line-clamp-4">
              {report.body}
            </p>

            {photos.length > 0 && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {photos.map((url, i) => (
                  <button
                    key={url}
                    onClick={() => setGalleryIndex(i)}
                    className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border border-foreground/10 hover:border-accent/50 transition-colors"
                    aria-label={`View photo ${i + 1}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {galleryIndex !== null && (
        <PhotoGallery
          photos={photos}
          initialIndex={galleryIndex}
          onClose={() => setGalleryIndex(null)}
        />
      )}
    </>
  );
}
