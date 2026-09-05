# Leroi Blog

这是 Leroi / 刘立陈使用 Astro 7 与 [Sumi](https://github.com/kpab/astro-sumi) 主题构建的个人技术博客和文档站。

## 内容结构

所有正文都使用 Markdown，统一放在：

```txt
src/content/docs/
```

文件路径就是页面路径。例如：

```txt
src/content/docs/php/swoole.md        -> /php/swoole/
src/content/docs/blog/php/72934027.md -> /blog/php/72934027/
src/content/docs/resume.md            -> /resume/
```

Markdown Frontmatter 支持：

```yaml
---
title: 页面标题
description: 页面摘要
date: 2026-09-06
tags: [Astro, PHP]
draft: false
---
```

`title` 必填；其他字段可选。位于 `src/content/docs/blog/`、包含发布日期且不是分类首页的内容，会进入博客时间线、标签页和 RSS。

## 项目结构

- `src/config.ts`：站点名称、导航、作者和 Sumi 主题配置
- `src/content.config.ts`：Astro 内容集合规则
- `src/content/docs/`：Markdown 内容
- `src/components/`、`src/layouts/`：Sumi 主题组件与布局
- `src/styles/`：Sumi 设计令牌、字体和正文样式
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

## 主题许可

Sumi 主题采用 MIT 许可，原始许可保存在 `THIRD_PARTY_LICENSES/SUMI-LICENSE`；字体许可保存在 `public/fonts/LICENSE.txt`。
