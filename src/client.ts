// Browser code, inlined into the page via client.toString(): it must not reference anything outside itself.
declare const Alpine: {
  data<T>(name: string, fn: () => T & ThisType<T & { $refs: Record<string, HTMLElement> }>): void;
};
declare const marked: { parse(md: string): string };
declare const DOMPurify: {
  sanitize(html: string): string;
  addHook(hook: "afterSanitizeAttributes", fn: (node: Element) => void): void;
};

type Entry = { name: string; path: string; folder: boolean; size?: number; modified?: string };
type SortKey = "name" | "size" | "modified";

export function client() {
  const KINDS: Record<string, string> = {
    image: "jpg jpeg png gif webp avif svg bmp ico",
    media: "mp4 webm mov m4v ogv mkv mp3 wav ogg oga m4a flac aac opus",
    markdown: "md markdown",
    text: "txt log csv tsv json yml yaml toml ini xml sh py js ts css html sql",
  };
  const ICONS: Record<string, string> = {
    image: "image",
    media: "film",
    markdown: "file-text",
    text: "file-code",
  };
  const TEXT_LIMIT = 2 ** 20; // larger text files download instead of previewing
  const kind = (name: string) =>
    Object.keys(KINDS).find((k) =>
      KINDS[k].split(" ").includes(name.split(".").pop()!.toLowerCase()),
    );
  const enc = (path: string) => path.split("/").map(encodeURIComponent).join("/");
  const cmp = (a: string | number, b: string | number) =>
    typeof a === "string" && typeof b === "string"
      ? a.localeCompare(b, undefined, { numeric: true })
      : Number(a > b) - Number(a < b);
  const cache = new Map<string, Entry[]>();
  // Dropbox errors arrive as JSON with an error_summary; fall back to the raw body
  const fail = async (r: Response) => {
    const body = await r.text();
    try {
      return new Error(JSON.parse(body).error_summary ?? body);
    } catch {
      return new Error(body);
    }
  };

  // marked + DOMPurify load on first markdown preview; relative <img> resolve against the file's folder
  const script = (src: string) =>
    new Promise((onload, onerror) =>
      document.head.append(
        Object.assign(document.createElement("script"), { src, onload, onerror }),
      ),
    );
  let libs: Promise<unknown> | undefined;
  let base = "";
  const markdown = async (md: string, dir: string) => {
    libs ??= Promise.all([
      script("https://cdn.jsdelivr.net/npm/marked@16.4.1/lib/marked.umd.js"),
      script("https://cdn.jsdelivr.net/npm/dompurify@3.3.0/dist/purify.min.js"),
    ]).then(() =>
      DOMPurify.addHook("afterSanitizeAttributes", (n) => {
        const src = n.tagName === "IMG" && n.getAttribute("src");
        if (src) n.setAttribute("src", new URL(src, base).href);
      }),
    );
    await libs;
    base = location.origin + "/api/dl" + enc(dir) + "/";
    return DOMPurify.sanitize(marked.parse(md));
  };

  document.addEventListener("alpine:init", () =>
    Alpine.data("app", () => ({
      path: "",
      entries: [] as Entry[],
      q: "",
      searching: "",
      sort: "name" as SortKey,
      asc: true,
      url: "",
      loading: false,
      error: "",
      view: null as Entry | null,
      text: null as string | null,
      viewError: "",
      readme: "",
      readmeLoading: false,
      toast: "",
      timer: 0,
      kind,
      init() {
        void this.go(location.pathname, false);
      },
      get crumbs() {
        const parts = this.path.split("/").filter(Boolean);
        return parts.map((name, i) => ({ name, href: enc("/" + parts.slice(0, i + 1).join("/")) }));
      },
      get empty() {
        if (this.loading || this.shown.length) return null;
        if (this.error)
          return {
            icon: "triangle-alert",
            title: this.error.includes("not_found") ? "This folder doesn't exist" : "Couldn't load",
            hint: this.error,
          };
        if (this.searching)
          return {
            icon: "search-x",
            title: "No results for “" + this.searching + "”",
            hint: "Esc to go back",
          };
        if (this.entries.length)
          return {
            icon: "search-x",
            title: "No matches for “" + this.q + "” here",
            hint: "Enter searches all files",
          };
        return { icon: "folder-open", title: "This folder is empty", hint: "" };
      },
      get shown() {
        const q = this.searching ? "" : this.q.toLowerCase();
        const [k, d] = [this.sort, this.asc ? 1 : -1];
        return this.entries
          .filter((e) => e.name.toLowerCase().includes(q))
          .sort((a, b) => Number(b.folder) - Number(a.folder) || d * cmp(a[k] ?? "", b[k] ?? ""));
      },
      async go(url: string, push = true) {
        const path = decodeURIComponent(url);
        this.path = path === "/" ? "" : path;
        this.q = this.searching = "";
        if (push) history.pushState(null, "", url);
        await this.load("/api/list?path=" + encodeURIComponent(this.path));
      },
      async search() {
        if (!this.q) return;
        this.searching = this.q;
        await this.load("/api/search?q=" + encodeURIComponent(this.q));
      },
      async load(url: string) {
        this.url = url;
        this.loading = true;
        this.error = "";
        try {
          if (!cache.has(url)) {
            const r = await fetch(url);
            if (!r.ok) throw await fail(r);
            cache.set(url, await r.json());
          }
          if (this.url === url) this.entries = cache.get(url)!;
        } catch (e) {
          if (this.url === url) [this.entries, this.error] = [[], (e as Error).message];
        }
        if (this.url === url) this.loading = false;
        await this.loadReadme(url);
      },
      // Render the folder's README.md under the listing (not for search results)
      async loadReadme(url: string) {
        this.readme = "";
        const f =
          !this.searching &&
          this.entries.find(
            (e) =>
              !e.folder && /^readme\.(md|markdown)$/i.test(e.name) && (e.size ?? 0) <= TEXT_LIMIT,
          );
        this.readmeLoading = !!f;
        if (!f) return;
        try {
          const r = await fetch("/api/raw" + enc(f.path));
          const html = r.ok ? await markdown(await r.text(), this.path) : "";
          if (this.url === url) this.readme = html;
        } catch {
          // README is a nice-to-have: on failure the card just disappears
        } finally {
          if (this.url === url) this.readmeLoading = false;
        }
      },
      open(e: Entry, ev: MouseEvent) {
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey) return;
        ev.preventDefault();
        if (e.folder) return void this.go(enc(e.path));
        if (!this.previewable(e)) return void (location.href = this.dl(e));
        void this.preview(e);
      },
      previewable(e: Entry) {
        const k = kind(e.name);
        return !!k && (k === "image" || k === "media" || (e.size ?? 0) <= TEXT_LIMIT);
      },
      async preview(e: Entry) {
        this.view = e;
        this.text = null;
        this.viewError = "";
        const dialog = this.$refs.dialog as HTMLDialogElement;
        if (!dialog.open) dialog.showModal();
        const k = kind(e.name);
        if (k !== "markdown" && k !== "text") return;
        try {
          const r = await fetch("/api/raw" + enc(e.path));
          if (!r.ok) throw await fail(r);
          const t = await r.text();
          const out =
            k === "text" ? t : await markdown(t, e.path.slice(0, e.path.lastIndexOf("/")));
          if (this.view === e) this.text = out;
        } catch (err) {
          if (this.view === e) this.viewError = (err as Error).message ?? "Couldn't load";
        }
      },
      step(d: number) {
        const list = this.shown.filter((e) => this.previewable(e));
        void this.preview(list[(list.indexOf(this.view!) + d + list.length) % list.length]);
      },
      dl: (e: Entry) => "/api/dl" + enc(e.path),
      href(e: Entry) {
        return e.folder ? enc(e.path) : this.dl(e);
      },
      icon: (e: Entry) => (e.folder ? "folder" : (ICONS[kind(e.name) ?? ""] ?? "file")),
      async copy(e: Entry) {
        await navigator.clipboard.writeText(location.origin + this.href(e));
        this.toast = "Link copied";
        clearTimeout(this.timer);
        this.timer = window.setTimeout(() => (this.toast = ""), 2000);
      },
      sortBy(k: SortKey) {
        this.asc = this.sort !== k || !this.asc;
        this.sort = k;
      },
      size(b = 0) {
        let i = 0;
        for (; b >= 1024 && i < 4; i++) b /= 1024;
        return (i ? b.toFixed(1) : b) + " " + ["B", "KB", "MB", "GB", "TB"][i];
      },
    })),
  );
}
