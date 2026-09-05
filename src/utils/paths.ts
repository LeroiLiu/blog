const base = import.meta.env.BASE_URL.replace(/\/$/, "");

export function sitePath(path = "/"): string {
  if (path === "/") return `${base}/` || "/";

  const normalized = path.replace(/^\/+|\/+$/g, "");
  const hasExtension = /\/[^/]+\.[a-z0-9]+$/i.test(`/${normalized}`);
  const trailingSlash = hasExtension ? "" : "/";
  return `${base}/${normalized}${trailingSlash}`;
}

export function documentPath(id: string): string {
  const route = id.replace(/(?:^|\/)index$/, "").replace(/^\/+|\/+$/g, "");
  return sitePath(route ? `/${route}/` : "/");
}
