---
title: ThinkPHP 5.0
description: ThinkPHP 5.0 项目维护、路由、控制器、模型、配置、部署和升级注意事项。
---

# ThinkPHP 5.0

ThinkPHP 5.0 是很多早期 5.x 项目的基础版本。相比 3.2，项目结构和开发方式变化明显，但现在更适合作为存量项目维护。

## 适合场景

- 已有 ThinkPHP 5.0 项目维护。
- 后台管理系统、业务系统、小型 API 项目。
- 短期内不准备大版本升级的老项目。

## 常见目录

```txt
application/
public/
runtime/
thinkphp/
vendor/
composer.json
```

## 维护重点

| 项目 | 建议 |
| --- | --- |
| Web 根目录 | 应指向 `public/` |
| 依赖 | 使用 Composer 管理，保留 `composer.lock` |
| 运行目录 | `runtime/` 需要可写 |
| 调试模式 | 生产环境关闭 debug |
| 路由 | 检查伪静态和路由定义是否一致 |

## 常见问题

### 访问首页正常，其他路径 404

通常是伪静态没有配置，或者 Web 根目录没有指向 `public/`。

### runtime 没有权限

确认 PHP-FPM 用户对 `runtime/` 有写入权限。

### Composer 依赖异常

先执行：

```sh
composer install
```

生产环境建议：

```sh
composer install --no-dev --optimize-autoloader
```

## 升级建议

从 5.0 升级到 5.1 或更高版本前，先检查路由、模型、配置文件和第三方扩展。不要在没有测试环境的情况下直接升级线上项目。
