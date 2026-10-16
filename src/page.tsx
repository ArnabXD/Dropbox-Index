import { html } from "hono/html";
import { client } from "./client.ts";

// Alpine directives with modifiers (@click.prevent, :href) aren't valid JSX attribute names
const on = (event: string, js: string) => ({ ["@" + event]: js });
const bind = (attr: string, js: string) => ({ [":" + attr]: js });
const go = (to: string) => on("click.prevent", "go(" + to + ")");

const Th = ({ k, label }: { k: string; label: string }) => (
  <th {...on("click", `sortBy('${k}')`)} x-text={`'${label}' + arrow('${k}')`}>
    {label}
  </th>
);

const Preview = () => (
  <dialog
    x-ref="dialog"
    {...on("click.self", "$el.close()")}
    {...on("close", "view = null")}
    {...on("keydown.left", "step(-1)")}
    {...on("keydown.right", "step(1)")}
  >
    <template x-if="view">
      <figure>
        <template x-if="kind(view.name) === 'image'">
          <img {...bind("src", "dl(view)")} {...bind("alt", "view.name")} />
        </template>
        <template x-if="kind(view.name) === 'media'">
          <video {...bind("src", "dl(view)")} controls autoplay />
        </template>
        <figcaption>
          <button {...on("click", "step(-1)")} title="Previous">
            ◀
          </button>
          <span x-text="view.name" />
          <a {...bind("href", "dl(view)")} title="Download">
            ⬇️
          </a>
          <button {...on("click", "step(1)")} title="Next">
            ▶
          </button>
        </figcaption>
      </figure>
    </template>
  </dialog>
);

const Page = ({ title }: { title: string }) => (
  <html lang="en">
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <title>{title}</title>
      <link
        rel="icon"
        href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📦</text></svg>"
      />
      <link rel="stylesheet" href="/style.css" />
      <script dangerouslySetInnerHTML={{ __html: `(${client.toString()})()` }} />
      <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.9/dist/cdn.min.js" />
    </head>
    <body
      x-data="app"
      {...on("popstate.window", "go(location.pathname, false)")}
      {...on(
        "keydown.window.slash",
        "$event.target.tagName === 'INPUT' || ($event.preventDefault(), $refs.q.focus())",
      )}
    >
      <header>
        <h1>
          <a href="/" {...go("'/'")}>
            {title}
          </a>
        </h1>
        <form {...on("submit.prevent", "search()")}>
          <input
            x-ref="q"
            type="search"
            x-model="q"
            placeholder="Filter · Enter: search all · /"
            {...on("keydown.escape", "q = ''; searching && go(location.pathname, false)")}
          />
        </form>
      </header>
      <main>
        <nav>
          <a href="/" {...go("'/'")}>
            Home
          </a>
          <template x-for="c in crumbs" {...bind("key", "c.href")}>
            <a {...bind("href", "c.href")} {...go("c.href")} x-text="c.name" />
          </template>
          <span x-cloak="" x-show="searching" x-text="'Search: ' + searching" />
        </nav>
        <progress x-cloak="" x-show="loading" />
        <p class="error" x-cloak="" x-show="error" x-text="error" />
        <table>
          <thead>
            <tr>
              <Th k="name" label="Name" />
              <Th k="size" label="Size" />
              <Th k="modified" label="Modified" />
              <th />
            </tr>
          </thead>
          <tbody>
            <template x-for="e in shown" {...bind("key", "e.path")}>
              <tr>
                <td>
                  <a
                    {...bind("href", "href(e)")}
                    {...on("click", "open(e, $event)")}
                    x-text="icon(e) + ' ' + e.name"
                  />{" "}
                  <small
                    x-show="searching"
                    x-text="e.path.slice(0, e.path.lastIndexOf('/')) || '/'"
                  />
                </td>
                <td x-text="e.folder ? '' : size(e.size)" />
                <td x-text="e.modified ? new Date(e.modified).toLocaleDateString() : ''" />
                <td>
                  <button {...on("click", "copy(e)")} title="Copy link">
                    🔗
                  </button>
                  <a x-show="!e.folder" {...bind("href", "dl(e)")} title="Download">
                    ⬇️
                  </a>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
        <p class="muted" x-cloak="" x-show="!loading && !error && !shown.length">
          Nothing here.
        </p>
      </main>
      <Preview />
      <output x-cloak="" x-show="toast" x-transition="" x-text="toast" />
    </body>
  </html>
);

export const page = (title: string) => html`<!doctype html>${<Page title={title} />}`;
