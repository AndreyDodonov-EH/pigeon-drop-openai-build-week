#!/usr/bin/env bash
# Redeploy the demo to GitHub Pages: build dist/ and push it to gh-pages.
# Usage: deploy.sh "Redeploy demo: <what changed since last deploy>"
set -euo pipefail

REPO=/home/aadod/_PROJECTS/pigeon_drop
BASE=/pigeon_drop/          # Pages serves under this subpath; a build without it 404s every asset
URL=https://andreydodonov-eh.github.io/pigeon_drop/

MSG=${1:?usage: deploy.sh "commit message describing what changed"}

cd "$REPO"
npm run typecheck
npx vite build --base="$BASE"

grep -q "src=\"${BASE}assets/" dist/index.html || {
  echo "dist/index.html bundle path is not under $BASE — aborting" >&2
  exit 1
}

git fetch origin gh-pages
WT=$(mktemp -d)
trap 'cd "$REPO" && git worktree remove --force "$WT" 2>/dev/null || true' EXIT
git worktree add "$WT" origin/gh-pages
cd "$WT"
git rm -rq .
# dist once contained its own deploy repo (pre-script workflow) and Vite preserves
# a .git in outDir across builds — never let one clobber the worktree's .git file
find "$REPO/dist" -mindepth 1 -maxdepth 1 ! -name .git -exec cp -r -t . {} +
touch .nojekyll              # keeps Jekyll away from asset dirs; must survive every deploy
git add -A
if git diff --cached --quiet; then
  echo "dist is identical to the last deploy — nothing to push."
  exit 0
fi
git commit -m "$MSG"
git push origin HEAD:gh-pages
cd "$REPO"

# Pages' CDN lags the push; poll until the live page serves the fresh bundle hash.
NEW=$(grep -o 'assets/index-[^"]*\.js' dist/index.html | head -1)
echo "Waiting for $URL to serve $NEW ..."
for _ in $(seq 1 12); do
  LIVE=$(curl -s "$URL?nocache=$RANDOM" | grep -o 'assets/index-[^"]*\.js' | head -1 || true)
  if [ "${LIVE:-}" = "$NEW" ]; then
    echo "Live: $URL (serving $NEW)"
    exit 0
  fi
  sleep 10
done
echo "Push succeeded but live page still serves ${LIVE:-nothing} after 2 min — check $URL manually." >&2
exit 1
