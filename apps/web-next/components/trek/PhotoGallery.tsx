"use client";

import { useCallback, useEffect, useState } from "react";

interface Props {
  photos: string[];
  initialIndex: number;
  onClose: () => void;
}

export function PhotoGallery({ photos, initialIndex, onClose }: Props) {
  const [idx, setIdx] = useState(initialIndex);

  const prev = useCallback(
    () => setIdx((i) => (i - 1 + photos.length) % photos.length),
    [photos.length],
  );
  const next = useCallback(
    () => setIdx((i) => (i + 1) % photos.length),
    [photos.length],
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
      else if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [prev, next, onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/92 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white/70 hover:text-white text-2xl font-light z-10"
        aria-label="Close gallery"
      >
        ✕
      </button>
      <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">
        {idx + 1} / {photos.length}
      </span>

      {photos.length > 1 && (
        <button
          onClick={prev}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-4xl px-2"
          aria-label="Previous photo"
        >
          ‹
        </button>
      )}

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={photos[idx]}
        alt={`Report photo ${idx + 1}`}
        className="max-h-[85vh] max-w-full object-contain rounded-lg"
      />

      {photos.length > 1 && (
        <button
          onClick={next}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white text-4xl px-2"
          aria-label="Next photo"
        >
          ›
        </button>
      )}
    </div>
  );
}
