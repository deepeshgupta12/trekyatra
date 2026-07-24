"""
Backfill Cache-Control on existing DigitalOcean Spaces media objects.

WHY: Until now the upload endpoint (app/api/routes/media.py) wrote objects WITHOUT a
CacheControl header, so every Spaces image shows "Cache TTL: None" — browsers and
Cloudflare re-download the full image on every visit (~5.2 MB on repeat visits, PSI #3).
The upload path now sets `CacheControl: public, max-age=31536000, immutable`, but that
only applies to NEW uploads. This one-off rewrites the metadata on objects already in the
bucket by copying each object onto itself with MetadataDirective=REPLACE.

Object keys are content-unique (uuid4 filenames), so an immutable year-long cache is safe:
the bytes under a given key never change.

Idempotent — safe to run repeatedly. Only touches metadata (ContentType is preserved,
ACL re-applied public-read); it does not re-upload or alter image bytes.

Run from the DO App Platform Console (api component), from services/api:
  python scripts/backfill_spaces_cache_control.py             # execute (prefix media/)
  python scripts/backfill_spaces_cache_control.py --dry-run   # preview only
  python scripts/backfill_spaces_cache_control.py --prefix "" # all objects, not just media/
"""
from __future__ import annotations

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings  # noqa: E402

CACHE_CONTROL = "public, max-age=31536000, immutable"


def main() -> int:
    parser = argparse.ArgumentParser(description="Backfill Cache-Control on Spaces media objects.")
    parser.add_argument("--dry-run", action="store_true", help="List what would change, make no writes.")
    parser.add_argument("--prefix", default="media/", help="Key prefix to process (default: media/).")
    args = parser.parse_args()

    if not all([settings.do_spaces_key, settings.do_spaces_secret, settings.do_spaces_bucket, settings.do_spaces_endpoint]):
        print("ERROR: DO Spaces not configured (DO_SPACES_KEY/SECRET/BUCKET/ENDPOINT). Nothing to do.")
        return 1

    import boto3
    from botocore.exceptions import BotoCoreError, ClientError

    s3 = boto3.client(
        "s3",
        region_name=settings.do_spaces_region,
        endpoint_url=settings.do_spaces_endpoint,
        aws_access_key_id=settings.do_spaces_key,
        aws_secret_access_key=settings.do_spaces_secret,
    )
    bucket = settings.do_spaces_bucket

    processed = 0
    updated = 0
    skipped = 0
    errors = 0

    paginator = s3.get_paginator("list_objects_v2")
    try:
        for page in paginator.paginate(Bucket=bucket, Prefix=args.prefix):
            for obj in page.get("Contents", []):
                key = obj["Key"]
                processed += 1

                # Read current metadata to preserve ContentType and skip already-correct objects.
                try:
                    head = s3.head_object(Bucket=bucket, Key=key)
                except (BotoCoreError, ClientError) as exc:
                    print(f"  ! head failed {key}: {exc}")
                    errors += 1
                    continue

                current_cc = head.get("CacheControl")
                content_type = head.get("ContentType") or "application/octet-stream"

                if current_cc == CACHE_CONTROL:
                    skipped += 1
                    continue

                if args.dry_run:
                    print(f"  would set Cache-Control on {key} (was: {current_cc!r})")
                    updated += 1
                    continue

                try:
                    s3.copy_object(
                        Bucket=bucket,
                        Key=key,
                        CopySource={"Bucket": bucket, "Key": key},
                        MetadataDirective="REPLACE",
                        ContentType=content_type,
                        CacheControl=CACHE_CONTROL,
                        ACL="public-read",
                    )
                    updated += 1
                    print(f"  set Cache-Control on {key}")
                except (BotoCoreError, ClientError) as exc:
                    print(f"  ! copy failed {key}: {exc}")
                    errors += 1
    except (BotoCoreError, ClientError) as exc:
        print(f"ERROR listing objects: {exc}")
        return 1

    verb = "would update" if args.dry_run else "updated"
    print(
        f"\nDone. processed={processed} {verb}={updated} "
        f"already-correct={skipped} errors={errors} (prefix={args.prefix!r})"
    )
    return 0 if errors == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
