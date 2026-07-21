---
name: deploy-pages
description: Build the game and redeploy the public demo — Cloudflare Pages (https://pigeondrop.pages.dev/, custom domain pigeondrop.me) is the primary target; GitHub Pages (https://andreydodonov-eh.github.io/pigeon_drop/) is the legacy mirror. Use whenever the user asks to deploy, redeploy, publish, or update the demo/Pages site.
allowed-tools: Bash, Read, Grep, Glob
---

# Redeploying the demo

Two targets, each with its own script. When the user just says "deploy",
deploy to Cloudflare; only touch GitHub Pages when asked for it explicitly
or asked to update "both".

## Cloudflare Pages (primary — pigeondrop.me)

```bash
.agents/skills/deploy-pages/deploy-cf.sh
```

Typechecks, builds with vite's default base `/` (Cloudflare serves from the
domain root), uploads `dist/` to the `pigeondrop` Pages project via
`wrangler pages deploy`, and polls https://pigeondrop.pages.dev/ until the
new bundle hash is live. Uses plain `vite build`, not `npm run build` —
the npm script also copies GPT Sites scaffolding (`dist/server`,
`dist/.openai`) that must not be uploaded here. Wrangler auth is a
persistent OAuth login (`npx wrangler whoami` to check); no commit or push
is involved — the deploy ships `dist/` directly.

## GitHub Pages (legacy mirror)

The demo is served from the `gh-pages` branch at
**https://andreydodonov-eh.github.io/pigeon_drop/**. The whole procedure —
typecheck, build with `--base=/pigeon_drop/`, swap `dist/` onto `gh-pages`
via a temp worktree, push, wait for the CDN to serve the new bundle — is
scripted:

```bash
.agents/skills/deploy-pages/deploy.sh "Redeploy demo: <what changed>"
```

Write the commit message from `git log --oneline` since the last `gh-pages`
commit date — say what the demo now includes, not "update dist". The script
exits 0 with the live URL on success, exits early if dist is identical to the
last deploy, and fails loudly if typecheck/build breaks or the CDN never picks
up the new bundle (~2 min) — report failures to the user, never work around
them by pushing manually.

Context if the script itself needs changing:

- `vite.config.ts` and `npm run build` set no `base`; the explicit
  `--base=/pigeon_drop/` in the script is what keeps assets from 404ing.
- `gh-pages` must keep its `.nojekyll` file.
- The debug menu is opt-in via `?debug` — no deploy-specific code toggles.
- No CI workflow and no `gh` CLI on this machine; plain git only.
