import devServer from "@hono/vite-dev-server";
import { defineConfig, loadEnv, lazyPlugins } from "vite-plus";

export default defineConfig(({ mode }) => {
  // Same process.env the Node/Render runtime sees; hono/adapter's env(c) reads it
  Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
  return {
    plugins: lazyPlugins(() => [
      devServer({
        entry: "src/index.ts",
        // The page is server-rendered and public/ isn't in Vite's module graph:
        // reload the browser on any change under src/ or public/
        handleHotUpdate: ({ server, file }) => {
          if (!/\/(src|public)\//.test(file)) return;
          server.hot.send({ type: "full-reload" });
          return [];
        },
      }),
    ]),
    // Node/Render bundle (page.tsx needs a JSX transform); Workers and Vercel bundle src/index.ts themselves
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
