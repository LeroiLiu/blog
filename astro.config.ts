import { defineConfig } from "astro/config";
import { unified } from "@astrojs/markdown-remark";
import sitemap from "@astrojs/sitemap";

import { SITE } from "./src/config";
import { prefixBaseLinks } from "./src/plugins/prefix-base-links.mjs";

const base = normalizeBase(process.env.BASE_PATH ?? "/blog");

export default defineConfig({
  site: process.env.SITE_URL ?? SITE.url,
  base,
  trailingSlash: "always",
  integrations: [sitemap()],
  markdown: {
    processor: unified({
      remarkPlugins: [[prefixBaseLinks, { base }]],
    }),
    shikiConfig: {
      themes: {
        light: "vitesse-light",
        dark: "vitesse-dark",
      },
      defaultColor: false,
      wrap: false,
    },
  },
});

function normalizeBase(value: string): string {
  if (!value || value === "/") return "/";
  return `/${value.replace(/^\/+|\/+$/g, "")}`;
}
