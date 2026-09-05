---
title: Mosquitto
description: Eclipse Mosquitto MQTT Broker 安装、Docker、配置文件、密码认证、发布订阅测试和常见问题。
---

Mosquitto 是轻量级 MQTT Broker，适合学习、边缘设备、小型项目、单机场景和快速测试。它比 EMQX 更轻，但 Dashboard、规则引擎和集群能力需要额外方案。

## Ubuntu 安装

```sh
sudo apt update
sudo apt install -y mosquitto mosquitto-clients
sudo systemctl enable mosquitto
sudo systemctl start mosquitto
```

测试服务：

```sh
systemctl status mosquitto
ss -lntp | grep 1883
```

## Docker 快速测试

```sh
docker run -d --name mosquitto \
-p 1883:1883 \
eclipse-mosquitto:latest
```

生产环境建议挂载配置和数据目录：

```sh
docker run -d --name mosquitto \
-p 1883:1883 \
-v $(pwd)/mosquitto.conf:/mosquitto/config/mosquitto.conf \
-v $(pwd)/data:/mosquitto/data \
-v $(pwd)/log:/mosquitto/log \
eclipse-mosquitto:latest
```

## 基础配置

`mosquitto.conf` 示例：

```ini
listener 1883
allow_anonymous false
password_file /mosquitto/config/passwd
persistence true
persistence_location /mosquitto/data/
log_dest file /mosquitto/log/mosquitto.log
```

Mosquitto 2.x 默认安全策略更严格。需要远程连接时，要显式配置 `listener` 和认证策略。

## 创建密码

安装了客户端工具后：

```sh
mosquitto_passwd -c passwd user
```

追加用户：

```sh
mosquitto_passwd passwd another_user
```

Docker 场景要确保 `password_file` 路径和容器内路径一致。

## 发布订阅测试

订阅：

```sh
mosquitto_sub -h 127.0.0.1 -p 1883 -u user -P password -t 'test/#' -v
```

发布：

```sh
mosquitto_pub -h 127.0.0.1 -p 1883 -u user -P password -t 'test/hello' -m 'hello mosquitto'
```

测试 retained：

```sh
mosquitto_pub -h 127.0.0.1 -p 1883 -u user -P password -r -t 'device/001/status' -m 'online'
```

清理 retained：

```sh
mosquitto_pub -h 127.0.0.1 -p 1883 -u user -P password -r -n -t 'device/001/status'
```

## 常见问题

| 问题 | 常见原因 | 处理方向 |
| --- | --- | --- |
| 只能本机连接 | 未配置 listener 或防火墙未开放 | 配置 `listener 1883`，检查安全组 |
| `Connection Refused: not authorised` | 用户名密码错误或配置未加载 | 检查 `password_file` 和日志 |
| Docker 配置不生效 | 挂载路径错误 | `docker inspect` 检查挂载 |
| 日志找不到 | 未配置 `log_dest` 或容器未挂载日志目录 | 配置日志路径 |
| retained 消息一直存在 | 没有清理 retained | 发布空 retained 消息 |
| 客户端频繁掉线 | keepalive、网络、电源或 Client ID 冲突 | 看 Broker 日志和设备日志 |

## 官方入口

- [Eclipse Mosquitto](https://mosquitto.org/)
- [Mosquitto Documentation](https://mosquitto.org/documentation/)
- [Eclipse Mosquitto Docker Image](https://hub.docker.com/_/eclipse-mosquitto)
