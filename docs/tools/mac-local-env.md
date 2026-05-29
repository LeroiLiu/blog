---
title: Mac 本地开发环境
description: macOS 下 MAMP、XAMPP、Homebrew、Docker、本地域名、端口冲突、PHP 版本和 MySQL 连接常见问题。
---

# Mac 本地开发环境

Mac 本地开发环境最容易乱在三件事：端口、PHP 版本、数据库连接。建议先选一种主方案，不要同时让 MAMP、XAMPP、Homebrew、Docker 抢同一组端口。

## 方案选择

| 方案 | 适合场景 | 注意点 |
| --- | --- | --- |
| MAMP | 快速跑 PHP、MySQL、本地站点 | 默认端口不是 `80/3306` |
| XAMPP | 学习 PHP、Apache、MariaDB、phpMyAdmin | 不建议用于生产环境 |
| Homebrew | 更接近真实开发环境 | 需要自己维护配置 |
| Docker | 多项目、多版本、团队统一环境 | 初学配置成本略高 |
| Valet / Herd | Laravel、PHP 本地站点 | 更偏 PHP 生态 |

如果只是维护普通 PHP 项目，MAMP 或 XAMPP 更省事。如果同时维护多个 PHP 版本、MySQL 版本、Redis、队列，Docker 更稳。

## 常见端口

| 端口 | 常见服务 |
| --- | --- |
| `80` | HTTP |
| `443` | HTTPS |
| `3306` | MySQL 或 MariaDB |
| `5432` | PostgreSQL |
| `6379` | Redis |
| `8080` | 本地 Web 服务或代理 |
| `8888` | MAMP 默认 Apache |
| `8889` | MAMP 默认 MySQL |

查看端口占用：

```sh
lsof -nP -iTCP:80 -sTCP:LISTEN
lsof -nP -iTCP:3306 -sTCP:LISTEN
lsof -nP -iTCP:8888 -sTCP:LISTEN
```

停止 macOS 自带 Apache：

```sh
sudo apachectl stop
```

## 本地域名 hosts

编辑 hosts：

```sh
sudo vim /etc/hosts
```

示例：

```txt
127.0.0.1 local.example.test
```

浏览器访问：

```txt
http://local.example.test:8888
```

如果端口不是 `80`，URL 里必须写端口。

## PHP 版本混乱

常见现象：

- 浏览器里运行的是 MAMP PHP。
- 终端里 `php -v` 显示的是系统 PHP 或 Homebrew PHP。
- Composer 使用了另一个 PHP 版本。

检查：

```sh
which php
php -v
which composer
composer -vvv about
```

如果希望 Composer 使用指定 PHP：

```sh
/Applications/MAMP/bin/php/php8.2.0/bin/php /usr/local/bin/composer install
```

具体 PHP 目录以本机安装版本为准。

## MySQL 连接不上

常见原因：

- 端口不是 `3306`。
- 使用了 socket，但客户端连的是 TCP。
- root 密码和工具里保存的不一致。
- MAMP、XAMPP、Homebrew 同时启动了数据库。

测试 TCP 连接：

```sh
mysql -h 127.0.0.1 -P 8889 -u root -p
```

如果工具里填写 `localhost` 不通，可以改成 `127.0.0.1`，强制走 TCP。

## 本地 HTTPS

本地开发一般可以先使用 HTTP。确实需要 HTTPS 时，可以使用：

- mkcert 生成本地可信证书。
- MAMP Pro 或其他工具生成站点证书。
- Nginx、Apache 手工配置本地证书。

不要把生产证书私钥拷到本机随意使用。

## 常见报错

| 报错 | 常见原因 | 处理方向 |
| --- | --- | --- |
| `Address already in use` | 端口被占用 | `lsof -nP -iTCP:<端口>` |
| 访问 `localhost` 空白 | 服务未启动或访问端口错误 | 看面板状态和端口 |
| Composer 报扩展缺失 | 终端 PHP 与 Web PHP 不一致 | `which php`、`php -m` |
| MySQL 拒绝连接 | 端口、账号、密码、socket 不一致 | 使用 `127.0.0.1` 和明确端口测试 |
| 页面 403 | <code>Apache/Nginx</code> 目录权限或入口错误 | 检查 DocumentRoot 和权限 |
| 静态资源 404 | 项目 base path 或站点目录错误 | 检查访问路径和资源路径 |
