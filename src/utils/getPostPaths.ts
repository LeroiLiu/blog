import { getRelativeLocaleUrl } from "astro:i18n";
import { slugifyStr } from "./slugify";
import config from "@/config";

function getPostSlugPath(id: string): string {
  return id
    .replace(/(?:^|\/)index$/, "")
    .split("/")
    .filter(segment => segment && !segment.startsWith("_"))
    .map(segment => slugifyStr(segment))
    .join("/");
}

/**
 * Returns the slug-only path for use as a route param in `getStaticPaths`.
 * No base prefix, no locale — Astro handles those at a higher level.
 * e.g. `/examples/my-post`
 */
export function getPostSlug(id: string, _filePath?: string): string {
  return `/${getPostSlugPath(id)}`;
}

/**
 * Returns a fully navigable URL for use in `<a href>` and RSS links.
 * Applies both locale routing and the configured Astro base via
 * `getRelativeLocaleUrl`.
 * e.g. `/posts/my-post` or `/en/posts/my-post`
 */
export function getPostUrl(
  id: string,
  _filePath: string | undefined,
  locale: string | undefined = config.site.lang
): string {
  return getRelativeLocaleUrl(locale, getPostSlugPath(id));
}
