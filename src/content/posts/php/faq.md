---
title: PHP 常见问题
description: PHP 开发中 Composer、扩展、权限、错误日志、上传、时区、部署和性能相关常见问题。
---

## Composer 安装很慢怎么办

先确认网络和源配置。国内环境可以配置镜像源，也可以在 CI 或服务器上使用缓存。

查看配置：

```sh
composer config -l
```

安装生产依赖：

```sh
composer install --no-dev --optimize-autoloader
```

## 提示 PHP 扩展缺失怎么办

先查看当前 PHP 加载的扩展：

```sh
php -m
```

查看 PHP 配置文件位置：

```sh
php --ini
```

常见缺失扩展包括：

- `pdo_mysql`
- `mbstring`
- `openssl`
- `fileinfo`
- `curl`
- `gd`
- `redis`

安装扩展后要重启 PHP-FPM 或 Web 服务。

## 本地正常，服务器 500 怎么排查

优先看日志：

```sh
tail -n 200 /var/log/nginx/error.log
tail -n 200 /var/log/php-fpm/error.log
```

常见原因：

- 入口目录配置错误。
- 文件权限不对。
- PHP 版本不一致。
- Composer 依赖没有安装。
- `.env` 缺少配置。
- 生产环境关闭了错误显示，但日志里有真实错误。

## 文件上传失败怎么办

检查 PHP 配置：

```ini
upload_max_filesize = 20M
post_max_size = 20M
max_execution_time = 60
```

还要检查：

- Nginx `client_max_body_size`。
- 上传目录是否可写。
- 表单是否使用 `multipart/form-data`。
- 后端是否校验文件大小和类型。

## 权限问题怎么处理

PHP 项目常见可写目录包括缓存、日志、上传目录。

不要简单粗暴把整个项目改成 `777`。更合理的是：

```sh
chown -R www-data:www-data runtime public/uploads
chmod -R 775 runtime public/uploads
```

实际用户要根据服务器上的 PHP-FPM 用户调整。

## 时区不对怎么办

可以在 `php.ini` 设置：

```ini
date.timezone = Asia/Shanghai
```

也可以在项目配置中统一设置时区。不要在业务代码里到处临时改时区。

## 生产环境要关闭哪些东西

生产环境建议：

- 关闭 debug。
- 不把错误详情直接显示给用户。
- 使用独立日志文件记录异常。
- `.env` 不提交到 Git。
- Composer 使用 `--no-dev`。
- 开启 OPcache。

## 性能问题先看哪里

先确认瓶颈在哪里：

- 数据库慢查询。
- 外部接口响应慢。
- 缓存未命中。
- 文件 IO 过多。
- PHP-FPM 进程不足。
- Nginx、PHP-FPM、数据库连接数配置不合理。

不要一开始就改代码结构，先用日志和监控定位。
