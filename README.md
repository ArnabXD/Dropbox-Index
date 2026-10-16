# DropBox-Index

Index your dropbox files publicly. Built with Hono & Alpine.js, runs on any JS runtime.

Browse folders, filter, search the whole Dropbox, sort, preview images/video/audio, and copy permanent share links.

[![CI](https://github.com/ArnabXD/Dropbox-Index/actions/workflows/ci.yml/badge.svg)](https://github.com/ArnabXD/Dropbox-Index/actions/workflows/ci.yml)

## ENV Vars

- `APP_ID` : Dropbox App Client ID
- `APP_SECRET` : Dropbox App Client Secret
- `REFRESH_TOKEN` : Dropbox refresh token (visit `/api/auth` once to get it; add `<your-host>/api/auth/token` as a redirect URI in the Dropbox app)
- `TITLE` : Website title and heading

## Develop

Tooling is [Vite+](https://viteplus.dev) (`vp`): dev server with reload, format, lint, typecheck, and the Node build. Pages are Hono JSX (`src/page.tsx`) with Alpine.js logic in `src/client.ts`.

```sh
cp .env.sample .env
pnpm install
pnpm dev        # vp dev
pnpm vp check   # format + lint + typecheck (--fix to apply)
pnpm vp build   # Node bundle -> dist/node.js (pnpm start)
```

## Deploy

- **Cloudflare Workers**: `pnpm dlx wrangler deploy`, then `pnpm dlx wrangler secret put APP_ID` (same for `APP_SECRET`, `REFRESH_TOKEN`).
- **Render** / any Node host: `pnpm vp build && pnpm start` (see `render.yaml`).

  [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

- **Vercel**: import the repo, it detects Hono and serves `src/index.ts`.

  [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FArnabXD%2FDropbox-Index&env=APP_ID,APP_SECRET,REFRESH_TOKEN,TITLE)
