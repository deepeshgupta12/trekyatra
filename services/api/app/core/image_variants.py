"""Resized image variants for DO Spaces media.

Trek card/hero images are served straight from DO Spaces as full-resolution
originals (multi-MB), which makes mobile lists slow. We generate a small set of
downscaled JPEG variants next to each original and let the client request the
size it actually renders.

Naming convention (client + server must agree):
    original :  media/<uuid>.jpg
    variant  :  media/<uuid>_<width>.jpg      # e.g. media/<uuid>_400.jpg

Variants are ALWAYS JPEG (even if the original is PNG/WebP), so the width-suffix
URL is deterministic. The same transform is mirrored in the mobile client at
`apps/mobile/lib/imageUrl.ts` — keep them in sync.
"""
from __future__ import annotations

import io

# Widths we generate. 400 covers 2-col cards (~196pt @2-3x); 800 covers heroes.
VARIANT_WIDTHS: tuple[int, ...] = (400, 800)

_IMG_EXTS = ("jpg", "jpeg", "png", "webp")


def is_variantable(url: str | None) -> bool:
    """True only for DO Spaces media originals we can derive variants for."""
    if not url or "/media/" not in url:
        return False
    tail = url.rsplit("/", 1)[-1]
    if "." not in tail:
        return False
    ext = tail.rsplit(".", 1)[-1].lower()
    # Already a variant (…_400.jpg) → don't re-suffix.
    stem = tail.rsplit(".", 1)[0]
    if any(stem.endswith(f"_{w}") for w in VARIANT_WIDTHS):
        return False
    return ext in _IMG_EXTS


def variant_url(url: str | None, width: int) -> str | None:
    """Return the width-variant URL for a media original, else the URL unchanged."""
    if not is_variantable(url):
        return url
    base = url.rsplit(".", 1)[0]  # strip original extension
    return f"{base}_{width}.jpg"


def variant_key(original_key: str, width: int) -> str:
    """`media/<uuid>.jpg` → `media/<uuid>_<width>.jpg` (object key form)."""
    base = original_key.rsplit(".", 1)[0]
    return f"{base}_{width}.jpg"


def generate_variants(data: bytes) -> dict[int, bytes]:
    """Downscale `data` to each VARIANT_WIDTH. Only shrinks — never upscales.

    Returns {width: jpeg_bytes}. A width larger than the source is skipped (the
    original already serves that size). Requires Pillow (already a backend dep
    via reports upload).
    """
    from PIL import Image

    src = Image.open(io.BytesIO(data)).convert("RGB")
    w0, h0 = src.size
    out: dict[int, bytes] = {}
    for width in VARIANT_WIDTHS:
        if width >= w0:
            continue  # don't upscale — original covers it
        ratio = width / w0
        resized = src.resize((width, max(1, int(h0 * ratio))), Image.LANCZOS)
        buf = io.BytesIO()
        resized.save(buf, format="JPEG", quality=80, optimize=True)
        out[width] = buf.getvalue()
    return out
