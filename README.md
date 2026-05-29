# Leroi Docs

这是 Leroi / 刘立陈的 VitePress 文档站，用来整理业务服务、前端、Vue、uni-app、微信小程序、Electron、Element UI、PHP、ThinkPHP、Swoole、Go、Gin、Lua、WebSocket、MQTT、Arduino、OpenWrt、Auto.js、逆向基础、Git、Docker、Kubernetes、MySQL、运维命令、FAQ 和开发问题记录。

主要内容在：

```txt
docs/
```

当前项目使用 VitePress 默认主题。内容以 Markdown 编写，部署后会生成静态 HTML，适合发布到 GitHub Pages 并被搜索引擎收录。

## 目录

- `docs/index.md`：首页
- `docs/services.md`：业务服务与联系方式
- `docs/articles/`：技术分类入口
- `docs/frontend/`：Vue、uni-app、微信小程序、Electron、Element UI 和 Element Plus
- `docs/php/`：PHP 常见问题、Swoole 和 ThinkPHP 各版本
- `docs/go/`：Go 常见问题和 Gin 各版本
- `docs/backend/`：后端总览、Lua、WebSocket 和常见报错
- `docs/git/`：Git 常见操作和问题
- `docs/ops/`：Linux、Docker、Kubernetes、Nginx、Apache、LNMP、1Panel、宝塔、MinIO、rclone、curl/wget 等
- `docs/database/`：MySQL 安装测试、索引、查询和数据库相关内容
- `docs/iot/`：Arduino、OpenWrt、MQTT、EMQX、Mosquitto 和设备通信
- `docs/security/`：安全与逆向基础
- `docs/tools/`：Mac 本地环境、MAMP、XAMPP、Auto.js、Auto.js-Pro-Ext、开发工具和字体资源
- `docs/faq/`：常见问题和常见报错索引
- `docs/.vitepress/config.mts`：VitePress 配置

## 本地预览

如需本地预览，可运行：

```sh
npm run docs:dev
```

## 部署到 GitHub Pages

1. 将项目推送到 GitHub 仓库。
2. 在仓库设置中打开 `Settings -> Pages`。
3. 将 `Build and deployment -> Source` 设置为 `GitHub Actions`。
4. 推送到 `main` 分支后，工作流会构建并部署 `docs/.vitepress/dist`。

如果使用自定义域名，可以在仓库 `Settings -> Secrets and variables -> Actions -> Variables` 中设置：

- `SITE_URL`：站点域名，例如 `https://docs.example.com`
- `BASE_PATH`：站点路径，根域名通常为 `/`

## 新增内容

新增页面时，在 `docs/` 下创建 Markdown 文件，并在 `docs/.vitepress/config.mts` 中补充导航或侧边栏链接。

已清理旧静态站草稿，当前主要维护 VitePress 文档内容。
