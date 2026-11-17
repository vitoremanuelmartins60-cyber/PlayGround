#!/usr/bin/env bash
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"
: "${CAPTURE_URL:?Set CAPTURE_URL to the exact preview URL.}"
: "${CAPTURE_DIR:?Set CAPTURE_DIR to the evidence output directory.}"
[[ "$CAPTURE_URL" == http://* || "$CAPTURE_URL" == https://* ]] || { echo "CAPTURE_URL must be an absolute HTTP(S) URL." >&2; exit 1; }
/usr/bin/time -p mkdir -p "$CAPTURE_DIR"
export CAPTURE_STRICT=1
/usr/bin/time -p node "${RUNTIME_DIR:?}/scripts/default-capture.mjs"
for image in final-desktop.png final-mobile.png; do
  [[ -s "$CAPTURE_DIR/$image" ]] || { echo "Capture did not produce a rendered screenshot: $CAPTURE_DIR/$image" >&2; exit 1; }
done
/usr/bin/time -p file "$CAPTURE_DIR/final-desktop.png" "$CAPTURE_DIR/final-mobile.png"
