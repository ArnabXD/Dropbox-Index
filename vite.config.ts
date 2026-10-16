import devServer from "@hono/vite-dev-server";
import { defineConfig, loadEnv, lazyPlugins } from "vite-plus";

export default defineConfig(({ mode }) => {
  // .env -> process.env for env(c)
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  return {
    plugins: lazyPlugins(() => [
      devServer({
        entry: "src/index.ts",
        // defaults send /api/raw/*.md etc. to Vite (404)
        exclude: [/^\/@/, /^\/node_modules\//, /^\/\.vite\//, /\?t=\d+$/, /^\/[^/]+\.(css|svg)$/],
        handleHotUpdate: ({ server, file }) => {
          if (!/\/(src|public)\//.test(file)) return;
          server.hot.send({ type: "full-reload" });
          return [];
        },
      }),
    ]),
    // Node only; Workers and Vercel bundle src/index.ts
    build: { ssr: "src/node.ts" },
    staged: {
      "*": "vp check --fix",
    },
    fmt: {},
    lint: {
      jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
      rules: { "vite-plus/prefer-vite-plus-imports": "error" },
      options: { typeAware: true, typeCheck: true },
    },
  };
});
