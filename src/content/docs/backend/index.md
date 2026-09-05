---
title: 后端
description: 后端技术总览，整理 PHP 版本演进、PHP、ThinkPHP、ThinkPHP 8 高并发、EasyWeChat、微擎、Swoole、Go、Gin、Lua、WebSocket、HTTP 轮询任务、数据库、Git、运维和后端开发常见问题。
---

这里整理后端相关技术栈。入口按语言、框架、数据库、工程协作和部署维护拆分，方便快速找到问题所属位置。

## 技术栈入口

| 分组 | 入口 | 内容 |
| --- | --- | --- |
| 总览 | [后端常见报错](/backend/common-errors) | 500、502、数据库连接、权限、上传、跨域、接口超时 |
| PHP | [PHP 总览](/php/) | PHP 常见问题、Composer、扩展、权限、上传、部署和性能排查 |
| PHP | [PHP 版本演进](/php/php-version-history) | PHP 5.0 到 PHP 8.5 的升级变化、语法示例、兼容问题和老项目升级路线 |
| PHP | [EasyWeChat](/php/easywechat) | 公众号、小程序、支付、消息回调、JS-SDK 和 token 问题 |
| PHP | [微擎](/php/weengine) | 微擎环境、模块、公众号小程序、支付、伪静态和老项目维护 |
| PHP | [ThinkPHP](/php/thinkphp-8-x) | ThinkPHP 3.2、5.0、5.1、6.x、8.x 版本维护 |
| PHP | [ThinkPHP 8 高并发](/php/thinkphp8-high-concurrency) | 库存扣减、支付回调幂等、Redis 锁、简单 SQL、事务和限流 |
| PHP | [Swoole](/php/swoole) | PHP 常驻内存、HTTP 服务、WebSocket、协程和部署问题 |
| Go | [Go 总览](/go/) | Go Module、交叉编译、并发、部署和性能排查 |
| Go | [Gin](/go/gin-guide) | Gin 使用指南、Gin 1.9、1.10、1.11、1.12 版本维护 |
| 通信与脚本 | [HTTP 轮询任务](/backend/http-cron-polling) | ThinkPHP 8 + MySQL + HTTP + crontab 的定时任务、防重复、失败重试和并发控制 |
| 通信与脚本 | [WebSocket](/backend/websocket) | 长连接、心跳、鉴权、Nginx 代理和常见断线问题 |
| 通信与脚本 | [Lua](/backend/lua) | Lua 基础、table、模块、OpenResty 场景和常见问题 |
| 工程支撑 | [数据库](/database/) | MySQL 安装、索引、join、查询理解和数据库笔记 |
| 工程支撑 | [Git](/git/) | 分支协作、常见操作、冲突处理和文件权限问题 |
| 工程支撑 | [物联网/MQTT](/iot/) | Arduino、MQTT、EMQX、Mosquitto 和设备通信 |
| 工程支撑 | [运维](/ops/) | Linux、Docker、Kubernetes、MinIO、rclone、<code>curl/wget</code> 和服务器维护 |

## 常见后端问题方向

| 问题 | 优先查看 |
| --- | --- |
| 服务器 500、依赖缺失、上传失败 | [PHP 常见问题](/php/faq) |
| PHP 5、PHP 7、PHP 8 版本差异和升级路线 | [PHP 版本演进](/php/php-version-history) |
| 微信公众号、小程序、支付 SDK 对接 | [EasyWeChat](/php/easywechat) |
| 微擎老项目维护、模块和支付配置 | [微擎](/php/weengine) |
| ThinkPHP 老项目维护或升级 | [ThinkPHP 版本文档](/php/thinkphp-8-x) |
| ThinkPHP 8 秒杀、支付回调、库存和重复提交 | [ThinkPHP 8 高并发处理](/php/thinkphp8-high-concurrency) |
| Swoole、WebSocket、长连接 | [Swoole](/php/swoole)、[WebSocket](/backend/websocket) |
| Go 依赖、并发、交叉编译、部署 | [Go 常见问题](/go/faq) |
| Gin 路由、中间件、参数绑定 | [Gin 使用指南](/go/gin-guide) |
| 定时任务、轮询任务、防重复执行 | [HTTP 轮询任务](/backend/http-cron-polling) |
| Lua、OpenResty、脚本扩展 | [Lua 基础](/backend/lua) |
| SQL join、索引和查询理解 | [数据库](/database/) |
| MQTT、设备接入、消息通信 | [物联网/MQTT](/iot/) |
| 发布、服务器、对象存储迁移 | [运维](/ops/) |
| 后端接口 500、502、跨域、超时 | [后端常见报错](/backend/common-errors) |

后端文档后续可以继续补充接口规范、鉴权、日志、队列、缓存、支付、对象存储和第三方接口对接。
