---
title: ThinkPHP 3.2 至 8.x 存量项目维护与升级路线
description: 对比 ThinkPHP 3.2、5.0、5.1、6.x 和 8.x 的项目结构、维护重点、部署检查、常见问题和渐进升级方案。
date: '2026-05-29T10:41:59'
---
ThinkPHP 老项目升级通常不只是替换 Composer 依赖。跨版本会涉及目录结构、命名空间、路由、模型、配置和 PHP 运行环境，应该先保证系统可观察、可测试、可回滚，再决定维护还是迁移。

## 版本判断

| 版本 | 常见项目 | 建议 |
| --- | --- | --- |
| ThinkPHP 3.2 | 早期业务系统、旧后台 | 控制变更范围，优先修复安全和稳定问题 |
| ThinkPHP 5.0 | 早期 Composer 化项目 | 固定环境，逐步清理依赖与路由问题 |
| ThinkPHP 5.1 | 常见存量业务系统 | 补齐测试后评估迁移到 6.x 或 8.x |
| ThinkPHP 6.x | 现代目录结构的存量项目 | 保持 PHP 与第三方包兼容，准备平滑升级 |
| ThinkPHP 8.x | 新项目和长期迭代项目 | 使用较新 PHP 环境并建立规范化工程流程 |

## 所有版本都要先检查

- 本地、测试、生产的 PHP 版本和扩展是否一致。
- 数据库、缓存、文件存储和第三方服务是否有备份或降级方案。
- 登录、权限、支付、上传、导入导出和定时任务是否有回归清单。
- 生产环境是否关闭调试，错误是否进入日志。
- 运行目录权限、Web 根目录和伪静态是否正确。

## ThinkPHP 3.2

常见目录：

```text
Application/
Public/
ThinkPHP/
index.php
```

维护重点是确认线上 PHP 版本、入口文件、模块绑定、URL 模式和缓存目录。生产环境不要开启调试，否则可能暴露数据库账号、文件路径和代码结构。

修改代码后不生效时，先确认运行缓存；上传失败时检查上传目录以及 PHP-FPM 或 Web 服务运行用户。升级到 5.x 以上通常需要按模块重构，不建议直接覆盖框架。

## ThinkPHP 5.0

常见目录：

```text
application/
public/
runtime/
thinkphp/
vendor/
composer.json
```

Web 根目录应指向 `public/`，`runtime/` 需要可写，生产环境关闭 debug。首页正常而其他路径 404 时，重点检查伪静态和入口目录。

```bash
composer install --no-dev --optimize-autoloader
```

升级前检查路由、模型、配置文件和第三方扩展，不要直接在生产环境尝试大版本升级。

## ThinkPHP 5.1

ThinkPHP 5.1 存量项目应固定 Composer 依赖并保留锁文件，同时区分本地、测试和生产配置。

```bash
composer install
composer show
```

配置修改不生效时检查缓存和实际加载的环境文件；数据库连接失败时检查地址、账号、端口和网络策略；页面空白时优先查看 PHP 与 Web 服务错误日志。

如果项目还会长期维护，应先为登录、权限、列表、表单、上传、支付和任务流程补齐测试，再评估升级。

## ThinkPHP 6.x

常见目录：

```text
app/
config/
public/
route/
runtime/
vendor/
.env
composer.json
```

路由示例：

```php
use think\facade\Route;

Route::get('users', 'UserController/index');
Route::post('users', 'UserController/save');
Route::get('users/:id', 'UserController/read');
```

部署时确认 PHP 版本、入口目录、环境变量、缓存和日志。`.env` 不应提交到版本库，生产依赖使用 `--no-dev --optimize-autoloader` 安装。

## ThinkPHP 8.x

新项目或长期维护项目可以优先评估 ThinkPHP 8.x，但要先确认服务器、开发机与 CI 的 PHP 版本和扩展环境。

```bash
composer create-project topthink/think project-name
composer show topthink/framework
composer install --no-dev --optimize-autoloader
```

常用环境检查：

| 项目 | 建议 |
| --- | --- |
| PHP | 使用满足框架要求的稳定版本 |
| Composer | 保留锁文件，避免生产环境随意更新 |
| 扩展 | 检查 PDO、mbstring、openssl、fileinfo、curl 等 |
| Web 根目录 | 指向 `public/` |
| 配置 | 使用 `.env` 管理环境差异 |

涉及库存、支付回调、优惠券和并发任务时，可以继续阅读：[ThinkPHP 8 高并发处理](/blog/posts/php-thinkphp8-high-concurrency/)。

## 渐进升级路线

1. 固定当前 PHP、框架和依赖版本。
2. 补齐日志、监控和核心业务回归测试。
3. 把第三方调用与核心业务从控制器中逐步拆出。
4. 新建目标版本项目骨架，按模块迁移路由、配置、模型和服务。
5. 通过灰度或双轨方式验证，再切换正式流量。

大版本升级的目标是降低长期维护成本。没有测试、回滚和业务收益时，保守维护往往比一次性重写更可靠。
