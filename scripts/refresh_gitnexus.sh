#!/usr/bin/env bash
set -euo pipefail

if ! command -v gitnexus >/dev/null 2>&1; then
  echo "GitNexus CLI not found globally."
  echo "Run: bash ./scripts/setup_gitnexus.sh"
  exit 1
fi

echo "==> Refreshing GitNexus graph..."
gitnexus analyze

echo "==> Current GitNexus status..."
gitnexus status || true

echo "==> Done."