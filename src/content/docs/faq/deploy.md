---
title: 部署常见问题
description: GitHub Pages 和静态文档站部署中的常见问题。
---

## GitHub Pages 打开后资源 404

现象：

页面能打开，但 CSS、JS、图片等资源返回 404。

原因：

项目页部署地址通常是 `https://<owner>.github.io/<repo>/`，资源路径需要包含 `/<repo>/`。

解决：

本项目的工作流会自动根据仓库名设置 `BASE_PATH`。如果你手动部署，请确保 Astro 的 `base` 与最终访问路径一致。

## 搜索引擎为什么还搜不到

新站点上线后，搜索引擎需要时间发现、抓取和索引页面。即使技术配置正确，也不会立即出现在搜索结果中。

可以做这些事：

- 确认站点公开可访问。
- 确认页面没有登录限制。
- 确认 `robots.txt` 没有禁止抓取。
- 在搜索引擎站长平台提交 `sitemap.xml`。
- 让其他公开页面链接到这个文档站。

## sitemap 地址在哪里

部署完成后，站点地图通常在：

```txt
https://<owner>.github.io/<repo>/sitemap-index.xml
```

如果使用自定义域名，则是：

```txt
https://docs.example.com/sitemap-index.xml
```
