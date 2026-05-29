---
title: WebSocket
description: WebSocket 基础、连接流程、心跳、鉴权、Nginx 代理、常见问题和排查方法。
---

# WebSocket

WebSocket 适合浏览器和服务端之间保持长连接，实现实时消息、聊天、设备状态、控制台日志、进度推送和协同编辑等能力。

## 和 HTTP 的关系

WebSocket 连接一开始通过 HTTP 发起握手，请求头里带 `Upgrade: websocket`。握手成功后，连接升级为 WebSocket 双向通信。

特点：

- 服务端可以主动推消息。
- 连接是长连接。
- 需要心跳和断线重连。
- 需要考虑鉴权、限流和连接数。

## 浏览器示例

```js
const ws = new WebSocket('wss://example.com/ws')

ws.addEventListener('open', () => {
  ws.send(JSON.stringify({ type: 'ping' }))
})

ws.addEventListener('message', (event) => {
  console.log(event.data)
})

ws.addEventListener('close', () => {
  console.log('closed')
})

ws.addEventListener('error', (error) => {
  console.error(error)
})
```

生产环境要加重连策略，但不要无限快速重连，否则服务异常时会把压力放大。

## 消息格式

建议统一消息结构：

```json
{
  "type": "device.status",
  "requestId": "req-001",
  "data": {
    "deviceId": "001",
    "online": true
  }
}
```

建议包含：

- `type`：消息类型。
- `requestId`：请求追踪。
- `data`：业务数据。
- `timestamp`：必要时记录时间。

## 心跳和断线

常见做法：

- 客户端定时发 ping。
- 服务端定时检测连接最后活跃时间。
- 超时后主动关闭。
- 客户端指数退避重连。
- 页面切后台时降低发送频率。

心跳间隔要结合业务和网络环境，太短浪费资源，太长不容易发现断线。

## 鉴权

常见方式：

- 握手 URL 携带短期 token。
- 使用 Cookie 会话。
- 第一个消息发送鉴权信息。
- 网关层校验后转发。

注意：

- 不要把长期密钥直接写在前端。
- token 过期后要能重新连接。
- 服务端要校验每个连接的权限范围。
- 多租户或多用户场景不能只靠前端隐藏 topic 或频道。

## Nginx 代理

```nginx
location /ws/ {
  proxy_pass http://127.0.0.1:8080;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_read_timeout 3600s;
}
```

如果浏览器是 HTTPS 页面，WebSocket 也要用 `wss://`，否则可能被浏览器拦截为混合内容。

## 常见问题

| 问题 | 常见原因 | 处理方向 |
| --- | --- | --- |
| 连接直接失败 | URL、协议、端口、防火墙错误 | 浏览器控制台和服务端日志一起看 |
| HTTPS 页面连不上 `ws://` | 混合内容限制 | 使用 `wss://` |
| 经过 Nginx 后失败 | Upgrade 头未转发 | 检查 Nginx 代理配置 |
| 一段时间自动断开 | 心跳、代理超时、服务端超时 | 调整心跳和 `proxy_read_timeout` |
| 消息重复 | 重连后重复订阅或业务未去重 | 客户端状态和服务端订阅都要清理 |
| 连接数高 | 未关闭无效连接或没有限流 | 加心跳、限流、连接上限 |

## 官方入口

- [MDN WebSocket API](https://developer.mozilla.org/en-US/docs/Web/API/WebSocket)
- [NGINX WebSocket proxying](https://nginx.org/en/docs/http/websocket.html)
