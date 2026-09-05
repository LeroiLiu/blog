# Leroi Docs

这是 Leroi / 刘立陈基于 Astro 与 Starlight 构建的文档站，用来整理业务服务、前端、Vue、uni-app、微信小程序、Electron、Element UI、PHP、ThinkPHP、Swoole、Go、Gin、Lua、WebSocket、MQTT、Arduino、OpenWrt、Auto.js、逆向基础、Git、Docker、Kubernetes、MySQL、运维命令、FAQ 和开发问题记录。

主要内容在：

```txt
src/content/docs/
```

当前项目使用 Astro 官方文档工具 Starlight。内容以 Markdown 编写，构建后生成静态 HTML，适合发布到 GitHub Pages 并被搜索引擎收录。

## 目录

- `src/content/docs/index.md`：首页
- `src/content/docs/services.md`：业务服务与联系方式
- `src/content/docs/articles/`：技术分类入口
- `src/content/docs/frontend/`：Vue、uni-app、微信小程序、Electron、Element UI 和 Element Plus
- `src/content/docs/php/`：PHP 常见问题、Swoole 和 ThinkPHP 各版本
- `src/content/docs/go/`：Go 常见问题和 Gin 各版本
- `src/content/docs/backend/`：后端总览、Lua、WebSocket 和常见报错
- `src/content/docs/git/`：Git 常见操作和问题
- `src/content/docs/ops/`：Linux、Docker、Kubernetes、Nginx、Apache、LNMP、1Panel、宝塔、MinIO、rclone、curl/wget 等
- `src/content/docs/database/`：MySQL 安装测试、索引、查询和数据库相关内容
- `src/content/docs/iot/`：Arduino、OpenWrt、MQTT、EMQX、Mosquitto 和设备通信
- `src/content/docs/security/`：安全与逆向基础
- `src/content/docs/tools/`：Mac 本地环境、MAMP、XAMPP、Auto.js、Auto.js-Pro-Ext、开发工具和字体资源
- `src/content/docs/faq/`：常见问题和常见报错索引
- `astro.config.mjs`：Astro 与 Starlight 配置

## 本地预览

如需本地预览，可运行：

```sh
pnpm run dev
```

## 部署到 GitHub Pages

1. 将项目推送到 GitHub 仓库。
2. 在仓库设置中打开 `Settings -> Pages`。
3. 将 `Build and deployment -> Source` 设置为 `GitHub Actions`。
4. 推送到 `master` 或 `main` 分支后，工作流会构建并部署 `dist`。

如果使用自定义域名，可以在仓库 `Settings -> Secrets and variables -> Actions -> Variables` 中设置：

- `SITE_URL`：站点域名，例如 `https://docs.example.com`
- `BASE_PATH`：站点路径，根域名通常为 `/`

## 新增内容

新增页面时，在 `src/content/docs/` 下创建 Markdown 文件。分类侧边栏会根据目录自动生成。

当前项目仅使用 Astro 与 Starlight，页面内容统一以 Markdown 维护。
