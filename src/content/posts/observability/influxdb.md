---
title: InfluxDB 快速入门与常见问题
description: InfluxDB 3 Core、InfluxDB 2.x、时序数据库、Docker、Line Protocol、Bucket、Token、Flux、SQL、Grafana 和常见问题。
---

InfluxDB 是时序数据库，适合存储随时间持续变化的数据，比如设备温度、电流、接口耗时、服务器 CPU、网络流量、传感器数据和业务指标。

> **官方入口**
>
> - [InfluxDB 3 Core 文档](https://docs.influxdata.com/influxdb3/core/)
> - [InfluxDB 3 Core 安装](https://docs.influxdata.com/influxdb3/core/install/)
> - [InfluxDB 2.x 文档](https://docs.influxdata.com/influxdb/v2/)
> - [InfluxDB Docker 镜像](https://hub.docker.com/_/influxdb)

## 版本怎么选

| 版本 | 适合场景 |
| --- | --- |
| InfluxDB 3 Core | 新项目、实时监控、希望使用 3.x 架构 |
| InfluxDB 2.x | 现有项目、Grafana/Telegraf 生态、Bucket/Token/Flux 使用较多 |
| InfluxDB 1.x | 历史项目维护，不建议新项目从 1.x 开始 |

> **注意 Docker 标签**
>
> 从 `2026-05-27` 开始，`influxdb:latest` 会指向 InfluxDB 3 Core。生产环境不要使用 `latest`，请写明确版本，例如 `influxdb:2.9`、`influxdb:3-core`。

## 核心概念

InfluxDB 2.x 常见概念：

| 概念 | 说明 |
| --- | --- |
| Organization | 组织 |
| Bucket | 数据桶，类似数据库加保留策略 |
| Token | API 鉴权令牌 |
| Measurement | 指标集合，例如 `temperature` |
| Tag | 标签，适合做过滤条件，例如 `device_id`、`room` |
| Field | 字段，实际数值，例如 `value=25.6` |
| Timestamp | 时间戳 |

InfluxDB 3 Core 中更常见的说法是 database、table、column，但写入 Line Protocol 的思想仍然很接近。

## InfluxDB 2.x Docker Compose

```yaml
services:
  influxdb:
    image: influxdb:2.9
    container_name: influxdb
    restart: unless-stopped
    ports:
      - "8086:8086"
    environment:
      DOCKER_INFLUXDB_INIT_MODE: setup
      DOCKER_INFLUXDB_INIT_USERNAME: admin
      DOCKER_INFLUXDB_INIT_PASSWORD: admin_password_change_me
      DOCKER_INFLUXDB_INIT_ORG: leroi
      DOCKER_INFLUXDB_INIT_BUCKET: metrics
      DOCKER_INFLUXDB_INIT_ADMIN_TOKEN: change_me_token
    volumes:
      - influxdb_data:/var/lib/influxdb2
      - influxdb_config:/etc/influxdb2

volumes:
  influxdb_data:
  influxdb_config:
```

启动：

```sh
docker compose up -d
docker logs -f influxdb
```

访问：

```text
http://localhost:8086
```

## 写入 Line Protocol

Line Protocol 基本格式：

```text
measurement,tag_key=tag_value field_key=field_value timestamp
```

例子：

```text
temperature,device=esp32,room=office value=26.3
```

通过 HTTP 写入 InfluxDB 2.x：

```sh
curl --request POST "http://localhost:8086/api/v2/write?org=leroi&bucket=metrics&precision=s" \
  --header "Authorization: Token change_me_token" \
  --data-raw "temperature,device=esp32,room=office value=26.3"
```

## Flux 查询

```text
from(bucket: "metrics")
  |> range(start: -1h)
  |> filter(fn: (r) => r._measurement == "temperature")
  |> filter(fn: (r) => r.device == "esp32")
```

常见聚合：

```text
from(bucket: "metrics")
  |> range(start: -24h)
  |> filter(fn: (r) => r._measurement == "temperature")
  |> aggregateWindow(every: 5m, fn: mean, createEmpty: false)
```

## Grafana 连接 InfluxDB

Grafana 添加数据源时重点看：

| 配置 | 说明 |
| --- | --- |
| URL | `http://influxdb:8086` 或公网地址 |
| Organization | 初始化时设置的 org |
| Token | 有读权限的 token |
| Bucket | 要查询的数据桶 |
| Query language | 2.x 常见 Flux，旧项目可能用 InfluxQL |

Docker Compose 同网络时，Grafana 里不要写 `localhost:8086`，应写服务名，例如 `http://influxdb:8086`。

## Schema 设计注意事项

### Tag 不要乱放

适合作为 tag：

- 设备 ID。
- 区域。
- 主机名。
- 环境名。
- 状态类型。

不适合作为 tag：

- 用户 ID 数量极大。
- 请求 ID。
- 时间戳。
- 随机字符串。
- 订单号。

高基数 tag 会让查询和存储压力变大。

### Field 放实际数值

例如：

```text
temperature,device=esp32 value=26.3
cpu,host=server01 usage=73.2
```

### 保留策略要提前想

不要无限保存所有原始数据。常见做法：

- 原始数据保存 7 天或 30 天。
- 5 分钟聚合数据保存 3 到 12 个月。
- 长期报表只保存小时级或天级统计。

## 常见问题

### 访问 `8086` 打不开

排查：

```sh
docker ps
docker logs influxdb
curl http://localhost:8086/health
```

常见原因：

- 容器没有启动。
- 端口映射不对。
- 初始化密码不满足要求。
- 数据卷里已有旧初始化状态，环境变量不再生效。

### Token 认证失败

确认：

- Header 是否写成 `Authorization: Token xxx`。
- Token 是否有对应 bucket 的读写权限。
- org、bucket 名称是否完全一致。
- 复制 token 时是否多了空格或换行。

### 写入成功但查询不到

常见原因：

- 查询时间范围不包含写入时间。
- bucket 或 org 写错。
- measurement 名称拼写不一致。
- 时间戳精度不匹配。
- 写入到了另一个环境。

先用最近时间查：

```text
from(bucket: "metrics")
  |> range(start: -24h)
```

### 数据量越来越大

处理方向：

- 设置 bucket retention。
- 用 task 做降采样。
- 控制采集频率。
- 避免高基数 tag。
- 删除不必要字段。

### 升级后 token 看不到明文

InfluxDB 2.9 起 token 会更强调哈希存储安全。实际使用中，token 只应该在创建时保存到密码管理器或部署变量里，不要依赖后台页面再次查看明文。

## 生产注意事项

- 不要使用 `latest` 镜像标签。
- token 不要写进前端代码。
- 给写入、查询、管理分别创建不同 token。
- 给 bucket 设置保留时间。
- 重要数据定期备份。
- Grafana 查询面板不要默认扫全量历史数据。
- 设备上报要做重试和限流，避免断网恢复后瞬间打爆服务。
