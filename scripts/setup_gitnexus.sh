#!/usr/bin/env bash
set -euo pipefail

echo "==> Checking Node.js and npm..."
node -v
npm -v

echo "==> Installing GitNexus globally..."
npm install -g gitnexus

echo "==> Verifying GitNexus installation..."
gitnexus --help >/dev/null 2>&1 || {
  echo "GitNexus installation failed."
  exit 1
}

echo "==> Building initial knowledge graph from repo root..."
gitnexus analyze

echo "==> GitNexus setup complete."
echo "Use 'gitnexus status' to inspect the current index."
echo "The local index will live under .gitnexus/."