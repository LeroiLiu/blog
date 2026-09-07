"use strict";

hexo.extend.filter.register("after_render:html", html => {
  const root = hexo.config.root;
  if (!root || root === "/") return html;

  const doubledRoot = `${root}${root.replace(/^\//, "")}`;
  return html.replaceAll(`="${doubledRoot}`, `="${root}`);
});
