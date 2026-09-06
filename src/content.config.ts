import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

import config from "@/config";

export const BLOG_PATH = "src/content/posts";

const fallbackDate = new Date("2017-01-01T00:00:00+08:00");

const posts = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: `./${BLOG_PATH}` }),
  schema: ({ image }) =>
    z
      .object({
        author: z.string().default(config.site.author),
        pubDatetime: z.coerce.date().optional(),
        date: z.coerce.date().optional(),
        modDatetime: z.coerce.date().optional().nullable(),
        updatedDate: z.coerce.date().optional(),
        title: z.string(),
        featured: z.boolean().optional(),
        draft: z.boolean().default(false),
        tags: z.array(z.string()).default([]),
        category: z.string().optional(),
        ogImage: image().or(z.string()).optional(),
        heroImage: image().optional(),
        heroImageAlt: z.string().optional(),
        description: z.string().default(""),
        canonicalURL: z.string().optional(),
        hideEditPost: z.boolean().optional(),
        timezone: z.string().optional(),
      })
      .transform(data => {
        const pubDatetime = data.pubDatetime ?? data.date ?? fallbackDate;
        const modDatetime = data.modDatetime ?? data.updatedDate ?? null;
        const tags = data.category
          ? Array.from(new Set([data.category, ...data.tags]))
          : data.tags;

        return {
          ...data,
          pubDatetime,
          modDatetime,
          tags,
          showDate: Boolean(data.pubDatetime ?? data.date),
        };
      }),
});

const pages = defineCollection({
  loader: glob({ pattern: "**/[^_]*.{md,mdx}", base: "./src/content/pages" }),
  schema: z.object({
    title: z.string(),
    description: z.string().optional(),
    ogImage: z.string().optional(),
    canonicalURL: z.string().optional(),
  }),
});

export const collections = { posts, pages };
