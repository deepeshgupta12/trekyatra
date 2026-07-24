"""Tests for media upload Cache-Control header (PSI #3).

Uploaded Spaces objects must carry an immutable long-lived Cache-Control so browsers +
Cloudflare stop re-downloading images on every visit. Filenames are content-unique (uuid4),
so the object under a given key never changes — a year-long immutable cache is safe.
"""
from __future__ import annotations

from unittest.mock import MagicMock, patch

from app.api.routes import media
from app.core.config import settings


def test_upload_to_spaces_sets_immutable_cache_control(monkeypatch):
    """_upload_to_spaces must pass CacheControl=public, max-age=31536000, immutable."""
    monkeypatch.setattr(settings, "do_spaces_region", "blr1")
    monkeypatch.setattr(settings, "do_spaces_endpoint", "https://blr1.digitaloceanspaces.com")
    monkeypatch.setattr(settings, "do_spaces_key", "key")
    monkeypatch.setattr(settings, "do_spaces_secret", "secret")
    monkeypatch.setattr(settings, "do_spaces_bucket", "trekyatra-media")
    monkeypatch.setattr(settings, "do_spaces_cdn_endpoint", "https://cdn.example.com")

    fake_s3 = MagicMock()
    with patch("boto3.client", return_value=fake_s3):
        url = media._upload_to_spaces(b"\xff\xd8\xff", "abc123.jpg", "image/jpeg")

    assert url == "https://cdn.example.com/media/abc123.jpg"
    fake_s3.put_object.assert_called_once()
    kwargs = fake_s3.put_object.call_args.kwargs
    assert kwargs["CacheControl"] == "public, max-age=31536000, immutable"
    assert kwargs["ContentType"] == "image/jpeg"
    assert kwargs["ACL"] == "public-read"
    assert kwargs["Key"] == "media/abc123.jpg"
