---
title: Apache 配置
description: Apache 虚拟主机、静态站、PHP-FPM、反向代理、.htaccess、mod_rewrite 和常见报错。
---

Apache 常见于传统 PHP 项目、本地开发环境、虚拟主机和需要 `.htaccess` 的应用。配置重点是 `VirtualHost`、`DocumentRoot`、`Directory` 权限、重写规则和模块启用。

## 常用命令

Debian、Ubuntu 常见命令：

```sh
apachectl configtest
systemctl reload apache2
systemctl status apache2
```

CentOS、Rocky Linux、AlmaLinux 常见命令：

```sh
apachectl configtest
systemctl reload httpd
systemctl status httpd
```

启用常用模块：

```sh
a2enmod rewrite headers ssl proxy proxy_http proxy_fcgi setenvif
systemctl reload apache2
```

`a2enmod` 是 Debian 系常用命令，其他发行版通常需要在 Apache 配置中启用对应模块。

## 虚拟主机

```apache
<VirtualHost *:80>
ServerName example.com
ServerAlias www.example.com

DocumentRoot /var/www/example/public

<Directory /var/www/example/public>
Options FollowSymLinks
AllowOverride All
Require all granted
</Directory>

ErrorLog ${APACHE_LOG_DIR}/example-error.log
CustomLog ${APACHE_LOG_DIR}/example-access.log combined
</VirtualHost>
```

关键点：

- `DocumentRoot` 要指向公开入口目录，不要直接指向项目根目录。
- ThinkPHP、Laravel 通常指向 `public`。
- `.htaccess` 需要 `AllowOverride All` 或至少允许 `FileInfo`。
- 目录没有授权时会出现 `403 Forbidden`。

## 静态站点和文档站

适合 VitePress 构建后的静态文件。

```apache
<VirtualHost *:80>
ServerName docs.example.com
DocumentRoot /var/www/docs

<Directory /var/www/docs>
Options FollowSymLinks
AllowOverride All
Require all granted
</Directory>
</VirtualHost>
```

如果使用无 `.html` 后缀的链接，可以在 `.htaccess` 中补充：

```apache
RewriteEngine On

RewriteCond %{DOCUMENT_ROOT}%{REQUEST_URI}.html -f
RewriteRule ^(.+)$ $1.html [L]

RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

如果是完全静态文档站，最后一条回退到 `/index.html` 可以按需删除，避免不存在的文档页面被误认为首页。

## PHP-FPM 配置

```apache
<VirtualHost *:80>
ServerName php.example.com
DocumentRoot /var/www/app/public

<Directory /var/www/app/public>
Options FollowSymLinks
AllowOverride All
Require all granted
</Directory>

<FilesMatch "\.php$">
SetHandler "proxy:unix:/run/php/php8.2-fpm.sock|fcgi://localhost/"
</FilesMatch>
</VirtualHost>
```

TCP 端口写法：

```apache
<FilesMatch "\.php$">
    SetHandler "proxy:fcgi://127.0.0.1:9000"
</FilesMatch>
```

检查 PHP-FPM：

```sh
systemctl status php8.2-fpm
ss -lx | grep php
ss -lntp | grep 9000
```

## 反向代理

适合 Apache 对接本机 Go、Node、Java 服务。

```apache
<VirtualHost *:80>
    ServerName app.example.com

    ProxyPreserveHost On
    ProxyPass / http://127.0.0.1:8080/
    ProxyPassReverse / http://127.0.0.1:8080/

    RequestHeader set X-Forwarded-Proto "http"
</VirtualHost>
```

HTTPS 场景下，应用如果需要判断真实协议，要同步配置 `X-Forwarded-Proto`。

## <code>.htaccess</code> 不生效

常见原因：

- 没有启用 `mod_rewrite`。
- `Directory` 中 `AllowOverride None`。
- `.htaccess` 放错目录。
- 重写规则和项目入口目录不匹配。

排查：

```sh
apachectl -M | grep rewrite
apachectl configtest
```

ThinkPHP、Laravel 常用规则：

```apache
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteRule ^(.*)$ index.php/$1 [QSA,PT,L]
</IfModule>
```

不同框架版本规则会有差异，以框架文档和项目实际入口为准。

## 常见报错

| 报错 | 常见原因 | 处理方向 |
| --- | --- | --- |
| `AH00558: Could not reliably determine the server's fully qualified domain name` | 未设置全局 `ServerName` | 在主配置中设置 `ServerName localhost` |
| `403 Forbidden` | 目录权限或 `Require all granted` 缺失 | 检查 `Directory` 块和文件权限 |
| `404 Not Found` | `DocumentRoot` 或重写规则错误 | 检查入口目录和 `.htaccess` |
| `500 Internal Server Error` | `.htaccess` 语法错误或 PHP 报错 | 看 Apache error log 和应用日志 |
| `.htaccess` 不生效 | `AllowOverride` 或 `mod_rewrite` 问题 | 启用模块并允许覆盖 |
| PHP 文件被下载 | PHP handler 未配置 | 检查 PHP-FPM、`FilesMatch` 和模块 |
| Apache 启动失败 | 端口冲突或配置语法错误 | `apachectl configtest`、`ss -lntp` |

## 官方入口

- [Apache Virtual Host documentation](https://httpd.apache.org/docs/current/vhosts/)
- [Apache mod_rewrite and .htaccess](https://httpd.apache.org/docs/2.4/en/rewrite/htaccess.html)
- [Apache mod_proxy](https://httpd.apache.org/docs/current/mod/mod_proxy.html)
