---
title: MQTT 基础
description: MQTT Broker、Client、Topic、QoS、Retain、Will、Clean Session、认证、端口和常见问题。
---

MQTT 是轻量级发布订阅协议，常用于物联网、设备状态上报、消息推送和低带宽网络通信。它的核心不是“客户端直接互发”，而是客户端通过 Broker 发布和订阅消息。

## 核心角色

| 角色 | 说明 |
| --- | --- |
| Broker | 消息服务器，负责接收、路由和分发消息 |
| Client | 设备、服务端、App、网关都可以是客户端 |
| Publisher | 发布消息的一方 |
| Subscriber | 订阅消息的一方 |
| Topic | 消息主题，例如 `device/001/status` |

## Topic 设计

示例：

```txt
device/{deviceId}/telemetry
device/{deviceId}/status
device/{deviceId}/command
device/{deviceId}/event
```

建议：

- 层级清楚。
- 不要把敏感信息放进 topic。
- 设备 ID 使用稳定唯一标识。
- 上行、下行、事件、状态分开。
- 通配符订阅只给服务端或受控系统使用。

通配符：

| 通配符 | 说明 |
| --- | --- |
| `+` | 单层匹配 |
| `#` | 多层匹配，通常只能放最后 |

## QoS

| QoS | 含义 | 适合场景 |
| --- | --- | --- |
| `0` | 至多一次，可能丢消息 | 高频状态、可丢数据 |
| `1` | 至少一次，可能重复 | 普通设备事件 |
| `2` | 恰好一次，开销更高 | 强一致要求较高的消息 |

QoS 不是越高越好。多数设备状态上报用 `0` 或 `1` 已经足够，业务端要能处理重复消息。

## Retained Message

Retain 消息会让 Broker 保留某个 topic 的最后一条消息，新订阅者连接后可以立即收到。

适合：

- 设备最后状态。
- 配置版本。
- 在线状态快照。

不适合：

- 高频遥测数据。
- 一次性控制命令。
- 包含敏感数据的消息。

## Last Will

Last Will 用于客户端异常断开时，由 Broker 自动发布遗嘱消息。

常见设计：

```txt
device/001/status = offline
```

设备正常上线时发布：

```txt
device/001/status = online
```

这样服务端可以更容易判断设备是否异常掉线。

## 常见端口

| 端口 | 用途 |
| --- | --- |
| `1883` | MQTT 明文 |
| `8883` | MQTT over TLS |
| `8083` | MQTT over WebSocket 常见端口 |
| `8084` | MQTT over WebSocket TLS 常见端口 |
| `18083` | EMQX Dashboard 常见端口 |

具体端口以 Broker 配置为准。

## 测试命令

安装 Mosquitto 客户端后可以测试。

订阅：

```sh
mosquitto_sub -h 127.0.0.1 -p 1883 -t 'test/#' -v
```

发布：

```sh
mosquitto_pub -h 127.0.0.1 -p 1883 -t 'test/hello' -m 'hello mqtt'
```

带账号：

```sh
mosquitto_pub -h 127.0.0.1 -p 1883 -u user -P password -t 'test/hello' -m 'hello'
```

## 常见问题

| 问题 | 常见原因 | 处理方向 |
| --- | --- | --- |
| 客户端连不上 | Broker 未启动、端口不通、认证失败 | 检查端口、日志、账号密码 |
| 能发布但订阅收不到 | topic 不一致、权限 ACL、通配符写错 | 打印完整 topic，检查 ACL |
| 消息重复 | QoS 1 重发、客户端重连 | 业务端使用 message id 去重 |
| 消息积压 | 消费端太慢、离线会话、QoS、数据库写入慢 | [MQTT 消息积压处理](/iot/mqtt-message-backlog-emqx-php) |
| 离线后收不到消息 | 没有持久会话或消息没有保留 | 检查 Clean Session、Session Expiry |
| Retain 旧数据误触发 | retained 消息未清理 | 向同 topic 发布空 retained 消息清理 |
| 设备频繁掉线 | 心跳、网络、电源、keepalive 设置不合理 | 看 Broker 日志和设备日志 |

## 官方入口

- [MQTT Version 5.0 OASIS Standard](https://docs.oasis-open.org/mqtt/mqtt/v5.0/mqtt-v5.0.html)
- [MQTT Version 3.1.1 OASIS Standard](https://docs.oasis-open.org/mqtt/mqtt/v3.1.1/mqtt-v3.1.1.html)
