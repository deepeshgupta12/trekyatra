"""Media upload endpoint — accepts JPG/PNG/WEBP images for CMS pages.

Storage priority:
1. DigitalOcean Spaces (if DO_SPACES_* env vars configured)
2. Local fallback at data/uploads/ (persists within container; not suitable for production)

DO Spaces setup: create a Space at cloud.digitalocean.com/spaces, generate API keys
under API > Spaces Keys, then set: DO_SPACES_KEY, DO_SPACES_SECRET, DO_SPACES_BUCKET,
DO_SPACES_ENDPOINT (e.g. https://blr1.digitaloceanspaces.com) in the api component env vars.
"""
from __future__ import annotations

import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.core.config import settings
from app.modules.auth.dependencies import get_current_admin

router = APIRouter(prefix="/admin/media", tags=["admin-media"])

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

LOCAL_UPLOAD_DIR = Path("data/uploads")


def _upload_to_spaces(file_content: bytes, filename: str, content_type: str) -> str:
    """Upload to DigitalOcean Spaces. Returns the public CDN URL."""
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError

    s3 = boto3.client(
        "s3",
        region_name=settings.do_spaces_region,
        endpoint_url=settings.do_spaces_endpoint,
        aws_access_key_id=settings.do_spaces_key,
        aws_secret_access_key=settings.do_spaces_secret,
    )
    key = f"media/{filename}"
    try:
        s3.put_object(
            Bucket=settings.do_spaces_bucket,
            Key=key,
            Body=file_content,
            ContentType=content_type,
            ACL="public-read",
            # Immutable long cache: filenames are content-unique (uuid4), so the object
            # never changes under a given key. Lets browsers + Cloudflare cache media
            # for a year instead of re-downloading on every visit (PSI #3).
            CacheControl="public, max-age=31536000, immutable",
        )
    except (BotoCoreError, ClientError) as exc:
        raise HTTPException(status_code=500, detail=f"DO Spaces upload failed: {exc}") from exc

    cdn = settings.do_spaces_cdn_endpoint or settings.do_spaces_endpoint
    return f"{cdn}/{key}"


def _upload_local(file_content: bytes, filename: str) -> str:
    """Fallback: store in data/uploads/ and return a URL via the API static mount."""
    LOCAL_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    dest = LOCAL_UPLOAD_DIR / filename
    dest.write_bytes(file_content)
    # URL served via StaticFiles mount registered in main.py (if configured)
    # For DO App Platform: this path is NOT persistent across deploys.
    base = os.getenv("NEXT_PUBLIC_API_BASE", "https://api.trekyatra.co.in")
    return f"{base}/uploads/{filename}"


@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    _admin: dict = Depends(get_current_admin),
) -> dict:
    """Upload a trek image (JPG/PNG/WEBP). Returns {url} for use as hero_image_url."""
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Accepted: JPG, PNG, WEBP. Got: {file.content_type}",
        )

    ext = Path(file.filename or "upload.jpg").suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        ext = ".jpg"

    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Max size is 10 MB.",
        )

    filename = f"{uuid.uuid4().hex}{ext}"

    spaces_configured = all([
        settings.do_spaces_key,
        settings.do_spaces_secret,
        settings.do_spaces_bucket,
        settings.do_spaces_endpoint,
    ])

    if spaces_configured:
        url = _upload_to_spaces(content, filename, file.content_type or "image/jpeg")
    else:
        # Local fallback — warn that this won't persist across deploys
        url = _upload_local(content, filename)

    return {
        "url": url,
        "filename": filename,
        "storage": "spaces" if spaces_configured else "local",
        "warning": None if spaces_configured else (
            "Image stored locally — will be lost on next deployment. "
            "Configure DO_SPACES_KEY, DO_SPACES_SECRET, DO_SPACES_BUCKET, DO_SPACES_ENDPOINT "
            "in the api component env vars for persistent storage."
        ),
    }
