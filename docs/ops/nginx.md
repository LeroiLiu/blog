---
title: Nginx 配置
description: Nginx 静态站、PHP-FPM、反向代理、HTTPS、上传限制、常见报错和排查命令。
---

# Nginx 配置

Nginx 常见用途是静态站点、反向代理、PHP-FPM 网关、HTTPS 入口和上传限制控制。修改配置后先检查语法，再重载服务。

```sh
nginx -t
systemctl reload nginx
```

## 配置文件位置

常见位置：

- `/etc/nginx/nginx.conf`
- `/etc/nginx/conf.d/*.conf`
- `/etc/nginx/sites-available/*`
- `/etc/nginx/sites-enabled/*`
- `/usr/local/nginx/conf/nginx.conf`
- `/usr/local/nginx/conf/vhost/*.conf`

不同安装方式目录不一样。找不到时可以用：

```sh
nginx -T | sed -n '1,120p'
```

## 静态站点配置

适合 VitePress、Vue 构建后的静态文件、普通 HTML 页面。

```nginx
server {
  listen 80;
  server_name docs.example.com;

  root /www/wwwroot/docs;
  index index.html;

  location / {
    try_files $uri $uri.html $uri/ =404;
  }

  access_log /var/log/nginx/docs-access.log;
  error_log /var/log/nginx/docs-error.log;
}
```

如果是单页应用，需要把不存在的路由回退到 `index.html`：

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

文档站和单页应用的回退规则不同。VitePress 更适合先尝试 `$uri.html`，后台管理系统这类 SPA 更适合回退到 `/index.html`。

## PHP-FPM 配置

适合 ThinkPHP、Laravel、WordPress 等 PHP 项目。

```nginx
server {
  listen 80;
  server_name api.example.com;

  root /www/wwwroot/app/public;
  index index.php index.html;

  location / {
    try_files $uri $uri/ /index.php?$query_string;
  }

  location ~ \.php$ {
    include fastcgi_params;
    fastcgi_pass unix:/run/php/php8.2-fpm.sock;
    fastcgi_param SCRIPT_FILENAME $realpath_root$fastcgi_script_name;
    fastcgi_param DOCUMENT_ROOT $realpath_root;
  }
}
```

如果 PHP-FPM 监听 TCP 端口，写法通常是：

```nginx
fastcgi_pass 127.0.0.1:9000;
```

确认 socket 或端口：

```sh
ss -lntp | grep 9000
ss -lx | grep php
systemctl status php8.2-fpm
```

## 反向代理配置

适合代理 Go、Node、Java、Docker 内服务。

```nginx
server {
  listen 80;
  server_name app.example.com;

  location / {
    proxy_pass http://127.0.0.1:8080;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

如果后端有 WebSocket：

```nginx
location /ws/ {
  proxy_pass http://127.0.0.1:8080;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
}
```

## HTTPS 跳转

```nginx
server {
  listen 80;
  server_name example.com www.example.com;
  return 301 https://$host$request_uri;
}

server {
  listen 443 ssl http2;
  server_name example.com www.example.com;

  ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

  root /www/wwwroot/example.com;
  index index.html index.php;
}
```

如果使用 1Panel、宝塔、LNMP 脚本或 Certbot 自动申请证书，证书路径以工具生成结果为准。

## 上传大小限制

`413 Request Entity Too Large` 通常需要改：

```nginx
client_max_body_size 50m;
```

可以放在 `http`、`server` 或 `location` 中。PHP 项目还要同步检查 `upload_max_filesize` 和 `post_max_size`。

## 常见报错

| 报错 | 常见原因 | 处理方向 |
| --- | --- | --- |
| `nginx: [emerg] bind() to 0.0.0.0:80 failed` | 端口被占用 | `ss -lntp` 找到占用进程 |
| `403 Forbidden` | root 目录、权限、index 配置错误 | 检查 `root`、`index`、目录权限 |
| `404 Not Found` | 路径规则或 `try_files` 不对 | 确认文件真实路径和路由规则 |
| `413 Request Entity Too Large` | 上传大小超过 Nginx 限制 | 调整 `client_max_body_size` |
| `502 Bad Gateway` | 上游服务不可用 | 检查 PHP-FPM 或应用端口 |
| `504 Gateway Timeout` | 上游响应超时 | 看慢查询、接口耗时、超时配置 |
| HTTPS 无限跳转 | 代理层协议判断错误 | 检查 `X-Forwarded-Proto` 和应用配置 |

## 排查命令

```sh
nginx -t
nginx -T
systemctl status nginx
journalctl -u nginx -n 100 --no-pager
tail -n 200 /var/log/nginx/error.log
tail -n 200 /var/log/nginx/access.log
ss -lntp | grep ':80\|:443'
```

## 官方入口

- [NGINX Documentation](https://nginx.org/en/docs/)
- [NGINX Reverse Proxy](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
