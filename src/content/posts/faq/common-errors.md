---
title: 常见报错
description: 汇总 Nginx、Apache、PHP、Swoole、Go、MySQL、OpenCV、InfluxDB、Elastic Stack、ELK、Grafana、Loki、MQTT、ROS 2、OpenWrt、Auto.js、WebSocket、Docker、Kubernetes、面板、前端后台模板、Git、服务器和本地开发环境中的常见报错与排查入口。
---

这一页适合快速检索。先根据错误码或错误文本定位大方向，再进入对应专题页看完整配置。

## Web 服务

| 报错 | 常见原因 | 处理入口 |
| --- | --- | --- |
| `403 Forbidden` | 目录权限、入口目录、Apache `Require all granted`、Nginx `index` 缺失 | [Nginx 配置](/ops/nginx)、[Apache 配置](/ops/apache) |
| `404 Not Found` | 文件不存在、路由回退错误、`try_files` 错误、伪静态错误 | [Nginx 配置](/ops/nginx)、[Apache 配置](/ops/apache) |
| `413 Request Entity Too Large` | 上传超过 Web 服务限制 | [Nginx 配置](/ops/nginx)、[后端常见报错](/backend/common-errors) |
| `500 Internal Server Error` | 应用异常、依赖缺失、权限、`.htaccess` 语法错误 | [后端常见报错](/backend/common-errors) |
| `502 Bad Gateway` | PHP-FPM 或上游服务不可用 | [Nginx 配置](/ops/nginx)、[1Panel 面板](/ops/onepanel) |
| `504 Gateway Timeout` | 接口耗时过长、上游超时、慢查询 | [后端常见报错](/backend/common-errors) |
| HTTPS 无限跳转 | 代理层协议头或应用 HTTPS 判断错误 | [Nginx 配置](/ops/nginx)、[Apache 配置](/ops/apache) |

## MySQL

| 报错 | 常见原因 | 处理入口 |
| --- | --- | --- |
| `Access denied for user` | 用户、密码、host 或授权不对 | [MySQL 安装与测试](/database/mysql-install-test) |
| `Connection refused` | MySQL 未启动、端口未监听或防火墙拦截 | [MySQL 安装与测试](/database/mysql-install-test) |
| `Can't connect to local MySQL server through socket` | socket 路径不对或服务未启动 | [MySQL 安装与测试](/database/mysql-install-test) |
| `Too many connections` | 慢查询堆积、连接未释放、PHP-FPM 并发过高或 max connections 太小 | [MySQL 慢查询](/database/mysql-slow-query)、[MySQL 安装与测试](/database/mysql-install-test) |
| `Packet for query is too large` | 单次 SQL 或导入数据超过包大小 | [MySQL 安装与测试](/database/mysql-install-test) |
| `Lock wait timeout exceeded` | 事务过长、热点行更新、更新条件未命中索引 | [MySQL 慢查询](/database/mysql-slow-query) |
| `Using temporary` / `Using filesort` | 排序、分组、索引顺序或查询字段设计不合理 | [MySQL 慢查询](/database/mysql-slow-query)、[MySQL 索引](/database/mysql-indexes) |
| 后台列表越翻越慢 | 深分页、排序字段缺索引或返回字段过多 | [MySQL 慢查询](/database/mysql-slow-query) |

## PHP 和 ThinkPHP

