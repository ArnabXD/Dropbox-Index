import { Hono, type Context } from "hono";
import { env } from "hono/adapter";
import { basicAuth } from "hono/basic-auth";
import { cache } from "hono/cache";
import { HTTPException } from "hono/http-exception";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import { page } from "./page.tsx";

type Env = {
  APP_ID: string;
  APP_SECRET: string;
  REFRESH_TOKEN: string;
  TITLE?: string;
  AUTH_USER?: string;
  AUTH_PASS?: string;
};
type Meta = {
  ".tag": string;
  name: string;
  path_display: string;
  size?: number;
  client_modified?: string;
};

type Token = { value: string; exp: number };

// Per instance, plus the Cache API where present; one in-flight refresh at a time
let token: Token = { value: "", exp: 0 };
let pending: Promise<Token> | undefined;

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

const refresh = async (c: Context): Promise<Token> => {
  const key = new URL("/.cache/dropbox-token", c.req.url).href;
  const store = globalThis.caches && (await caches.open("dropbox-token"));
  const hit = await store?.match(key);
  if (hit) {
    const t: Token = await hit.json();
    if (Date.now() < t.exp) return t;
  }
  const r = await oauth(c, {
    grant_type: "refresh_token",
    refresh_token: env<Env>(c).REFRESH_TOKEN,
  });
  const ttl = r.expires_in - 300;
  const t = { value: r.access_token, exp: Date.now() + ttl * 1000 };
  await store?.put(
    key,
    new Response(JSON.stringify(t), { headers: { "Cache-Control": "max-age=" + ttl } }),
  );
  return t;
};

const accessToken = async (c: Context) => {
  if (Date.now() >= token.exp) {
    pending ??= refresh(c).finally(() => (pending = undefined));
    token = await pending;
  }
  return token.value;
};

const dbx = async (c: Context, endpoint: string, body: object) => {
  const auth = "Bearer " + (await accessToken(c));
  return call("/2/" + endpoint, {
    headers: { Authorization: auth, "Content-Type": "application/json" },
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

// no-op without the Cache API (Node)
const cached = cache({
  cacheName: "dropbox-index",
  cacheControl: "public, max-age=60",
  onCacheNotAvailable: false,
});

const app = new Hono();

app.use(async (c, next) => {
  const { AUTH_USER, AUTH_PASS } = env<Env>(c);
  if (!AUTH_USER || !AUTH_PASS) return next();
  return basicAuth({ username: AUTH_USER, password: AUTH_PASS })(c, next);
});

app.get("/api/list", cached, async (c) => {
  let r = await dbx(c, "files/list_folder", { path: c.req.query("path") ?? "", limit: 2000 });
  const list: Meta[] = r.entries;
  while (r.has_more)
    list.push(...(r = await dbx(c, "files/list_folder/continue", { cursor: r.cursor })).entries);
  return entries(c, list);
});

app.get("/api/search", cached, async (c) => {
  const r = await dbx(c, "files/search_v2", {
    query: c.req.query("q") ?? "",
    options: { max_results: 1000 },
  });
  return entries(
    c,
    r.matches.map((m: { metadata: { metadata: Meta } }) => m.metadata.metadata),
  );
});

const tempLink = async (c: Context): Promise<string> => {
  const path = decodeURIComponent(new URL(c.req.url).pathname.replace(/^\/api\/\w+/, ""));
  return (await dbx(c, "files/get_temporary_link", { path })).link;
};

app.get("/api/dl/*", async (c) => c.redirect(await tempLink(c)));

// text/plain so HTML files never execute
app.get("/api/raw/*", cached, async (c) => {
  const r = await fetch(await tempLink(c));
  return new Response(r.body, {
    status: r.status,
    headers: { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" },
  });
});

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
