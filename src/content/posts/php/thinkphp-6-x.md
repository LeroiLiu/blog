---
title: ThinkPHP 6.x
description: ThinkPHP 6.x 项目维护、目录结构、路由、控制器、模型、配置、部署和升级建议。
---

ThinkPHP 6.x 更强调 Composer 化和现代 PHP 项目结构，是很多存量项目正在使用的版本。维护时要关注依赖版本、PHP 版本和第三方扩展兼容。

## 适合场景

- 已有 ThinkPHP 6.x 项目维护。
- 需要较清晰目录结构和 Composer 依赖管理的业务系统。
- 正在从 5.x 向更高版本过渡的项目。

## 常见目录

```txt
app/
config/
public/
route/
runtime/
vendor/
.env
composer.json
```

## 核心检查

| 项目 | 建议 |
| --- | --- |
| PHP 版本 | 本地、测试、生产保持一致 |
| 入口目录 | Web 根目录指向 `public/` |
| 环境变量 | `.env` 不提交到 Git |
| 缓存 | 配置变更后注意清理缓存 |
| 日志 | 生产环境保留错误日志 |

## 路由示例

```php
use think\facade\Route;

Route::get('users', 'UserController/index');
Route::post('users', 'UserController/save');
Route::get('users/:id', 'UserController/read');
```

## 部署建议

生产环境安装依赖：

```sh
composer install --no-dev --optimize-autoloader
```

上线前检查：

- debug 是否关闭。
- `runtime/` 是否可写。
- 数据库配置是否正确。
- 伪静态是否生效。
- 日志路径是否可写。

## 升级建议

从 6.x 升级到 8.x 前，先确认 PHP 版本是否满足要求，并检查所有第三方包是否兼容目标版本。
