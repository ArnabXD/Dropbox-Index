import { Hono, type Context } from "hono";
import { env } from "hono/adapter";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { page } from "./page.tsx";

type Env = { APP_ID: string; APP_SECRET: string; REFRESH_TOKEN: string; TITLE?: string };
type Meta = {
  ".tag": string;
  name: string;
  path_display: string;
  size?: number;
  client_modified?: string;
};

// Per-instance token cache: each Worker isolate / serverless instance refreshes once per ~4h
let token = { value: "", exp: 0 };

const call = async (path: string, init: RequestInit) => {
  const r = await fetch("https://api.dropboxapi.com" + path, { method: "POST", ...init });
  if (!r.ok) throw new HTTPException(r.status as ContentfulStatusCode, { message: await r.text() });
  return r.json();
};

const oauth = (c: Context, params: Record<string, string>) => {
  const { APP_ID, APP_SECRET } = env<Env>(c);
  return call("/oauth2/token", {
    body: new URLSearchParams({ ...params, client_id: APP_ID, client_secret: APP_SECRET }),
  });
};

const dbx = async (c: Context, endpoint: string, body: object) => {
  if (Date.now() > token.exp) {
    const t = await oauth(c, {
      grant_type: "refresh_token",
      refresh_token: env<Env>(c).REFRESH_TOKEN,
    });
    token = { value: t.access_token, exp: Date.now() + (t.expires_in - 60) * 1000 };
  }
  return call("/2/" + endpoint, {
    headers: { Authorization: "Bearer " + token.value, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
};

const entries = (c: Context, list: Meta[]) =>
  c.json(
    list
      .filter((m) => m[".tag"] !== "deleted")
      .map((m) => ({
        name: m.name,
        path: m.path_display,
        folder: m[".tag"] === "folder",
        size: m.size,
        modified: m.client_modified,
      })),
  );

const redirectUri = (c: Context) => {
  const host = c.req.header("host") ?? "";
  return (host.startsWith("localhost") ? "http://" : "https://") + host + "/api/auth/token";
};

const app = new Hono();

app.get("/api/list", async (c) => {
  let r = await dbx(c, "files/list_folder", { path: c.req.query("path") ?? "", limit: 2000 });
  const list: Meta[] = r.entries;
  while (r.has_more)
    list.push(...(r = await dbx(c, "files/list_folder/continue", { cursor: r.cursor })).entries);
  return entries(c, list);
});

app.get("/api/search", async (c) => {
  const r = await dbx(c, "files/search_v2", {
    query: c.req.query("q") ?? "",
    options: { max_results: 1000 },
  });
  return entries(
    c,
    r.matches.map((m: { metadata: { metadata: Meta } }) => m.metadata.metadata),
  );
});

// Stable share link: redirects to a fresh 4h temporary link on every hit
app.get("/api/dl/*", async (c) => {
  const path = decodeURIComponent(new URL(c.req.url).pathname.slice("/api/dl".length));
  return c.redirect((await dbx(c, "files/get_temporary_link", { path })).link);
});

// One-time helper: visit /api/auth to get a refresh token for REFRESH_TOKEN
app.get("/api/auth", (c) =>
  c.redirect(
    "https://www.dropbox.com/oauth2/authorize?" +
      new URLSearchParams({
        client_id: env<Env>(c).APP_ID,
        response_type: "code",
        token_access_type: "offline",
        redirect_uri: redirectUri(c),
      }),
  ),
);

app.get("/api/auth/token", async (c) =>
  c.json(
    await oauth(c, {
      grant_type: "authorization_code",
      code: c.req.query("code") ?? "",
      redirect_uri: redirectUri(c),
    }),
  ),
);

app.get("*", (c) => c.html(page(env<Env>(c).TITLE || "D-Index")));

export default app;
