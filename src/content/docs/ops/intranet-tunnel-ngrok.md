---
title: 内网穿透与 ngrok 常见问题
description: 内网穿透、ngrok、HTTP/TCP 隧道、Webhook 调试、远程访问、本地开发预览和常见问题整理。
---

内网穿透的核心是让公网用户访问内网服务。常见场景包括微信支付回调、公众号消息回调、本地接口联调、远程演示、临时文件服务和远程调试。

:::note[官方入口]
- [ngrok 文档](https://ngrok.com/docs/)
- [ngrok HTTP Endpoints](https://ngrok.com/docs/http/)
- [ngrok Agent 配置](https://ngrok.com/docs/agent/)
:::

## 常见方案对比

| 方案 | 适合场景 | 特点 |
| --- | --- | --- |
| ngrok | 本地开发、Webhook、临时预览 | 上手快，公网地址由平台分配 |
| Cloudflare Tunnel | 自有域名、长期服务、Web 管理后台 | 不需要开入站端口，适合域名托管在 Cloudflare 的项目 |
| FRP | 自建穿透、内网设备多 | 需要自己有公网服务器 |
| SSH 反向隧道 | 临时转发、轻量排查 | 依赖 SSH 连接稳定性 |
| 路由器端口映射 | 固定公网 IP、家庭或公司网络 | 需要公网 IP 和路由器权限 |

## ngrok HTTP 示例

本地服务运行在 `8080`：

```sh
ngrok http 8080
```

指定本地地址：

```sh
ngrok http http://localhost:8080
```

用于微信、GitHub、支付回调调试时，把 ngrok 提供的 HTTPS 地址填到平台回调地址里。

## ngrok TCP 示例

```sh
ngrok tcp 22
```

适合临时暴露 SSH、数据库或其他 TCP 服务。暴露 SSH 时一定要使用密钥登录，禁止弱密码。

## SSH 反向隧道

如果有一台公网服务器，可以用 SSH 建立反向隧道：

```sh
ssh -N -R 9000:localhost:8080 root@server.example.com
```

含义：

- 公网服务器监听 `9000`。
- 访问公网服务器 `9000` 会转发到本机 `8080`。

如果想让公网用户访问，还要确保服务器 `sshd_config` 允许：

```txt
GatewayPorts yes
```

修改后重启 SSH：

```sh
systemctl restart sshd
```

## 用 autossh 保持连接

```sh
autossh -M 0 -N \
  -o ServerAliveInterval=30 \
  -o ServerAliveCountMax=3 \
  -R 9000:localhost:8080 \
  root@server.example.com
```

## 常见问题

### ngrok 地址每次变

免费临时地址通常会变化。如果需要固定域名，要使用平台提供的固定域名能力，或改用自有域名加 Cloudflare Tunnel。

### 回调平台提示 URL 不合法

检查：

- 是否必须使用 HTTPS。
- 回调地址是否能公网访问。
- 路径是否完整，例如 `/api/wechat/notify`。
- 平台是否要求备案域名或白名单域名。

### 本地能访问，公网访问失败

检查本地服务监听地址：

```sh
ss -lntp | grep 8080
```

如果应用只监听在容器内，隧道客户端可能访问不到。Docker 场景要确认端口映射：

```sh
docker ps
```

### 穿透后拿不到真实 IP

隧道服务通常会在请求头里传递来源信息。后端需要读取：

```txt
X-Forwarded-For
X-Real-IP
Forwarded
```

但这些请求头不能无条件信任，生产环境要结合可信代理列表。

### WebSocket 连不上

确认穿透服务支持 WebSocket，并检查本地代理配置。Nginx 反代 WebSocket 时需要：

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

## 安全建议

- 不要长期暴露数据库、Redis、管理后台。
- 暴露 SSH 时禁用密码登录，只允许密钥。
- 临时调试结束后关闭隧道。
- 回调调试环境和生产环境分开。
- 不要把 ngrok token、隧道 token 写进公开仓库。
