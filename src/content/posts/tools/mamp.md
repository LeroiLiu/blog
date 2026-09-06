---
title: MAMP
description: macOS 下 MAMP 安装、默认目录、端口、PHP 配置、MySQL 连接和常见问题。
---

MAMP 适合在 macOS 上快速运行 Apache、Nginx、MySQL 和 PHP。本地开发时最大的好处是开箱即用，最大的坑是端口和 PHP 版本容易和终端环境不一致。

## 默认目录

常见目录：

- 程序目录：`/Applications/MAMP`
- 默认站点目录：`/Applications/MAMP/htdocs`
- PHP 版本目录：`/Applications/MAMP/bin/php/`

默认站点目录可以在 MAMP 设置中修改。项目多的时候，建议统一放到一个工作目录，再把 MAMP 的 Document Root 指过去。

## 默认端口

MAMP 默认端口通常是：

| 服务 | 默认端口 |
| --- | --- |
| Apache | `8888` |
| Nginx | `7888` |
| MySQL | `8889` |

访问默认站点：

```txt
http://localhost:8888
```

如果把 Web 端口改成 `80`，访问时可以省略端口，但可能需要管理员权限，也更容易和系统 Apache、Nginx、XAMPP 冲突。

## PHP 配置

每个 PHP 版本都有独立配置。查找当前 CLI PHP：

```sh
/Applications/MAMP/bin/php/php8.2.0/bin/php -v
```

具体目录里的 `php8.2.0` 要换成你本机真实版本。

常改配置：

```ini
upload_max_filesize = 50M
post_max_size = 50M
memory_limit = 256M
max_execution_time = 60
date.timezone = Asia/Shanghai
```

改完后重启 MAMP 服务。

## Composer 使用 MAMP PHP

如果终端默认 PHP 版本不对，可以临时这样执行：

```sh
/Applications/MAMP/bin/php/php8.2.0/bin/php /usr/local/bin/composer install
```

也可以把 MAMP 的 PHP 加到 shell PATH，但要注意别影响其他项目。

## MySQL 连接

本机工具连接常用配置：

```txt
Host: 127.0.0.1
Port: 8889
User: root
Password: root
```

密码以本机 MAMP 配置为准。

如果 `localhost` 连接失败，改成 `127.0.0.1` 试试，因为有些客户端会把 `localhost` 当成 socket 连接。

## 常见问题

### Apache 或 Nginx 启动失败

可能是端口被占用：

```sh
lsof -nP -iTCP:8888 -sTCP:LISTEN
lsof -nP -iTCP:80 -sTCP:LISTEN
```

处理方式：

- 停掉占用端口的服务。
- 或在 MAMP 设置里换一个端口。

### 浏览器访问不是我的项目

检查：

- Document Root 是否指向当前项目。
- URL 是否带了正确端口。
- 项目入口是否在子目录。
- 浏览器缓存是否影响了页面。

### PHP 扩展缺失

先看当前 Web 使用的 PHP 版本，再看扩展：

```sh
/Applications/MAMP/bin/php/php8.2.0/bin/php -m
```

如果项目强依赖某些扩展，而 MAMP 当前版本不方便安装，考虑切换 PHP 版本或使用 Docker。

### 上传失败

同时调整：

- `upload_max_filesize`
- `post_max_size`
- `memory_limit`
- Web 服务上传限制
- 项目自身上传限制

## 官方入口

- [MAMP Mac First Steps](https://documentation.mamp.info/en/MAMP-Mac/First-Steps/)
- [MAMP Mac Ports](https://documentation-5.mamp.info/en/MAMP-Mac/Preferences/Ports/index.html)
- [MAMP php.ini FAQ](https://documentation-6.mamp.info/en/MAMP-Mac/FAQ/Where-can-I-find-the-php.ini-file/)
