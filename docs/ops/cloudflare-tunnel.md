---
title: Cloudflare Tunnel 配置与常见问题
description: Cloudflare Tunnel、cloudflared、本地服务公网访问、DNS 路由、Docker 部署、常见错误和安全建议。
---

# Cloudflare Tunnel 配置与常见问题

Cloudflare Tunnel 可以让内网服务通过 `cloudflared` 主动连接到 Cloudflare，再由 Cloudflare 把公网域名流量转发到本地服务。它不需要在路由器上做端口映射，适合内网 Web 服务、测试环境、面板服务和临时项目预览。

::: info 官方入口
- [Cloudflare Tunnel 文档](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/)
- [cloudflared 下载与安装](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/)
:::

## 基本流程

1. 域名托管到 Cloudflare。
2. 安装 `cloudflared`。
3. 登录 Cloudflare。
4. 创建 Tunnel。
5. 将域名路由到 Tunnel。
6. 配置本地服务映射。
7. 以服务方式长期运行。

## CLI 创建 Tunnel

登录：

```sh
cloudflared tunnel login
```

创建：

```sh
cloudflared tunnel create leroi-app
```

绑定 DNS：

```sh
cloudflared tunnel route dns leroi-app app.example.com
```

配置文件示例：

```yaml
tunnel: leroi-app
credentials-file: /root/.cloudflared/xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.json

ingress:
  - hostname: app.example.com
    service: http://localhost:8080
  - service: http_status:404
```

运行：

```sh
cloudflared tunnel run leroi-app
```

安装为系统服务：

```sh
cloudflared service install
systemctl enable cloudflared
systemctl start cloudflared
```

## Docker Token 方式

如果在 Cloudflare Zero Trust 面板里创建了 Tunnel，可以用 token 启动：

```sh
docker run -d \
  --name cloudflared \
  --restart unless-stopped \
  cloudflare/cloudflared:latest \
  tunnel --no-autoupdate run --token YOUR_TUNNEL_TOKEN
```

这种方式简单，但 token 要保管好，不要提交到 Git。

## 多个服务映射

```yaml
ingress:
  - hostname: api.example.com
    service: http://localhost:8000
  - hostname: files.example.com
    service: http://localhost:5244
  - hostname: ssh.example.com
    service: ssh://localhost:22
  - service: http_status:404
```

最后一条兜底规则必须存在，否则未匹配请求可能不知道转发到哪里。

## 常见问题

### 访问出现 1016

常见原因：

- DNS 记录指向的 Tunnel 不存在。
- Tunnel 没有运行。
- 域名绑定到了错误的 Tunnel。
- CLI 创建了 DNS，但本机服务没有启动。

检查：

```sh
cloudflared tunnel list
cloudflared tunnel info leroi-app
systemctl status cloudflared
```

### 本地服务能访问，公网访问 502

检查 `service` 地址是否从 `cloudflared` 所在机器可访问：

```sh
curl -I http://localhost:8080
```

如果 `cloudflared` 在 Docker 里，`localhost` 指的是容器内部。可以改成宿主机地址，或把应用和 `cloudflared` 放在同一个 Docker 网络。

### WebSocket 不稳定

优先确认本地服务和反向代理支持 WebSocket：

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

如果中间还有 Nginx，要同时检查 Nginx 超时时间。

### 文件上传失败

排查方向：

- 应用本身上传限制。
- Nginx `client_max_body_size`。
- 后端超时时间。
- Cloudflare 计划和产品限制。

大文件传输不建议完全依赖 Web 页面上传，可以考虑对象存储、分片上传或 WebDAV。

## 安全建议

- 管理后台不要直接裸露，可以加 Cloudflare Access。
- 内网服务只监听 `127.0.0.1` 或内网地址。
- Tunnel token 和 credentials 文件不要提交到仓库。
- 生产服务要监控 `cloudflared` 进程和日志。
