---
title: Hexo 部署常见问题
description: 整理 Hexo 博客部署到 GitHub Pages 时的子路径、资源 404、GitHub Actions 权限、构建产物、缓存和 Sitemap 收录问题。
excerpt: 整理 Hexo 博客部署到 GitHub Pages 时的子路径、资源 404、GitHub Actions 权限、构建产物、缓存和 Sitemap 收录问题。
date: '2026-05-29T10:41:59'
categories:
  - 服务器与运维
tags:
  - Hexo
  - GitHub Pages
  - GitHub Actions
  - 故障排查
  - SEO
---
<!-- more -->

Hexo 部署到 GitHub Pages 后，首页能够打开并不代表站点配置完全正确。资源路径、文章路由、构建产物和 Actions 权限中的任何一项不一致，都可能导致页面样式丢失、链接 404 或更新不生效。

排查时可以沿着“本地构建、构建产物、Pages 配置、线上访问路径”这条链路逐项确认。

## 先确认站点属于哪种路径

GitHub Pages 常见的访问方式有两种：

- 用户或组织站点通常发布在 `https://<用户名>.github.io/`，根路径为 `/`。
- 项目站点通常发布在 `https://<用户名>.github.io/<仓库名>/`，根路径为 `/<仓库名>/`。

当前博客属于项目站点，访问地址位于 `/blog/` 子路径，因此 Hexo 配置需要保持一致：

```yaml
url: https://leroiliu.github.io/blog
root: /blog/
permalink: posts/:name/
```

`url` 决定站点的完整地址，`root` 决定生成链接和静态资源时使用的根路径。两者配置不一致，通常会造成 CSS、JavaScript、图片或站内链接指向错误位置。

## 页面能打开，但 CSS、JavaScript 或图片 404

常见原因包括：

- `root` 仍然设置为 `/`，没有包含仓库子路径。
- Markdown 或主题配置中写死了以 `/` 开头的资源地址。
- 线上仍在使用旧的构建产物或浏览器缓存。
- 图片文件没有提交，或者文件名大小写与引用不一致。

本项目的站内静态资源应包含 `/blog/` 前缀，例如：

```markdown
![示例图片](/blog/images/example.png)
```

修改配置后，先清理缓存并重新构建：

```bash
pnpm run clean
pnpm run build
```

然后检查 `public/` 中是否存在对应的 CSS、JavaScript 和图片文件。macOS 默认文件系统通常不区分文件名大小写，而 GitHub Pages 运行环境会区分，因此本地正常、线上 404 时尤其需要检查大小写。

## GitHub Actions 成功，但网站没有更新

首先确认仓库 `Settings > Pages` 中的发布源使用 GitHub Actions。随后检查以下内容：

1. 工作流监听的分支是否与实际推送分支一致。
2. 最新提交是否触发了工作流，而不只是成功推送到其他分支。
3. 构建任务和部署任务是否都完成，而不是仅构建成功。
4. `github-pages` 环境中显示的部署提交是否为最新提交。
5. 强制刷新页面或清除 CDN、浏览器缓存后是否恢复。

例如，工作流只监听 `main` 和 `master` 时，推送到功能分支不会自动更新线上站点；需要将改动合并到发布分支，或者明确调整工作流触发规则。

## Actions 没有权限部署 Pages

使用 GitHub 官方 Pages Actions 时，工作流通常需要以下权限：

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

部署任务还应绑定 `github-pages` 环境。若日志中出现权限、OIDC 或 Pages 未启用等错误，需要同时检查工作流权限和仓库的 Pages 设置。

## 本地构建成功，但 Actions 构建失败

这类问题通常来自本地与 CI 环境差异：

- Node.js 或包管理器版本不同。
- 锁文件没有提交，或者依赖未按锁文件安装。
- 文件名大小写不一致。
- Markdown 引用了未提交或被 `.gitignore` 忽略的文件。
- 本地残留缓存掩盖了配置或依赖问题。

提交前可以使用与 CI 接近的方式重新安装并构建：

```bash
pnpm install --frozen-lockfile
pnpm run clean
pnpm run build
```

如果 CI 固定了 Node.js 和 pnpm 版本，本地也应尽量使用相同版本复现问题。

## 上传的构建目录不正确

Hexo 默认将静态站点生成到 `public/`。Pages 工作流上传构建产物时，应确保路径指向该目录，而不是项目根目录或 Markdown 源文件目录。

```yaml
- name: Upload artifact
  uses: actions/upload-pages-artifact@v3
  with:
    path: public
```

构建完成后至少应存在 `public/index.html`。如果首页文件不存在，应先检查 Hexo 构建命令和 `public_dir` 配置，而不是继续排查 Pages。

## 首页正常，但文章刷新后 404

Hexo 会为文章生成静态目录。使用 `posts/:name/` 规则时，一篇名为 `faq-deploy.md` 的文章通常对应：

```text
public/posts/faq-deploy/index.html
```

可以依次确认：

- 构建产物中是否存在该文件。
- 文章永久链接规则是否发生变化。
- 页面链接中的大小写和结尾斜杠是否正确。
- 旧链接是否需要设置重定向或继续保留原路径。

如果构建目录中没有文章页面，问题在 Hexo 生成阶段；如果文件存在但线上 404，则继续检查上传目录和 Pages 部署结果。

## Sitemap 存在，但搜索引擎搜不到

站点地图能够生成，不代表页面会立即被收录。当前博客的 Sitemap 地址为：

```text
https://leroiliu.github.io/blog/sitemap.xml
```

需要确认 Sitemap 可以公开访问，页面没有 `noindex`，并且 `robots.txt` 没有禁止抓取。新站点或刚迁移的页面通常还需要等待搜索引擎重新抓取，也可以在站长平台主动提交 Sitemap。

## 推荐排查顺序

1. 本地执行清理和完整构建，确认没有报错。
2. 检查 `public/index.html` 和目标文章页面是否生成。
3. 检查 CSS、JavaScript、图片的生成路径。
4. 核对 Hexo 的 `url`、`root` 和 `permalink`。
5. 核对 Actions 的触发分支、权限和上传目录。
6. 查看 Pages 部署环境对应的提交版本。
7. 最后再排查浏览器缓存、CDN 缓存和搜索引擎收录延迟。

## 官方文档

- [使用自定义 GitHub Actions 工作流发布 Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [配置 GitHub Pages 发布源](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Hexo 配置文档](https://hexo.io/docs/configuration)
