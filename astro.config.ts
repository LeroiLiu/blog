import mdx from "@astrojs/mdx";
import { unified } from "@astrojs/markdown-remark";
import sitemap from "@astrojs/sitemap";
import { defineConfig, envField, svgoOptimizer } from "astro/config";
import rehypeCallouts from "rehype-callouts";
import remarkCollapse from "remark-collapse";
import remarkToc from "remark-toc";
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
} from "@shikijs/transformers";
import tailwindcss from "@tailwindcss/vite";

import config from "./astro-paper.config";
import { prefixBaseLinks } from "./src/plugins/prefix-base-links.mjs";
import { transformerFileName } from "./src/utils/transformers/fileName";

const base = normalizeBase(process.env.BASE_PATH ?? "/blog");

export default defineConfig({
  site: process.env.SITE_URL ?? config.site.url,
  base,
  trailingSlash: "always",
  integrations: [
    mdx(),
    sitemap({
      filter: page =>
        config.features?.showArchives !== false ||
        !page.endsWith("/archives/"),
    }),
  ],
  i18n: {
    locales: ["zh-CN"],
    defaultLocale: "zh-CN",
    routing: {
      prefixDefaultLocale: false,
    },
  },
  markdown: {
    processor: unified({
      remarkPlugins: [
        [prefixBaseLinks, { base }],
        remarkToc,
        [remarkCollapse, { test: "目录" }],
      ],
      rehypePlugins: [rehypeCallouts],
    }),
    shikiConfig: {
      themes: { light: "min-light", dark: "night-owl" },
      defaultColor: false,
      wrap: false,
      transformers: [
        transformerFileName({ style: "v2", hideDot: false }),
        transformerNotationHighlight(),
        transformerNotationWordHighlight(),
        transformerNotationDiff({ matchAlgorithm: "v3" }),
      ],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  },
  env: {
    schema: {
      PUBLIC_GOOGLE_SITE_VERIFICATION: envField.string({
        access: "public",
        context: "client",
        optional: true,
      }),
    },
  },
  experimental: {
    svgOptimizer: svgoOptimizer(),
  },
});

function normalizeBase(value: string): string {
  if (!value || value === "/") return "/";
  return `/${value.replace(/^\/+|\/+$/g, "")}`;
}
