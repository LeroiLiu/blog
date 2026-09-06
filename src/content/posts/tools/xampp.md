---
title: XAMPP
description: macOS 下 XAMPP 安装、启动、目录、配置文件、端口、安全和常见报错。
---

XAMPP 是面向本地开发的 Apache、MariaDB、PHP、Perl 集成环境。它适合学习和本地调试，不建议直接作为生产环境使用。

## 安装和启动

macOS 下通常安装到：

```txt
/Applications/XAMPP
```

启动面板：

```txt
manager-osx
```

启动 Apache、MySQL 后访问：

```txt
http://localhost
```

如果使用 XAMPP-VM，站点目录和访问方式会和原生安装版不同，要以面板中的挂载目录为准。

## 常见目录

常见路径：

```txt
/Applications/XAMPP/xamppfiles/htdocs
/Applications/XAMPP/xamppfiles/etc/httpd.conf
/Applications/XAMPP/xamppfiles/etc/php.ini
/Applications/XAMPP/xamppfiles/etc/my.cnf
```

`htdocs` 是默认 Web 根目录。把项目放进去以后，通常通过：

```txt
http://localhost/project-name
```

访问。

## PHP 配置

常改配置：

```ini
upload_max_filesize = 50M
post_max_size = 50M
memory_limit = 256M
max_execution_time = 60
date.timezone = Asia/Shanghai
```

改完 `php.ini` 后重启 Apache。

## 虚拟主机

如果不想用 `/project-name` 子目录，可以配置虚拟主机。

示例：

```apache
<VirtualHost *:80>
    ServerName local.example.test
    DocumentRoot "/Applications/XAMPP/xamppfiles/htdocs/example/public"

    <Directory "/Applications/XAMPP/xamppfiles/htdocs/example/public">
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

hosts：

```txt
127.0.0.1 local.example.test
```

如果使用框架项目，`DocumentRoot` 通常应该指向 `public`。

## 常见问题

### Apache 启动失败

常见原因是 `80` 或 `443` 被占用。

```sh
lsof -nP -iTCP:80 -sTCP:LISTEN
lsof -nP -iTCP:443 -sTCP:LISTEN
```

可以停止冲突服务，也可以修改 Apache 监听端口。

### MySQL 或 MariaDB 启动失败

排查：

- 是否已经有 Homebrew MySQL、MAMP MySQL 在运行。
- 数据目录是否损坏。
- 端口 `3306` 是否被占用。
- 磁盘空间是否不足。

```sh
lsof -nP -iTCP:3306 -sTCP:LISTEN
```

### 页面 403

常见原因：

- 目录权限不足。
- `Directory` 块缺少 `Require all granted`。
- 项目入口目录配置错了。
- `.htaccess` 不生效。

### <code>.htaccess</code> 不生效

检查：

- `mod_rewrite` 是否启用。
- 虚拟主机或目录配置里是否允许 `AllowOverride All`。
- `.htaccess` 是否在正确目录。

### Composer 使用的不是 XAMPP PHP

检查终端 PHP：

```sh
which php
php -v
```

如果终端 PHP 和 XAMPP PHP 不一致，可以临时指定 XAMPP PHP 跑 Composer。具体 PHP 路径以本机安装版本为准。

## 安全提醒

XAMPP 默认偏向本地开发便利，不适合直接开放到公网。不要把本地 XAMPP 当生产服务器使用，尤其不要暴露默认数据库和管理入口。

## 官方入口

- [XAMPP FAQs for Mac OS X](https://www.apachefriends.org/faq_osx.html)
