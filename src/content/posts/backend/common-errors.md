---
title: 后端常见报错
description: 后端开发和部署中 500、502、504、跨域、上传、权限、依赖、数据库连接等常见报错排查。
---

后端问题不要只看浏览器提示。浏览器通常只能看到 `500`、`502`、`504` 这类结果，真正原因一般在应用日志、Web 服务日志、PHP-FPM 日志、systemd 日志或容器日志里。

## 快速排查顺序

1. 看请求是否打到服务器。
2. 看 Nginx 或 Apache access log。
3. 看 Nginx 或 Apache error log。
4. 看 PHP-FPM、Go 服务或容器日志。
5. 看 `.env`、数据库、缓存、对象存储等外部依赖。
6. 看最近一次代码、配置、证书、域名解析或防火墙变更。

常用日志命令：

```sh
tail -n 200 /var/log/nginx/error.log
tail -n 200 /var/log/nginx/access.log
journalctl -u nginx -n 100 --no-pager
journalctl -u php8.2-fpm -n 100 --no-pager
journalctl -u your-go-service -n 100 --no-pager
```

## 500 Internal Server Error

现象：

页面或接口返回 `500`，但浏览器没有明确错误。

常见原因：

- 应用代码异常。
- PHP、Go、框架版本和本地不一致。
- `.env` 缺少配置。
- Composer 或 Go Module 依赖没有安装完整。
- 缓存目录、日志目录、上传目录不可写。
- 数据库、Redis、对象存储连接失败。
- 生产环境关闭错误显示，只能从日志看真实异常。

处理：

```sh
tail -n 200 runtime/log/*.log
tail -n 200 storage/logs/*.log
tail -n 200 /var/log/php-fpm/error.log
```

如果是 PHP 项目，先确认运行环境：

```sh
php -v
php -m
php --ini
composer install --no-dev --optimize-autoloader
```

如果是 Go 项目，先确认服务是否正常：

```sh
systemctl status your-go-service
journalctl -u your-go-service -n 200 --no-pager
```

## 502 Bad Gateway

现象：

Nginx 或 Apache 能响应，但后端服务没有正确响应。

常见原因：

- PHP-FPM 没启动。
- Go、Node、Java 等上游服务没启动。
- `fastcgi_pass` 或 `proxy_pass` 端口写错。
- Unix socket 路径不对。
- 上游服务崩溃、重启或监听地址不对。
- 防火墙限制了本机或内网端口。

处理：

```sh
systemctl status php8.2-fpm
systemctl status nginx
ss -lntp
ss -lx
```

Nginx 代理 Go 服务时，确认服务监听地址：

```sh
curl -I http://127.0.0.1:8080
```

如果本机 `curl` 都不通，先修后端服务；如果本机通但外部不通，再看 Nginx 配置、防火墙和域名。

## 504 Gateway Timeout

现象：

请求等待很久后返回 `504`。

常见原因：

- 接口执行时间太长。
- 数据库慢查询。
- 第三方接口无响应。
- 文件上传、导入、导出没有异步化。
- Nginx、Apache、PHP-FPM、应用本身超时时间不一致。

处理：

Nginx 反向代理可以临时调整：

```nginx
proxy_connect_timeout 60s;
proxy_send_timeout 60s;
proxy_read_timeout 60s;
```

PHP-FPM 场景可以检查：

```ini
max_execution_time = 60
request_terminate_timeout = 60
```

长期方案应该从慢查询、异步任务、队列、分页、批量处理等方向优化，不建议只把超时时间无限调大。

## 跨域 CORS 报错

现象：

浏览器控制台提示 `CORS policy`、`Access-Control-Allow-Origin`。

常见原因：

- 后端没有返回跨域响应头。
- 预检请求 `OPTIONS` 没有处理。
- 带 Cookie 请求时使用了 `Access-Control-Allow-Origin: *`。
- 前端请求地址和后端允许域名不一致。
- Nginx 只给正常请求加了 header，没有给错误响应或预检请求加。

处理思路：

- 明确允许的前端域名，不要随便放开全部来源。
- 带 Cookie 时需要同时配置 `Access-Control-Allow-Credentials: true`。
- 预检请求应该能返回 `204` 或正常空响应。
- Nginx 里建议使用 `always`，避免错误响应没有跨域头。

示例：

```php
add_header Access-Control-Allow-Origin "https://example.com" always;
add_header Access-Control-Allow-Methods "GET,POST,PUT,PATCH,DELETE,OPTIONS" always;
add_header Access-Control-Allow-Headers "Authorization,Content-Type,X-Requested-With" always;
add_header Access-Control-Allow-Credentials "true" always;

if ($request_method = OPTIONS) {
  return 204;
}
```

## 数据库连接失败

常见报错：

- `SQLSTATE[HY000] [1045] Access denied`
- `SQLSTATE[HY000] [2002] Connection refused`
- `dial tcp 127.0.0.1:3306: connect: connection refused`
- `too many connections`

排查：

```sh
ss -lntp | grep 3306
mysql -h 127.0.0.1 -P 3306 -u root -p
```

重点检查：

- 数据库服务是否启动。
- 主机、端口、账号、密码是否正确。
- 本地连接使用的是 TCP 还是 socket。
- 数据库用户是否允许从当前主机连接。
- 云服务器安全组和系统防火墙是否开放端口。
- 连接池是否过大导致连接耗尽。

## 上传失败或文件过大

常见报错：

- `413 Request Entity Too Large`
- PHP `UPLOAD_ERR_INI_SIZE`
- 后端一直收不到文件。

需要同时检查三层：

Nginx：

```nginx
client_max_body_size 50m;
```

PHP：

```ini
upload_max_filesize = 50M
post_max_size = 50M
max_file_uploads = 20
```

应用：

- 表单是否为 `multipart/form-data`。
- 字段名是否一致。
- 临时目录是否可写。
- 业务代码是否限制了大小、后缀、MIME 类型。

## 权限不足

常见报错：

- `Permission denied`
- `failed to open stream`
- `mkdir(): Permission denied`
- 日志写不进去、缓存生成失败、上传失败。

处理：

```sh
ps aux | grep php-fpm
ps aux | grep nginx
chown -R www-data:www-data runtime public/uploads
chmod -R 775 runtime public/uploads
```

不要把整个项目目录直接改成 `777`。只给缓存、日志、上传这类需要写入的目录授权。

## 依赖安装失败

Composer 常见处理：

```sh
composer diagnose
composer install --no-dev --optimize-autoloader
composer dump-autoload
```

Go Module 常见处理：

```sh
go env GOPROXY
go env -w GOPROXY=https://goproxy.cn,direct
go mod tidy
```

如果服务器和本地版本不同，先对齐运行时版本。依赖问题很多时候不是代码坏了，而是运行环境不一致。

## 端口被占用

常见报错：

- `address already in use`
- `bind: permission denied`
- Nginx 或 Apache 启动失败。

排查：

```sh
ss -lntp
lsof -nP -iTCP:80 -sTCP:LISTEN
lsof -nP -iTCP:443 -sTCP:LISTEN
```

处理：

- 停掉占用端口的旧服务。
- 修改新服务监听端口。
- 检查 systemd 是否启动了重复服务。
- 同一台服务器不要同时让 Nginx 和 Apache 抢 `80/443`，除非明确设计了前后级代理。
