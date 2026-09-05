import { getCollection, type CollectionEntry } from "astro:content";

export type Post = CollectionEntry<"docs">;

export interface TagCount {
  /** Original casing, as written in the frontmatter. */
  name: string;
  /** URL-safe form used by /tags/[tag]. */
  slug: string;
  count: number;
}

/** URL-safe form of a tag. Keep this in sync with the /tags routes. */
export function tagSlug(tag: string): string {
  return tag
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-|-$/g, "");
}

/**
 * Published posts, newest first.
 *
 * Drafts stay visible while running `astro dev` so they can be previewed, and
 * drop out of production builds.
 */
export async function getDocuments(): Promise<Post[]> {
  return getCollection("docs", ({ data }) =>
    import.meta.env.PROD ? !data.draft : true,
  );
}

export function publicationDate(post: Post): Date | undefined {
  return post.data.pubDate ?? post.data.date;
}

export function isBlogPost(post: Post): boolean {
  return (
    post.id.startsWith("blog/") &&
    !post.id.endsWith("/index") &&
    Boolean(publicationDate(post))
  );
}

export async function getPublishedPosts(): Promise<Post[]> {
  const posts = (await getDocuments()).filter(isBlogPost);

  return posts.sort(
    (a, b) =>
      (publicationDate(b)?.valueOf() ?? 0) -
      (publicationDate(a)?.valueOf() ?? 0),
  );
}

export function collectTags(posts: Post[]): TagCount[] {
  const byslug = new Map<string, TagCount>();

  for (const post of posts) {
    for (const name of post.data.tags) {
      const slug = tagSlug(name);
      if (!slug) continue;
      const existing = byslug.get(slug);
      if (existing) {
        existing.count += 1;
      } else {
        byslug.set(slug, { name, slug, count: 1 });
      }
    }
  }

  return [...byslug.values()].sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name),
  );
}

export function postsByTag(posts: Post[], slug: string): Post[] {
  return posts.filter((post) => post.data.tags.some((t) => tagSlug(t) === slug));
}

/**
 * Neighbouring posts in publication order. `previous` is the older post, which
 * is what a reader working backwards through an archive expects.
 */
export function getAdjacentPosts(
  posts: Post[],
  id: string,
): { previous?: Post; next?: Post } {
  const index = posts.findIndex((post) => post.id === id);
  if (index === -1) return {};

  return {
    previous: posts[index + 1],
    next: posts[index - 1],
  };
}