| 报错 | 常见原因 | 处理方向 |
| --- | --- | --- |
| `Class not found` | Composer autoload 未生成、命名空间错误 | `composer dump-autoload` |
| `could not find driver` | 缺少 `pdo_mysql` 等扩展 | `php -m`、检查 `php.ini` |
| `Call to undefined function` | PHP 扩展未启用或版本不兼容 | 安装扩展并重启 PHP-FPM |
| `failed to open stream: Permission denied` | 运行目录、缓存、上传目录不可写 | 调整所属用户和权限 |
| ThinkPHP 页面 404 | 伪静态规则或入口目录错误 | 检查 `public`、`.htaccess`、Nginx rewrite |
| 上传文件为空 | 表单类型、PHP 限制、Nginx 限制不一致 | 检查 `multipart/form-data` 和上传配置 |
| `Class Swoole\\... not found` | Swoole 扩展未安装或当前 PHP 未加载 | [Swoole](/php/swoole) |
| 支付回调重复执行 | 缺少幂等状态条件或订单号唯一约束 | [ThinkPHP 8 高并发](/php/thinkphp8-high-concurrency) |
| 库存出现负数 | 先查库存再扣库存，缺少原子更新条件 | [ThinkPHP 8 高并发](/php/thinkphp8-high-concurrency) |
| 用户重复提交 | 前端防抖没有后端幂等兜底 | [ThinkPHP 8 高并发](/php/thinkphp8-high-concurrency) |

相关入口：

- [PHP 常见问题](/php/faq)
- [ThinkPHP 3.2](/php/thinkphp-3-2)
- [ThinkPHP 5.0](/php/thinkphp-5-0)
- [ThinkPHP 5.1](/php/thinkphp-5-1)
- [ThinkPHP 6.x](/php/thinkphp-6-x)
- [ThinkPHP 8.x](/php/thinkphp-8-x)
- [ThinkPHP 8 高并发](/php/thinkphp8-high-concurrency)
- [Swoole](/php/swoole)

## Go 和 Gin

| 报错 | 常见原因 | 处理方向 |
| --- | --- | --- |
| `go: module ... not found` | 代理、网络、模块路径错误 | `GOPROXY`、`go mod tidy` |
| `missing go.sum entry` | 依赖校验文件缺失 | `go mod tidy` |
| `panic: runtime error` | 空指针、数组越界、类型断言失败 | 看堆栈和请求参数 |
| `address already in use` | 服务端口被占用 | `lsof`、`ss -lntp` |
| Gin 取不到 JSON | 没有设置 `Content-Type: application/json` 或结构体 tag 错误 | 检查请求头和绑定结构体 |
| 代理后拿不到真实 IP | 反向代理 header 或 Gin trusted proxies 配置问题 | 检查 `X-Forwarded-For` 和代理信任配置 |

相关入口：

- [Go 常见问题](/go/faq)
- [Gin 使用指南](/go/gin-guide)

## 定时任务和轮询任务

| 报错或现象 | 常见原因 | 处理入口 |
| --- | --- | --- |
| 任务被重复执行 | 缺少业务唯一键、领取任务没有锁、业务处理不幂等 | [HTTP 轮询任务](/backend/http-cron-polling) |
| 任务卡在 `processing` | PHP 中断、锁过期时间太长、没有恢复机制 | [HTTP 轮询任务](/backend/http-cron-polling) |
| `crontab` 执行了但任务没跑 | curl 路径、token、PHP 错误、HTTP 超时或接口被防火墙拦截 | [HTTP 轮询任务](/backend/http-cron-polling) |
| 任务一直失败重试 | 第三方接口异常、请求参数错误、没有记录失败原因 | [HTTP 轮询任务](/backend/http-cron-polling) |
| PHP-FPM 被任务接口占满 | 单次请求太久、批量太大、并发触发过多 | [HTTP 轮询任务](/backend/http-cron-polling) |

## WebSocket 和 MQTT

