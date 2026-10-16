# Dropbox Index

Share a Dropbox folder as a fast, public file browser. No database, runs on free tiers.

[![CI](https://github.com/ArnabXD/Dropbox-Index/actions/workflows/ci.yml/badge.svg)](https://github.com/ArnabXD/Dropbox-Index/actions/workflows/ci.yml)

## Features

- Browse folders with breadcrumbs, back/forward and shareable deep links
- Filter the current folder instantly, or press <kbd>Enter</kbd> to search the whole Dropbox
- Sort by name, size or date
- Preview images, video, audio, Markdown and text files (<kbd>←</kbd> <kbd>→</kbd> to step through)
- Shows a folder's `README.md` below its file list
- Optional password protection
- Copy permanent download links: they never expire, each visit gets a fresh Dropbox link
- Light and dark mode, works on mobile

> **Everything the app can see is public.** Use an **App folder** Dropbox app (step 1) so only one folder is exposed.

## Quick start

### 1. Create a Dropbox app

1. Open the [Dropbox App Console](https://www.dropbox.com/developers/apps) and click **Create app**.
2. Choose **Scoped access**, then **App folder** (recommended) or **Full Dropbox**, and give it a name.
3. On the **Permissions** tab, enable `files.metadata.read` and `files.content.read`, then click **Submit**.
4. On the **Settings** tab, note the **App key** and **App secret**, and add these **Redirect URIs**:
   - `http://localhost:5173/api/auth/token` (local)
   - `https://<your-domain>/api/auth/token` (each deployment)

With an App folder app, Dropbox creates `Apps/<app name>/` in your Dropbox. Put the files you want to share there.

### 2. Run it locally

Requires [Node.js](https://nodejs.org) 22.18+ and [pnpm](https://pnpm.io).

```sh
git clone https://github.com/ArnabXD/Dropbox-Index.git
cd Dropbox-Index
pnpm install
cp .env.example .env
```

Fill in `APP_ID` and `APP_SECRET` in `.env`, then:

```sh
pnpm dev
```

### 3. Get the refresh token

1. Open <http://localhost:5173/api/auth> and click **Allow**.
2. Copy `refresh_token` from the JSON shown and set it as `REFRESH_TOKEN` in `.env`.
3. Restart `pnpm dev` and open <http://localhost:5173>.

The refresh token doesn't expire and works on every deployment, so you only do this once. While `REFRESH_TOKEN` is set, `/api/auth` returns 404; unset it to get a new one.

## Configuration

| Variable        | Required | Description                                                                  |
| --------------- | -------- | ---------------------------------------------------------------------------- |
| `APP_ID`        | yes      | Dropbox **App key**                                                          |
| `APP_SECRET`    | yes      | Dropbox **App secret**                                                       |
| `REFRESH_TOKEN` | yes      | From `/api/auth` (step 3)                                                    |
| `TITLE`         | no       | Site title, defaults to `D-Index`                                            |
| `AUTH_USER`     | no       | Set with `AUTH_PASS` to require a login (HTTP Basic auth) for the whole site |
| `AUTH_PASS`     | no       | Password for `AUTH_USER`                                                     |

## Deploy

Set the variables above as secrets or environment variables on your host.

### Cloudflare Workers (recommended)

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/ArnabXD/Dropbox-Index)

The button forks the repo to your GitHub, asks for `APP_ID`, `APP_SECRET` and `REFRESH_TOKEN`, and deploys. Every push to your fork redeploys. Add a [custom domain](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/) to enable edge caching.

Or from your machine:

```sh
pnpm dlx wrangler deploy
pnpm dlx wrangler secret put APP_ID   # repeat for APP_SECRET, REFRESH_TOKEN, and optional TITLE / AUTH_*
```

### Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FArnabXD%2FDropbox-Index&env=APP_ID,APP_SECRET,REFRESH_TOKEN,TITLE)

Vercel detects Hono automatically.

### Any Node host (VPS, Docker, Railway, Fly.io)

```sh
pnpm install
pnpm vp build
PORT=3000 pnpm start
```

## Troubleshooting

| Problem                               | Fix                                                                                                |
| ------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Dropbox says **invalid redirect_uri** | Add the exact `…/api/auth/token` URL to the app's Redirect URIs. Use `localhost`, not `127.0.0.1`. |
| `invalid_client` error                | `APP_ID` / `APP_SECRET` are wrong or swapped.                                                      |
| `missing_scope` error                 | Enable the permissions from step 1, then unset `REFRESH_TOKEN` and get a new one (step 3).         |
| Folder shows `path/not_found`         | With an App folder app, paths start inside `Apps/<app name>/`.                                     |
| Empty listing                         | The App folder has no files yet.                                                                   |

## Development

Built with [Hono](https://hono.dev) (server and JSX) and [Alpine.js](https://alpinejs.dev), with [Vite+](https://viteplus.dev) for tooling.

| Command         | Does                                           |
| --------------- | ---------------------------------------------- |
| `pnpm dev`      | Dev server with live reload                    |
| `pnpm vp check` | Format, lint and type check (`--fix` to apply) |
| `pnpm vp build` | Node bundle in `dist/` for `pnpm start`        |

| Path            | Contains                     |
| --------------- | ---------------------------- |
| `src/index.ts`  | API routes and Dropbox calls |
| `src/page.tsx`  | Page markup                  |
| `src/client.ts` | Browser logic (Alpine.js)    |
| `public/`       | Stylesheet, icons, favicon   |

## License

[Apache 2.0](LICENSE). Icons from [Lucide](https://lucide.dev) (ISC).
