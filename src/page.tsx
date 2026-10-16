import { html } from "hono/html";
import { client } from "./client.ts";

// Alpine directives with modifiers (@click.prevent, :href) aren't valid JSX attribute names
const on = (event: string, js: string) => ({ ["@" + event]: js });
const bind = (attr: string, js: string) => ({ [":" + attr]: js });
const go = (to: string) => on("click.prevent", "go(" + to + ")");

// Sprite icon from public/icons.svg; `dyn` is an Alpine expression yielding the icon name
const Icon = ({
  name,
  dyn,
  ...attrs
}: { name?: string; dyn?: string } & Record<string, unknown>) => (
  <svg class="i" aria-hidden="true" {...attrs}>
    <use {...(dyn ? bind("href", "'/icons.svg#' + " + dyn) : { href: "/icons.svg#" + name })} />
  </svg>
);

const Th = ({ k, label }: { k: string; label: string }) => (
  <th {...on("click", `sortBy('${k}')`)}>
    {label}{" "}
    <Icon name="chevron-up" x-show={`sort === '${k}'`} {...bind("class", "{ flip: !asc }")} />
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
    <button class="ib close" {...on("click", "$refs.dialog.close()")} title="Close">
      <Icon name="x" />
    </button>
    <template x-if="view">
      <figure>
        <template x-if="kind(view.name) === 'image'">
          <img {...bind("src", "dl(view)")} {...bind("alt", "view.name")} />
        </template>
        <template x-if="kind(view.name) === 'media'">
          <video {...bind("src", "dl(view)")} controls autoplay />
        </template>
        <template x-if="kind(view.name) === 'markdown'">
          <article class="doc md" x-html="text ?? (viewError ? '' : 'Loading…')" />
        </template>
        <template x-if="kind(view.name) === 'text'">
          <pre class="doc" x-text="text ?? (viewError ? '' : 'Loading…')" />
        </template>
        <p class="error" x-show="viewError" x-text="viewError" />
        <figcaption>
          <button class="ib" {...on("click", "step(-1)")} title="Previous">
            <Icon name="chevron-left" />
          </button>
          <span x-text="view.name" />
          <a class="ib" {...bind("href", "dl(view)")} title="Download">
            <Icon name="download" />
          </a>
          <button class="ib" {...on("click", "step(1)")} title="Next">
            <Icon name="chevron-right" />
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
      <link rel="icon" href="/favicon.svg" />
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
        <div class="wrap">
          <h1>
            <a href="/" {...go("'/'")}>
              <Icon name="package" />
              {title}
            </a>
          </h1>
          <form class="search" {...on("submit.prevent", "search()")}>
            <Icon name="search" />
            <input
              x-ref="q"
              type="search"
              x-model="q"
              placeholder="Filter, Enter to search all"
              aria-label="Filter or search"
              {...on("keydown.escape", "q = ''; searching && go(location.pathname, false)")}
            />
            <kbd>/</kbd>
          </form>
        </div>
      </header>
      <main>
        <nav>
          <a href="/" {...go("'/'")} title="Home">
            <Icon name="house" />
          </a>
          <template x-for="(c, i) in crumbs" {...bind("key", "c.href")}>
            <span {...bind("class", "{ current: !searching && i === crumbs.length - 1 }")}>
              <i>/</i>
              <a {...bind("href", "c.href")} {...go("c.href")} x-text="c.name" />
            </span>
          </template>
          <span x-cloak="" x-show="searching">
            <i>/</i>
            <b x-text="'Results for “' + searching + '”'" />
          </span>
        </nav>
        <section class="card">
          <div class="loader" x-cloak="" x-show="loading" />
          <table x-show="!empty">
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
                      class="name"
                      {...bind("href", "href(e)")}
                      {...on("click", "open(e, $event)")}
                    >
                      <Icon dyn="icon(e)" {...bind("class", "'t-' + icon(e)")} />
                      <span x-text="e.name" />
                    </a>{" "}
                    <small
                      x-show="searching"
                      x-text="e.path.slice(0, e.path.lastIndexOf('/')) || '/'"
                    />
                  </td>
                  <td x-text="e.folder ? '' : size(e.size)" />
                  <td x-text="e.modified ? new Date(e.modified).toLocaleDateString() : ''" />
                  <td class="acts">
                    <button class="ib" {...on("click", "copy(e)")} title="Copy link">
                      <Icon name="link" />
                    </button>
                    <a class="ib" x-show="!e.folder" {...bind("href", "dl(e)")} title="Download">
                      <Icon name="download" />
                    </a>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
          <template x-if="empty">
            <div class="empty">
              <Icon dyn="empty.icon" />
              <p x-text="empty.title" />
              <small x-text="empty.hint" />
              <p x-show="error">
                <button class="btn primary" {...on("click", "load(url)")}>
                  Retry
                </button>{" "}
                <a class="btn" href="/" {...go("'/'")}>
                  Home
                </a>
              </p>
            </div>
          </template>
        </section>
      </main>
      <Preview />
      <output x-cloak="" x-show="toast" x-transition="">
        <Icon name="check" />
        <span x-text="toast" />
      </output>
    </body>
  </html>
);

export const page = (title: string) => html`<!doctype html>${<Page title={title} />}`;
