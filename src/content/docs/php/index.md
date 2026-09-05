---
title: PHP
description: PHP 版本演进、PHP 开发常见问题、ThinkPHP 8 高并发、ThinkPHP 8 轮询任务、EasyWeChat、微擎、Swoole 与 ThinkPHP 3.2、5.0、5.1、6.x、8.x 版本文档入口。
---

这里整理 PHP 技术栈相关内容。PHP 本身的问题放在常见问题里，ThinkPHP 按版本拆分，方便维护老项目和新项目时快速定位。

## 常见问题

| 页面 | 内容 |
| --- | --- |
| [PHP 版本演进](/php/php-version-history) | PHP 5.0 到 PHP 8.5 的升级变化、语法示例、兼容问题和老项目升级路线 |
| [PHP 常见问题](/php/faq) | Composer、扩展、权限、错误日志、上传、时区、部署和性能问题 |
| [ThinkPHP 8 轮询任务](/backend/http-cron-polling) | HTTP 触发、crontab、任务表、防重复、不中断、失败重试和幂等处理 |
| [ThinkPHP 8 高并发处理](/php/thinkphp8-high-concurrency) | 库存扣减、支付回调幂等、Redis 锁、简单 SQL、事务、限流和常见并发问题 |
| [EasyWeChat 常见问题](/php/easywechat) | 微信公众号、小程序、支付、消息回调、JS-SDK、access_token |
| [微擎常见问题](/php/weengine) | 微擎环境、模块开发、公众号小程序配置、权限、伪静态和支付 |
| [Swoole](/php/swoole) | PHP 常驻内存、HTTP 服务、WebSocket、协程、进程管理和常见问题 |

## ThinkPHP 版本

| 版本 | 适合场景 |
| --- | --- |
| [ThinkPHP 3.2](/php/thinkphp-3-2) | 老系统维护、历史项目排障 |
| [ThinkPHP 5.0](/php/thinkphp-5-0) | 早期 5.x 项目维护 |
| [ThinkPHP 5.1](/php/thinkphp-5-1) | 5.x 存量项目维护与小版本整理 |
| [ThinkPHP 6.x](/php/thinkphp-6-x) | Composer 化项目、常见存量业务系统 |
| [ThinkPHP 8.x](/php/thinkphp-8-x) | 新项目、较新 PHP 环境、长期维护项目 |
| [ThinkPHP 8 高并发](/php/thinkphp8-high-concurrency) | 新项目里的高并发、幂等、锁、缓存和事务处理 |

## 维护建议

新项目优先选择维护活跃、PHP 版本要求明确的 ThinkPHP 版本。老项目先保证稳定运行、备份完整、日志清楚，再考虑升级或重构。
