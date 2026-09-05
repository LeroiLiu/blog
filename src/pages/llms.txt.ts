import type { APIRoute } from "astro";

import { AUTHOR, SITE } from "../config";
import { formatDate } from "../utils/date";
import { documentPath, sitePath } from "../utils/paths";
import {
  collectTags,
  getPublishedPosts,
  publicationDate,
} from "../utils/posts";

/**
 * https://llmstxt.org — a plain-text index of the site for language models,
 * built from the same collection that drives the pages.
 */
export const GET: APIRoute = async ({ site }) => {
  const posts = await getPublishedPosts();
  const tags = collectTags(posts);
  const absolute = (path: string) => new URL(path, site).href;

  const lines = [
    `# ${SITE.title}`,
    "",
    `> ${SITE.description}`,
    "",
    `Written by ${AUTHOR.name} (${AUTHOR.url}).`,
    "",
    "## Posts",
    "",
    ...posts.map(
      (post) =>
        `- [${post.data.title}](${absolute(documentPath(post.id))}): ${
          post.data.description
        } 发布于 ${formatDate(publicationDate(post)!)}。`,
    ),
    "",
    "## Pages",
    "",
    `- [博客](${absolute(sitePath("/blog/"))}): 按时间倒序排列的技术文章。`,
    `- [标签](${absolute(sitePath("/tags/"))}): ${tags.map((t) => t.name).join(", ")}。`,
    `- [简历](${absolute(sitePath("/resume/"))}): 作者的工作经历与能力介绍。`,
    "",
    "## Feeds",
    "",
    `- [RSS](${absolute(sitePath("/rss.xml"))})`,
    `- [Sitemap](${absolute(sitePath("/sitemap-index.xml"))})`,
    "",
  ];

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
