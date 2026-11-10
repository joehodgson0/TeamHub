#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Installing web dependencies..."
npm ci --include=dev --no-audit --no-fund

echo "Installing mobile dependencies..."
npm --prefix mobile ci --include=dev --no-audit --no-fund

echo "Building the application..."
npm run build

echo "Post-merge setup completed."
