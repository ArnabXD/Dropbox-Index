import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import app from "./index.ts";

const server = new Hono().use(serveStatic({ root: "./public" })).route("/", app);

serve({ fetch: server.fetch, port: Number(process.env.PORT) || 3000 }, ({ port }) =>
  console.log("http://localhost:" + port),
);
