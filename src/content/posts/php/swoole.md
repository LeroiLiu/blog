---
title: Swoole
description: Swoole 安装、PHP 扩展、HTTP 服务、WebSocket 服务、协程、进程管理和常见问题。
---

Swoole 是 PHP 的高性能网络通信扩展，常用于常驻内存服务、HTTP 服务、WebSocket、<code>TCP/UDP</code> 服务、协程并发和异步任务。它和传统 PHP-FPM 的请求生命周期不同，写法上要特别注意全局状态和资源释放。

## 安装

常见方式：

```sh
pecl install swoole
```

启用扩展：

```ini
extension=swoole.so
```

检查：

```sh
php --ri swoole
php -m | grep swoole
```

如果服务器有多个 PHP 版本，要确认 `pecl`、`php.ini` 和运行项目的 PHP 是同一个版本。

## HTTP 服务示例

```php
<?php

$server = new Swoole\Http\Server('0.0.0.0', 9501);

$server->on('request', function ($request, $response) {
  $response->header('Content-Type', 'text/plain');
  $response->end("hello swoole\n");
});

$server->start();
```

运行：

```sh
php server.php
```

访问：

```sh
curl http://127.0.0.1:9501
```

## WebSocket 服务示例

```php
<?php

$server = new Swoole\WebSocket\Server('0.0.0.0', 9502);

$server->on('open', function ($server, $request) {
  echo "open {$request->fd}\n";
});

$server->on('message', function ($server, $frame) {
  $server->push($frame->fd, 'server: ' . $frame->data);
});

$server->on('close', function ($server, $fd) {
  echo "close {$fd}\n";
});

$server->start();
```

生产环境通常由 systemd、Supervisor、Docker 或进程管理工具托管，不建议手动 SSH 启动后就不管。

## 和 PHP-FPM 的区别

| PHP-FPM | Swoole |
| --- | --- |
| 每个请求相对独立 | 常驻内存，状态会保留 |
| 改代码刷新请求即可 | 改代码需要重启服务 |
| 适合传统 Web | 适合长连接、高并发、异步任务 |
| 全局变量影响较小 | 全局状态容易污染后续请求 |

Swoole 项目里不要把请求级数据放到全局变量或静态变量里长期复用，除非你非常明确生命周期。

## 常见问题

| 问题 | 常见原因 | 处理方向 |
| --- | --- | --- |
| `Class Swoole\\... not found` | 扩展未安装或当前 PHP 未加载 | `php -m`、`php --ini` |
| `pecl install` 失败 | PHP dev 包、编译工具、版本不兼容 | 安装依赖并确认 PHP 版本 |
| 端口占用 | 服务未停止或重复启动 | `lsof -nP -iTCP:9501` |
| 改代码不生效 | Swoole 常驻内存 | 重启服务或做热重载 |
| 内存越来越高 | 全局状态、连接对象、定时器未释放 | 记录内存指标，检查生命周期 |
| WebSocket 经过 Nginx 失败 | Upgrade 头未转发 | 检查 Nginx WebSocket 配置 |
| 数据库连接异常 | 常驻进程里连接失效 | 使用连接池或重连机制 |

## 部署建议

- 用 systemd、Supervisor 或容器托管。
- 配置日志路径和日志轮转。
- Nginx 作为外层反向代理。
- 暴露健康检查接口。
- 发布时优雅重启。
- 监控进程、端口、内存、连接数和错误日志。

## 官方入口

- [Swoole Documentation](https://wiki.swoole.com/)
- [Swoole Install](https://wiki.swoole.com/en/#/environment)
