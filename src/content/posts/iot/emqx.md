---
title: EMQX
description: EMQX MQTT Broker 安装、Docker 启动、常用端口、Dashboard、认证、桥接、日志和常见问题。
---

EMQX 是高性能 MQTT Broker，适合设备规模较大、需要 Dashboard、认证、ACL、规则引擎、数据桥接和集群能力的场景。早期资料里常见的 “EMQ” 一般指现在的 EMQX 生态。

## Docker 快速测试

开发测试可以先用 Docker 启动：

```sh
docker run -d --name emqx \
-p 1883:1883 \
-p 8083:8083 \
-p 8084:8084 \
-p 8883:8883 \
-p 18083:18083 \
emqx/emqx:latest
```

生产环境建议固定明确版本，不要长期使用 `latest`。

查看状态：

```sh
docker ps
docker logs -f emqx
```

访问 Dashboard：

```txt
http://服务器IP:18083
```

默认账号、初始密码和安全策略以当前安装版本提示为准，首次登录后应立即修改。

## 常见端口

| 端口 | 用途 |
| --- | --- |
| `1883` | MQTT TCP |
| `8883` | MQTT TLS |
| `8083` | MQTT over WebSocket |
| `8084` | MQTT over WebSocket TLS |
| `18083` | Dashboard |

端口是否对外开放，要根据安全需求决定。生产环境不建议把管理面板暴露给全网。

## 测试连接

订阅：

```sh
mosquitto_sub -h 127.0.0.1 -p 1883 -t 'test/#' -v
```

发布：

```sh
mosquitto_pub -h 127.0.0.1 -p 1883 -t 'test/hello' -m 'hello emqx'
```

如果本机测试正常，外部设备连不上，再检查安全组、防火墙、端口映射和认证。

## 认证和 ACL

生产环境不要匿名开放。常见认证方式：

- 内置数据库账号。
- MySQL、PostgreSQL、Redis。
- HTTP 认证接口。
- JWT。
- 客户端证书。

权限设计建议：

- 设备只能发布自己的上行 topic。
- 设备只能订阅自己的下行 topic。
- 管理服务可以订阅多设备 topic。
- 不给普通设备 `#` 通配符权限。

## 数据桥接

EMQX 常用于把 MQTT 消息桥接到：

- HTTP API。
- MySQL、PostgreSQL。
- Kafka。
- Redis。
- Webhook。
- 云服务。

桥接前先明确消息格式、失败重试、幂等处理和死信处理。不要把所有 topic 无差别写入数据库。

## 常见问题

| 问题 | 常见原因 | 处理方向 |
| --- | --- | --- |
| Dashboard 打不开 | `18083` 未映射、服务未启动、防火墙拦截 | `docker logs`、安全组、端口映射 |
| 客户端认证失败 | 用户名密码、认证链、ACL 不匹配 | 看 Dashboard 日志和认证配置 |
| 设备连接后立刻断开 | Client ID 冲突、心跳异常、认证失败 | 检查 Client ID 和 keepalive |
| WebSocket 连接失败 | 路径、端口、代理 Upgrade 头错误 | 检查 Nginx 和 EMQX listener |
| 消息收不到 | topic、ACL、QoS、共享订阅配置错误 | 用测试客户端最小化复现 |
| 内存升高 | 离线消息、保留消息、连接数、规则引擎压力 | 看 Dashboard 指标和系统监控 |
| 消息积压 | ThinkPHP 消费慢、Webhook 慢、离线队列、QoS 和持久会话配置不合理 | [MQTT 消息积压处理](/iot/mqtt-message-backlog-emqx-php) |

## 官方入口

- [EMQX Documentation](https://docs.emqx.com/)
- [EMQX Docker Installation](https://docs.emqx.com/en/emqx/latest/deploy/install-docker.html)
