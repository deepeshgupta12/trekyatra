"use client";

import { useState, useRef } from "react";
import { submitReport, uploadPhoto } from "@/lib/reports";

interface Props {
  trekSlug: string;
  onSuccess: () => void;
}

const CONDITIONS = [
  { value: "open", label: "Open", color: "text-emerald-600 dark:text-emerald-400" },
  { value: "caution", label: "Caution", color: "text-amber-600 dark:text-amber-400" },
  { value: "closed", label: "Closed", color: "text-red-600 dark:text-red-400" },
  { value: "unknown", label: "Unknown", color: "text-foreground/50" },
] as const;

export function AddReportForm({ trekSlug, onSuccess }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [trekDate, setTrekDate] = useState(today);
  const [condition, setCondition] = useState<"open" | "caution" | "closed" | "unknown">("unknown");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [photos, setPhotos] = useState<Array<{ file: File; preview: string; url?: string }>>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const bodyLen = body.length;
  const bodyValid = bodyLen >= 20 && bodyLen <= 2000;

  async function handlePhotoAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    if (photos.length + files.length > 3) {
      setError("Maximum 3 photos allowed");
      return;
    }
    setError("");
    setUploading(true);
    try {
      for (const file of files.slice(0, 3 - photos.length)) {
        const preview = URL.createObjectURL(file);
        const { url } = await uploadPhoto(file);
        setPhotos((prev) => [...prev, { file, preview, url }]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Photo upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  function removePhoto(idx: number) {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!bodyValid) { setError("Experience must be 20–2000 characters"); return; }
    setError("");
    setSubmitting(true);
    try {
      await submitReport({
        trek_slug: trekSlug,
        title: title.trim() || undefined,
        body,
        condition,
        trek_date: trekDate,
        photo_urls: photos.map((p) => p.url ?? "").filter(Boolean),
      });
      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 pt-4 border-t border-foreground/10">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-foreground/60 mb-1.5">
            Date on trail <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={trekDate}
            max={today}
            onChange={(e) => setTrekDate(e.target.value)}
            required
            className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-foreground/60 mb-1.5">
            Trail title <span className="text-foreground/30">(optional)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={255}
            placeholder="Short summary"
            className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-foreground/60 mb-2">
          Trail condition <span className="text-red-500">*</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((c) => (
            <button
              key={c.value}
              type="button"
              onClick={() => setCondition(c.value)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                condition === c.value
                  ? `${c.color} border-current bg-current/10 font-semibold`
                  : "border-foreground/15 text-foreground/50 hover:border-foreground/30"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-foreground/60 mb-1.5">
          Your experience <span className="text-red-500">*</span>
        </label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          required
          rows={4}
          minLength={50}
          maxLength={2000}
          placeholder="Describe trail conditions, difficulty, what you encountered... (min 20 characters)"
          className="w-full rounded-lg border border-foreground/15 bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-accent resize-none"
        />
        <p className={`text-xs mt-1 text-right ${bodyValid ? "text-foreground/30" : "text-amber-500"}`}>
          {bodyLen} / 2000
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium text-foreground/60 mb-2">
          Photos <span className="text-foreground/30">(up to 3)</span>
        </label>
        <div className="flex flex-wrap gap-2 items-center">
          {photos.map((p, i) => (
            <div key={p.preview} className="relative w-16 h-16 rounded-lg overflow-hidden border border-foreground/15">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.preview} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removePhoto(i)}
                className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 rounded-full text-white text-[10px] flex items-center justify-center hover:bg-black/80"
                aria-label="Remove photo"
              >
                ✕
              </button>
            </div>
          ))}
          {photos.length < 3 && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-16 h-16 rounded-lg border-2 border-dashed border-foreground/20 hover:border-accent/50 flex items-center justify-center text-foreground/30 hover:text-accent transition-colors disabled:opacity-50"
              aria-label="Add photo"
            >
              {uploading ? (
                <span className="text-xs">...</span>
              ) : (
                <span className="text-xl leading-none">+</span>
              )}
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            multiple
            className="hidden"
            onChange={handlePhotoAdd}
          />
        </div>
        <p className="text-xs text-foreground/35 mt-1.5">JPEG, PNG, or WebP · max 5 MB each</p>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-500/10 rounded-lg px-3 py-2">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting || uploading || !bodyValid}
        className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-accent text-white font-semibold text-sm hover:bg-accent/90 transition-colors disabled:opacity-50"
      >
        {submitting ? "Submitting…" : "Submit report"}
      </button>
    </form>
  );
}
