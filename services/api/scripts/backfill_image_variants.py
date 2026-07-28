"""
Backfill downscaled JPEG variants for existing DigitalOcean Spaces media.

WHY: Trek card/hero images are served as full-resolution originals (multi-MB),
so mobile lists download far more bytes than they render. The upload path now
writes `media/<uuid>_400.jpg` / `_800.jpg` variants alongside each new original
(app/api/routes/media.py + app/core/image_variants.py), and the mobile client
requests the card-sized variant. This one-off generates those variants for images
already in the bucket.

Idempotent — skips any original whose variants already exist. Only ADDS new
objects; never modifies or deletes originals (safe to run repeatedly).

Run from the DO App Platform Console (api component), from services/api:
  python scripts/backfill_image_variants.py             # execute (prefix media/)
  python scripts/backfill_image_variants.py --dry-run   # preview only
"""
from __future__ import annotations

import argparse
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings  # noqa: E402
from app.core.image_variants import VARIANT_WIDTHS, generate_variants, is_variantable, variant_key  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description="Backfill resized variants for Spaces media.")
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
    cdn = settings.do_spaces_cdn_endpoint or settings.do_spaces_endpoint

    originals = 0
    generated = 0
    skipped = 0
    errors = 0

    def variants_exist(key: str) -> bool:
        for w in VARIANT_WIDTHS:
            try:
                s3.head_object(Bucket=bucket, Key=variant_key(key, w))
            except (BotoCoreError, ClientError):
                return False
        return True

    paginator = s3.get_paginator("list_objects_v2")
    try:
        for page in paginator.paginate(Bucket=bucket, Prefix=args.prefix):
            for obj in page.get("Contents", []):
                key = obj["Key"]
                # Only originals (skip existing `_400`/`_800` variants + non-images).
                if not is_variantable(f"{cdn}/{key}"):
                    continue
                originals += 1

                if variants_exist(key):
                    skipped += 1
                    continue

                if args.dry_run:
                    print(f"  would generate variants for {key}")
                    generated += 1
                    continue

                try:
                    body = s3.get_object(Bucket=bucket, Key=key)["Body"].read()
                    variants = generate_variants(body)
                    for w, jpeg_bytes in variants.items():
                        s3.put_object(
                            Bucket=bucket,
                            Key=variant_key(key, w),
                            Body=jpeg_bytes,
                            ContentType="image/jpeg",
                            ACL="public-read",
                            CacheControl="public, max-age=31536000, immutable",
                        )
                    generated += 1
                    print(f"  generated {sorted(variants)} for {key}")
                except (BotoCoreError, ClientError, OSError) as exc:
                    print(f"  ! failed {key}: {exc}")
                    errors += 1
    except (BotoCoreError, ClientError) as exc:
        print(f"ERROR listing objects: {exc}")
        return 1

    verb = "would generate" if args.dry_run else "generated"
    print(
        f"\nDone. originals={originals} {verb}={generated} "
        f"already-had-variants={skipped} errors={errors} (prefix={args.prefix!r})"
    )
    return 0 if errors == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
