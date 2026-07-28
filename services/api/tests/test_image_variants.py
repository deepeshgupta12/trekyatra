"""Tests for resized image variant helpers (app/core/image_variants.py)."""
import io

from PIL import Image

from app.core.image_variants import (
    VARIANT_WIDTHS,
    generate_variants,
    is_variantable,
    variant_key,
    variant_url,
)

SPACES = "https://trekyatra-media.sgp1.digitaloceanspaces.com"


def _png_bytes(w: int, h: int) -> bytes:
    buf = io.BytesIO()
    Image.new("RGB", (w, h), (120, 80, 40)).save(buf, format="PNG")
    return buf.getvalue()


def test_variant_url_rewrites_media_original():
    url = f"{SPACES}/media/abc123.jpg"
    assert variant_url(url, 400) == f"{SPACES}/media/abc123_400.jpg"


def test_variant_url_forces_jpg_for_png_original():
    url = f"{SPACES}/media/abc123.png"
    assert variant_url(url, 800) == f"{SPACES}/media/abc123_800.jpg"


def test_variant_url_leaves_non_media_urls_untouched():
    assert variant_url("https://cdn.example.com/logo.svg", 400) == "https://cdn.example.com/logo.svg"
    assert variant_url("/images/local.jpg", 400) == "/images/local.jpg"
    assert variant_url(None, 400) is None


def test_is_variantable_rejects_existing_variant():
    # An already-suffixed variant must not be re-suffixed (avoids _400_400).
    assert is_variantable(f"{SPACES}/media/abc123_400.jpg") is False
    assert is_variantable(f"{SPACES}/media/abc123.jpg") is True


def test_variant_key_object_form():
    assert variant_key("media/abc123.jpg", 400) == "media/abc123_400.jpg"
    assert variant_key("media/abc123.png", 800) == "media/abc123_800.jpg"


def test_generate_variants_downscales_only():
    # Source wider than the largest variant → both widths produced.
    out = generate_variants(_png_bytes(1600, 900))
    assert set(out.keys()) == set(VARIANT_WIDTHS)
    for width, data in out.items():
        img = Image.open(io.BytesIO(data))
        assert img.width == width
        assert img.format == "JPEG"


def test_generate_variants_skips_upscale():
    # Source (500px) smaller than the 800 variant → only 400 produced, never upscaled.
    out = generate_variants(_png_bytes(500, 300))
    assert 400 in out
    assert 800 not in out
