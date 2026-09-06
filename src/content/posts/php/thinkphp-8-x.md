---
title: ThinkPHP 8.x
description: ThinkPHP 8.x 新项目选型、PHP 版本要求、项目结构、部署和升级注意事项。
---

ThinkPHP 8.x 更适合作为新项目或长期维护项目的优先选择。使用前先确认服务器、开发机、CI 的 PHP 版本和扩展环境。

## 适合场景

- 新 PHP 项目。
- 需要长期维护的业务系统。
- 希望使用较新 PHP 语言特性的项目。

如果项目涉及秒杀、支付回调、库存扣减、优惠券领取、定时任务并发执行等场景，可以配合阅读：[ThinkPHP 8 高并发处理](/php/thinkphp8-high-concurrency)。

## 新项目建议

创建项目：

```sh
composer create-project topthink/think project-name
```

查看框架版本：

```sh
composer show topthink/framework
```

生产安装依赖：

```sh
composer install --no-dev --optimize-autoloader
```

## 环境检查

| 项目 | 建议 |
| --- | --- |
| PHP | 使用满足框架要求的 PHP 版本 |
| Composer | 使用稳定版本，保留锁文件 |
| 扩展 | 检查 PDO、mbstring、openssl、fileinfo、curl 等 |
| Web 根目录 | 指向 `public/` |
| 配置 | 使用 `.env` 管理环境差异 |

## 部署检查

- 关闭 debug。
- `.env` 不提交到 Git。
- `runtime/` 有写入权限。
- Web 根目录指向 `public/`。
- Nginx 或 Apache 伪静态规则正确。
- 日志可以正常写入。

## 升级建议

从老版本升级到 8.x 时，不建议直接覆盖框架。更稳妥的是新建 8.x 项目骨架，再逐步迁移模块、配置、模型、控制器和公共服务。