| 报错 | 常见原因 | 处理入口 |
| --- | --- | --- |
| WebSocket 连接失败 | URL、协议、端口、代理或鉴权错误 | [WebSocket](/backend/websocket) |
| HTTPS 页面无法连接 `ws://` | 浏览器混合内容限制 | [WebSocket](/backend/websocket) |
| WebSocket 经过 Nginx 后断开 | Upgrade 头或超时配置错误 | [WebSocket](/backend/websocket) |
| MQTT `Connection Refused` | Broker 未启动、端口不通、认证失败 | [MQTT 基础](/iot/mqtt) |
| MQTT 收不到消息 | topic 不一致、ACL、QoS、订阅时机问题 | [MQTT 基础](/iot/mqtt) |
| MQTT 消息积压 | 消费端太慢、ThinkPHP 接口慢、离线会话、QoS 和数据库写入压力 | [MQTT 消息积压处理](/iot/mqtt-message-backlog-emqx-php) |
| EMQX Dashboard 打不开 | `18083` 未开放、容器未启动、防火墙拦截 | [EMQX](/iot/emqx) |
| Mosquitto 只能本机连接 | 未配置 listener 或安全策略限制 | [Mosquitto](/iot/mosquitto) |
| `ros2: command not found` | ROS 2 环境没有 source | [ROS 2 快速入门](/iot/ros2-quickstart) |
| `Unable to locate package ros-jazzy-desktop` | Ubuntu 版本、ROS 发行版或 apt 源不匹配 | [ROS 2 快速入门](/iot/ros2-quickstart) |
| `colcon: command not found` | 未安装 ROS 开发工具 | [ROS 2 快速入门](/iot/ros2-quickstart) |
| OpenWrt 安装包失败 | 软件源不匹配、网络不通、空间不足 | [OpenWrt](/iot/openwrt) |
| OpenWrt LuCI 打不开 | IP 冲突、Web 服务未启动、防火墙限制 | [OpenWrt](/iot/openwrt) |

## 视觉、监控和日志

| 报错 | 常见原因 | 处理入口 |
| --- | --- | --- |
| `No module named cv2` | 当前 Python 环境没有安装 OpenCV，或安装到了另一个虚拟环境 | [OpenCV](/vision/opencv) |
| `cv2.imread` 返回 `None` | 文件路径错误、中文路径处理不当、权限不足或图片损坏 | [OpenCV](/vision/opencv) |
| OpenCV 颜色发蓝发红 | OpenCV 默认是 BGR，Web、Pillow、Matplotlib 通常是 RGB | [OpenCV](/vision/opencv) |
| `cv2.imshow` 无法显示 | 服务器或容器没有桌面环境，或缺少图形库 | [OpenCV](/vision/opencv) |
| InfluxDB `unauthorized access` | token、org、bucket 或权限配置不一致 | [InfluxDB](/observability/influxdb) |
| InfluxDB 查询没有数据 | 时间范围、measurement、tag、bucket 或写入时间戳不对 | [InfluxDB](/observability/influxdb) |
| Elasticsearch `max virtual memory areas vm.max_map_count is too low` | Linux 内核参数没有达到 Elasticsearch 要求 | [Elastic Stack / ELK](/observability/elastic-stack) |
| Kibana 无法连接 Elasticsearch | 地址、容器网络、认证信息或版本不一致 | [Elastic Stack / ELK](/observability/elastic-stack) |
| Logstash 不输出数据 | pipeline 配置、输入端口、字段解析或目标地址错误 | [Elastic Stack / ELK](/observability/elastic-stack) |
| Grafana 数据源连接失败 | URL、容器网络、token、账号密码或服务状态不对 | [Grafana](/observability/grafana) |
| Grafana 面板没有数据 | 时间范围、查询语句、数据源选择或字段映射不对 | [Grafana](/observability/grafana) |
| Loki 查不到日志 | 采集器未推送、label 不匹配、时间范围不对或数据源配置错误 | [Loki](/observability/loki) |
| Loki 日志量很大查询很慢 | label 设计过细、时间范围太大或日志保留策略不合理 | [Loki](/observability/loki) |

## 前端和本地开发

