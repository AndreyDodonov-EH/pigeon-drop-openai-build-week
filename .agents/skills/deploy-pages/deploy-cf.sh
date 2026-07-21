#!/usr/bin/env bash
# Redeploy the demo to Cloudflare Pages (pigeondrop.pages.dev / pigeondrop.me).
# Usage: deploy-cf.sh
# Unlike GitHub Pages, Cloudflare serves from the domain root, so the build
# uses vite's default base (/). Plain `vite build` on purpose — `npm run build`
# would also copy the GPT Sites scaffolding (dist/server, dist/.openai) into
# the upload, which has no business on this host.
set -euo pipefail

REPO=~/_PROJECTS/pigeon_drop
PROJECT=pigeondrop
URL=https://pigeondrop.pages.dev/

cd "$REPO"
npm run typecheck
npx vite build

grep -q 'src="/assets/' dist/index.html || {
  echo "dist/index.html bundle path is not root-relative — aborting" >&2
  exit 1
}

# --commit-dirty: the working tree is usually mid-work when deploying; the
# deploy ships dist/, not the tree, so the dirty warning is noise.
npx wrangler pages deploy dist --project-name="$PROJECT" --branch=main --commit-dirty=true

# The pages.dev edge usually serves the new bundle immediately, but verify.
NEW=$(grep -o 'assets/index-[^"]*\.js' dist/index.html | head -1)
echo "Waiting for $URL to serve $NEW ..."
for _ in $(seq 1 6); do
  LIVE=$(curl -s "$URL?nocache=$RANDOM" | grep -o 'assets/index-[^"]*\.js' | head -1 || true)
  if [ "${LIVE:-}" = "$NEW" ]; then
    echo "Live: $URL (serving $NEW)"
    exit 0
  fi
  sleep 5
done
echo "Deploy succeeded but $URL still serves ${LIVE:-nothing} after 30s — check manually." >&2
exit 1
