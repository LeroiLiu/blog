# Leroi Blog

这是 Leroi / 刘立陈使用 Astro 7 与 [AstroPaper](https://github.com/satnaing/astro-paper) 主题构建的个人技术博客和文档站。

## 内容结构

所有正文都使用 Markdown，统一放在：

```txt
src/content/posts/
```

文件路径就是页面路径。例如：

```txt
src/content/posts/php/swoole.md        -> /php/swoole/
src/content/posts/blog/php/72934027.md -> /blog/php/72934027/
src/content/posts/resume.md            -> /resume/
```

Markdown Frontmatter 支持：

```yaml
---
title: 页面标题
description: 页面摘要
date: 2026-09-06
tags: [Astro, PHP]
category: 后端开发
draft: false
---
```

`title` 必填；其他字段可选。位于 `src/content/posts/blog/`、包含发布日期且不是分类首页的内容，会进入博客列表、归档、标签页和 RSS。`category` 会作为主标签参与分类浏览。

## 项目结构

- `astro-paper.config.ts`：站点名称、作者、社交链接和 AstroPaper 功能配置
- `src/content.config.ts`：Astro 内容集合规则
- `src/content/posts/`：Markdown 内容
- `src/components/`、`src/layouts/`：AstroPaper 主题组件与布局
- `src/styles/`：AstroPaper 主题与正文样式
- `public/`：图片、字体、二维码和 PDF 等静态资源
- `astro.config.ts`：Astro、GitHub Pages 基础路径与 Markdown 配置

## 本地开发

```sh
pnpm install
pnpm run dev
```

类型检查和完整构建：

```sh
pnpm run check
pnpm run build
```

## GitHub Pages

仓库 Pages 的 Source 设为 `GitHub Actions`。推送到 `master` 或 `main` 后，工作流会构建并部署 `dist`。

可通过 Actions Variables 覆盖：

- `SITE_URL`：站点域名，默认 `https://leroiliu.github.io`
- `BASE_PATH`：站点基础路径，默认由工作流设置为仓库名 `/blog`

生产构建会同时生成 Pagefind 中文全文搜索索引。

## 主题许可

AstroPaper 主题采用 MIT 许可，原始许可保存在 `THIRD_PARTY_LICENSES/ASTROPAPER-LICENSE`。
