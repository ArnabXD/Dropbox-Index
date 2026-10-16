// Browser code, inlined into the page via client.toString(): it must not reference anything outside itself.
declare const Alpine: {
  data<T>(name: string, fn: () => T & ThisType<T & { $refs: Record<string, HTMLElement> }>): void;
};

type Entry = { name: string; path: string; folder: boolean; size?: number; modified?: string };
type SortKey = "name" | "size" | "modified";

export function client() {
  const KINDS: Record<string, string> = {
    image: "jpg jpeg png gif webp avif svg bmp ico",
    media: "mp4 webm mov m4v ogv mkv mp3 wav ogg oga m4a flac aac opus",
  };
  const ICONS: Record<string, string> = { image: "🖼️", media: "🎞️" };
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
            if (!r.ok) throw new Error(await r.text());
            cache.set(url, await r.json());
          }
          if (this.url === url) this.entries = cache.get(url)!;
        } catch (e) {
          if (this.url === url) [this.entries, this.error] = [[], (e as Error).message];
        }
        if (this.url === url) this.loading = false;
      },
      open(e: Entry, ev: MouseEvent) {
        if (ev.metaKey || ev.ctrlKey || ev.shiftKey) return;
        ev.preventDefault();
        if (e.folder) return void this.go(enc(e.path));
        if (!kind(e.name)) return void (location.href = this.dl(e));
        this.view = e;
        (this.$refs.dialog as HTMLDialogElement).showModal();
      },
      step(d: number) {
        const list = this.shown.filter((e) => kind(e.name));
        this.view = list[(list.indexOf(this.view!) + d + list.length) % list.length];
      },
      dl: (e: Entry) => "/api/dl" + enc(e.path),
      href(e: Entry) {
        return e.folder ? enc(e.path) : this.dl(e);
      },
      icon: (e: Entry) => (e.folder ? "📁" : (ICONS[kind(e.name) ?? ""] ?? "📄")),
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
      arrow(k: SortKey) {
        return this.sort === k ? (this.asc ? " ↑" : " ↓") : "";
      },
      size(b = 0) {
        let i = 0;
        for (; b >= 1024 && i < 4; i++) b /= 1024;
        return (i ? b.toFixed(1) : b) + " " + ["B", "KB", "MB", "GB", "TB"][i];
      },
    })),
  );
}
