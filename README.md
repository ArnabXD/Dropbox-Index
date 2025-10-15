# DropBox-Index

Index your dropbox files publically. Built using React Router

## Features

- 🚀 Server-side rendering
- ⚡️ Hot Module Replacement (HMR)
- 📦 Asset bundling and optimization
- 🔄 Data loading and mutations
- 🔒 TypeScript by default
- 🎉 TailwindCSS for styling
- 📖 [React Router docs](https://reactrouter.com/)

## Getting Started

### Installation

Install the dependencies:

```bash
npm install
```

### Development

Start the development server with HMR:

```bash
npm run dev
```

Your application will be available at `http://localhost:5173`.

### Environment Variables

- APP_KEY(already provided)
- APP_SECRET(already provided)
- **REFRESH_TOKEN** (required) follow the below steps to get it

#### Get Refresh Token:

1. Go to this [URL](https://www.dropbox.com/oauth2/authorize?client_id=qy1yfn7mclvybv9&response_type=code&token_access_type=offline)
2. Click `Continue` -> `Allow` -> Copy the code.
3. Then run `node getRefreshToken.js` and then paste the code you got.
4. Voilà, There is your refresh token.
5. Paste it into `.env_sample` and rename it to `.env`.

## Deployment

Deployment is done using the Wrangler CLI.

To build and deploy directly to production:

```
npm i && npm run build && npx wrangler deploy
```

- Upload Environment Variables for production same as `.env`

```
wrangler secret put APP_KEY --env production
wrangler secret put APP_SECRET --env production
wrangler secret put REFRESH_TOKEN --env production
```

Built with ❤️ using React Router.

