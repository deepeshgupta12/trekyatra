/**
 * Resized DO Spaces image variants — mirror of the backend
 * `app/core/image_variants.py`. Trek media is stored as full-res originals; the
 * backend also writes downscaled JPEG variants (media/<uuid>_400.jpg, _800.jpg).
 * Cards request the small variant instead of the multi-MB original.
 *
 * Keep the width set + naming in sync with the Python helper. Callers should
 * fall back to the original on image load error (variants may not exist yet for
 * images uploaded before the backfill ran).
 */
const VARIANT_WIDTHS = [400, 800] as const;
const IMG_EXTS = ["jpg", "jpeg", "png", "webp"];

export type VariantWidth = (typeof VARIANT_WIDTHS)[number];

function isVariantable(url: string | null | undefined): url is string {
  if (!url || !url.includes("/media/")) return false;
  const tail = url.split("/").pop() ?? "";
  const dot = tail.lastIndexOf(".");
  if (dot < 0) return false;
  const stem = tail.slice(0, dot);
  if (VARIANT_WIDTHS.some((w) => stem.endsWith(`_${w}`))) return false; // already a variant
  return IMG_EXTS.includes(tail.slice(dot + 1).toLowerCase());
}

/** Width-variant URL for a Spaces media original; any other URL is returned unchanged. */
export function resizedImageUrl<T extends string | null | undefined>(url: T, width: VariantWidth): T {
  if (!isVariantable(url)) return url;
  return `${url.slice(0, url.lastIndexOf("."))}_${width}.jpg` as T;
}