| 报错 | 常见原因 | 处理入口 |
| --- | --- | --- |
| Vite 白屏 | base 路径、资源 404、运行时报错 | [前端 FAQ](/faq/frontend) |
| `Cannot find module '@/...'` | TypeScript `paths`、Vite alias、文件大小写或 include 范围错误 | [TypeScript](/frontend/typescript)、[Vite](/frontend/vite) |
| `Failed to resolve import` | 路径别名、文件不存在、大小写不一致 | [前端 FAQ](/faq/frontend) |
| `Property 'env' does not exist on type 'ImportMeta'` | 缺少 `vite/client` 类型声明 | [TypeScript](/frontend/typescript) |
| `process is not defined` | Vite 前端项目还在使用 `process.env` 或依赖访问 Node 环境变量 | [Vite](/frontend/vite) |
| `Access to script at file://... has been blocked by CORS policy` | 直接打开构建后的 HTML 文件 | [Vite](/frontend/vite) |
| `Uncaught ReferenceError: global is not defined` | 浏览器端依赖使用了 Node.js 全局变量 | [Vite](/frontend/vite) |
| `Could not find a declaration file for module` | 第三方库没有类型声明 | [TypeScript](/frontend/typescript) |
| `Object is possibly 'undefined'` | 严格空值检查下没有处理可选值 | [TypeScript](/frontend/typescript) |
| `No inputs were found in config file` | `tsconfig.json` 的 `include` 范围错误 | [TypeScript](/frontend/typescript) |
| `431 Request Header Fields Too Large` | Cookie 或请求头过大 | [Vite](/frontend/vite) |
| `Some chunks are larger than 500 kBs` | 大依赖没有懒加载或分包 | [Vite](/frontend/vite) |
| `npm ERR! code ERESOLVE` | 老后台模板依赖和新版 npm peer 依赖检查冲突 | [后台模板选型](/frontend/admin-templates) |
| `Node Sass does not yet support your current environment` | Vue 2、Webpack 老项目的 Node 和 `node-sass` 不匹配 | [vue-element-admin](/frontend/vue-element-admin)、[iview-admin](/frontend/iview-admin) |
| `error:0308010C:digital envelope routines::unsupported` | Webpack 4 在 Node 17+ 下运行 | [vue-element-admin](/frontend/vue-element-admin) |
| `Module build failed: TypeError: this.getOptions is not a function` | loader 版本和 Webpack 版本不匹配 | [后台模板选型](/frontend/admin-templates) |
| 后台登录后跳回登录页 | token、用户信息、权限菜单或路由守卫不一致 | [vue-element-admin](/frontend/vue-element-admin)、[Geeker Admin](/frontend/geeker-admin) |
| 后台菜单不显示 | 用户角色、后端菜单、前端权限路由或 `hidden` 配置问题 | [后台模板选型](/frontend/admin-templates) |
| `Unknown custom element: <i-button>` | iView/View UI 未注册或包名混用 | [iView UI v4](/frontend/iview-ui-v4) |
| `Cannot find module '@element-plus/icons-vue'` | Element Plus 图标包未安装或自动导入配置不完整 | [Geeker Admin](/frontend/geeker-admin)、[Element Plus](/frontend/element-plus) |
| 跨域 CORS | 后端响应头或预检请求配置错误 | [后端常见报错](/backend/common-errors) |
| 页面样式错乱 | CSS 覆盖、组件版本、暗黑模式颜色变量 | [Vue 总览](/frontend/vue) |
| Tailwind/UnoCSS 生产样式丢失 | 动态 class 没被扫描到或入口 CSS 未引入 | [Tailwind CSS](/frontend/tailwindcss)、[UnoCSS](/frontend/unocss) |
| 小程序真机正常开发者工具异常 | 运行环境差异、基础库、权限 | [微信小程序常见问题](/frontend/wechat-miniprogram) |
| uni-app 多端表现不一致 | 条件编译、平台 API 差异 | [uni-app 常见问题](/frontend/uni-app) |
| Electron 打开空白 | 静态资源路径、主进程窗口、 preload 报错 | [Electron 常见问题](/frontend/electron) |

