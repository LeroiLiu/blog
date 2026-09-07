"use strict";

const crypto = require("node:crypto");
const themePackage = require("hexo-theme-stellar/package.json");

const themeVersion = themePackage.version;
const assetRevision = crypto
  .createHash("sha256")
  .update(`stellar:${themeVersion}`)
  .digest("hex")
  .slice(0, 8);

hexo.extend.filter.register("after_render:html", html => {
  return html
    .replace(/\s*<meta\s+name=["']hexo-theme["'][^>]*>\s*/i, "\n")
    .replace(/\s*<meta\s+name=["']generator["'][^>]*>\s*/i, "\n")
    .replaceAll(`v=${encodeURIComponent(themeVersion)}`, `v=${assetRevision}`);
});
