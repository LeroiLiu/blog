# Leroi Blog

这是刘立陈（Leroi）使用 Hexo 8 与 [Stellar 2](https://github.com/xaoxuu/hexo-theme-stellar/tree/2.0.0-rc.1) 构建的个人技术博客。

## 内容结构

博客正文使用 Markdown，统一放在 `source/_posts/`：

```text
source/_posts/108102627.md
source/_posts/87598785.md
```

文章 Front Matter 示例：

```yaml
---
title: 文章标题
description: 文章摘要
date: 2026-09-07 10:00:00
categories:
  - PHP 与 ThinkPHP
tags:
  - PHP
---
```

图片放在 `source/images/blog/<文章 ID>/`，正文使用 `/blog/images/blog/<文章 ID>/<文件名>` 引用。路径显式包含 GitHub Pages 的 `/blog/` 基础路径，校验脚本会阻止遗漏前缀的资源链接。

## 本地开发

```sh
pnpm install
pnpm run dev
```

开发地址默认为 `http://localhost:4000/blog/`。

内容检查和完整构建：

```sh
pnpm run check
pnpm run build
```

`pnpm run check` 会检查 Front Matter、代码围栏、文章链接和本地图片是否完整。完整构建还会检查生成页面数量、基础路径和静态资源链接。

## GitHub Pages

站点配置为 `https://leroiliu.github.io/blog`，推送至 `master` 或 `main` 后由 GitHub Actions 构建并部署 `public/`。

当前阶段只迁移历史技术博客。手册型内容保留在之前的 Astro 分支，后续可按 Stellar Wiki 结构单独迁移。