## 服务器和面板

| 报错 | 常见原因 | 处理入口 |
| --- | --- | --- |
| 安装脚本中断 | SSH 断开、软件源不可用、内存不足 | [LNMP 一键安装](/ops/lnmp) |
| 证书申请失败 | DNS 未解析、80 端口不通、代理配置冲突 | [Nginx 配置](/ops/nginx)、[1Panel 面板](/ops/onepanel) |
| 面板无法访问 | 端口未放行、服务未启动、安全入口错误 | [1Panel 面板](/ops/onepanel) |
| Docker 应用启动失败 | 镜像拉取、端口、磁盘、环境变量问题 | [1Panel 面板](/ops/onepanel) |
| Docker daemon 连接失败 | Docker 未启动或权限不足 | [Docker 运维](/ops/docker) |
| K8s 节点 `NotReady` | CNI、kubelet、containerd 或网络异常 | [Kubernetes 运维](/ops/kubernetes) |
| Pod `ImagePullBackOff` | 镜像名、tag、仓库权限或网络问题 | [Kubernetes 运维](/ops/kubernetes) |
| 宝塔面板打不开 | 面板服务、端口、安全入口或安全组问题 | [宝塔面板](/ops/baota) |
| <code>curl/wget</code> 证书错误 | CA 证书过期、系统时间错误、证书链异常 | [curl/wget HTTPS 证书](/ops/curl-wget-ssl) |

## Mac 本地环境

| 报错 | 常见原因 | 处理入口 |
| --- | --- | --- |
| Apache 启动失败 | `80/443` 被占用 | [Mac 本地开发环境](/tools/mac-local-env)、[XAMPP](/tools/xampp) |
| MAMP 页面打不开 | 端口不是 `80`，访问地址没带端口 | [MAMP](/tools/mamp) |
| MySQL 连不上 | 端口、socket、账号密码、多个数据库实例冲突 | [Mac 本地开发环境](/tools/mac-local-env) |
| Composer PHP 版本不对 | 终端 PHP 和 Web PHP 不一致 | [MAMP](/tools/mamp)、[XAMPP](/tools/xampp) |
| 本地域名不生效 | hosts 没保存、DNS 缓存、端口错误 | [Mac 本地开发环境](/tools/mac-local-env) |
| Auto.js 找不到控件 | 权限、页面未加载、文本变化或控件层级变化 | [Auto.js](/tools/autojs) |
| Auto.js 脚本运行一会停止 | 无障碍服务被关闭、省电策略或脚本异常 | [Auto.js](/tools/autojs) |
| Auto.js API 对不上教程 | Auto.js、Pro 8、Pro 9、AutoX.js 版本混用 | [Auto.js 版本区别](/tools/autojs-versions) |
| Auto.js-Pro-Ext 无法连接设备 | 局域网、防火墙、ADB、远程调试或后台限制问题 | [Auto.js-Pro-Ext](/tools/autojs-pro-ext) |

## Git

| 报错 | 常见原因 | 处理入口 |
| --- | --- | --- |
| `Permission denied (publickey)` | SSH key 没配好或账号不对 | [Git 常见问题](/git/troubleshooting) |
| `Your branch is behind` | 本地分支落后远程 | [Git 常见操作](/git/common-commands) |
| `CONFLICT` | 合并冲突 | [Git 常见问题](/git/troubleshooting) |
| 文件权限反复变化 | `core.filemode` 影响 | [忽略文件权限变化](/git/filemode) |

## 排查时要记录什么

遇到报错时，建议记录：

- 完整错误文本。
- 发生时间。
- 请求 URL 和请求方法。
- 最近一次改动。
- 服务器环境和软件版本。
- 相关日志最后 100 行。
- 已经尝试过的处理方式。

这样下次再遇到同类问题时，不需要重新从零排查。
