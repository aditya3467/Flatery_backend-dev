#!/usr/bin/env bash
# Run Lighthouse performance audits for key frontend pages.
# Usage:
#   chmod +x scripts/run-lighthouse.sh
#   cd frontend && npx http-server -p 8080   # or run the server in a separate terminal
#   ./scripts/run-lighthouse.sh

PORT=${PORT:-8080}
BASE_URL="http://localhost:${PORT}/"
OUT_DIR="lighthouse-reports"
mkdir -p "$OUT_DIR"

PAGES=(
  "index.html"
  "properties.html"
  "owner/add-property.html"
  "owner/owner-dashboard.html"
  "owner/flat-dashboard.html"
  "owner/pg-list.html"
  "owner/listing-manager.html"
  "superadmin-dashboard.html"
  "tenant-dashboard.html"
  "property-details.html"
)

echo "Running Lighthouse on pages served from $BASE_URL"

for page in "${PAGES[@]}"; do
  url="${BASE_URL}${page}"
  name=$(echo "$page" | tr '/.' '__')
  echo "\n==> Auditing: $url -> $OUT_DIR/${name}.html"
  npx -y lighthouse "$url" \
    --chrome-flags="--no-sandbox --headless" \
    --only-categories=performance,accessibility,best-practices \
    --output html \
    --output-path "$OUT_DIR/${name}.html" \
    --quiet || echo "Lighthouse failed for $url"
  # Save JSON too
  npx -y lighthouse "$url" \
    --chrome-flags="--no-sandbox --headless" \
    --only-categories=performance,accessibility,best-practices \
    --output json \
    --output-path "$OUT_DIR/${name}.json" \
    --quiet || echo "Lighthouse (json) failed for $url"
done

echo "Reports saved to $(pwd)/$OUT_DIR"

echo "Note: Ensure a local static server is running (e.g., run 'npx http-server frontend -p ${PORT}') and that Chrome is installed."
