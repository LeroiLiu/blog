import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const docs = defineCollection({
  loader: glob({
    base: "./src/content/docs",
    pattern: "**/[^_]*.{md,mdx}",
  }),
  schema: ({ image }) =>
    z.object({
        title: z.string(),
        description: z.string().default(""),
        date: z.coerce.date().optional(),
        pubDate: z.coerce.date().optional(),
        updatedDate: z.coerce.date().optional(),
        tags: z.array(z.string()).default([]),
        draft: z.boolean().default(false),
        heroImage: image().optional(),
        heroImageAlt: z.string().optional(),
      }),
});

export const collections = { docs };
