---
title: Loki 快速入门与常见问题
description: Grafana Loki 日志系统、Docker、LogQL、标签设计、日志采集、Grafana 数据源、Promtail、Alloy 和常见问题整理。
---

Loki 是 Grafana 生态里的日志系统。它和 Elasticsearch 最大的区别是：Loki 不默认给日志全文建立复杂索引，而是主要索引标签，因此成本更低，但查询方式也更依赖标签设计。

> **官方入口**
>
> - [Loki 文档](https://grafana.com/docs/loki/latest/)
> - [Loki 入门](https://grafana.com/docs/loki/latest/get-started/)
> - [Loki Docker 安装](https://grafana.com/docs/loki/latest/setup/install/docker/)

## Loki 适合什么

适合：

- 容器日志。
- Nginx、应用、任务日志。
- 和 Grafana 一起查询日志。
- 中小规模日志平台。
- 成本敏感的日志存储。

不适合：

- 需要大量任意字段全文索引。
- 类似搜索引擎一样对所有字段做复杂检索。
- 标签设计混乱、日志没有结构。

## 核心概念

| 概念 | 说明 |
| --- | --- |
| Loki | 日志存储与查询服务 |
| Grafana | 查询和展示 Loki 日志 |
| Promtail / Alloy | 日志采集客户端 |
| LogQL | Loki 查询语言 |
| Label | 标签，用于定位日志流 |
| Stream | 一组相同标签的日志流 |

## Docker 快速启动

开发测试可以用单容器体验：

```sh
docker run -d \
  --name loki \
  -p 3100:3100 \
  grafana/loki:3.6.0
```

验证：

```sh
curl http://localhost:3100/ready
```

Grafana 添加 Loki 数据源：

```text
http://loki:3100
```

如果 Grafana 不在同一个 Docker 网络里，则使用宿主机 IP 或域名。

## LogQL 入门

按标签查询：

```text
{job="nginx"}
```

包含关键词：

```text
{job="nginx"} |= "error"
```

排除关键词：

```text
{job="nginx"} != "health"
```

正则匹配：

```text
{job="nginx"} |~ "5.."
```

统计日志行数：

```text
sum(count_over_time({job="nginx"}[5m]))
```

按标签分组统计：

```text
sum by (level) (count_over_time({app="api"}[5m]))
```

## 标签设计

适合作为标签：

- `app`
- `env`
- `job`
- `host`
- `namespace`
- `container`
- `level`

不适合作为标签：

- 请求 ID。
- 用户 ID。
- 订单号。
- 完整 URL。
- 随机字符串。
- IP 明细。

标签过多或高基数会让 Loki 压力变大。日志正文里可以有很多字段，但标签要克制。

## 应用日志建议

推荐结构化日志：

```json
{"time":"2026-05-28T12:00:00Z","level":"error","service":"api","message":"database timeout","trace_id":"abc123"}
```

应用侧至少要包含：

- 时间。
- 等级。
- 服务名。
- 错误信息。
- 请求 ID 或 trace ID。
- 关键业务上下文。

## 常见问题

### Grafana 查不到日志

排查：

- Loki 是否启动。
- Grafana 数据源 URL 是否正确。
- 采集器是否把日志推到了 Loki。
- 查询时间范围是否包含日志时间。
- 标签是否写错。

```sh
curl http://localhost:3100/ready
```

### 查询很慢

常见原因：

- 时间范围太大。
- 标签过滤太少。
- 日志量太大。
- 查询中用了宽泛正则。
- 标签设计不合理。

优化方向：

- 先用标签缩小范围。
- 默认仪表盘时间不要太长。
- 对高频日志降噪。
- 避免把请求 ID 作为 label。

### 日志丢失

排查：

- 采集器是否重启。
- 容器日志是否轮转。
- Loki 存储是否满了。
- retention 是否过短。
- 时间戳是否异常。

### `entry too far behind`

日志时间戳比当前时间落后太多，可能是：

- 机器时间不准。
- 旧日志被重新采集。
- 应用写入了错误时间。

处理方向：

- 同步服务器时间。
- 调整采集位置。
- 清理旧 position 文件后谨慎重采。

## Loki 与 ELK 怎么选

| 对比 | Loki | Elastic Stack |
| --- | --- | --- |
| 查询入口 | Grafana | Kibana |
| 索引方式 | 标签索引为主 | 字段全文索引能力强 |
| 成本 | 相对低 | 相对高 |
| 查询能力 | 适合按标签找日志 | 适合复杂搜索分析 |
| 学习成本 | 较低 | 较高 |

如果只是按服务、容器、等级、关键词查日志，Loki 很合适。如果需要大量字段检索、复杂聚合和安全审计分析，Elastic Stack 更合适。

## 生产注意事项

- 标签数量和标签基数要严格控制。
- 设置日志保留时间。
- 日志采集器要监控自身状态。
- 多租户或多环境要分清 label。
- 敏感字段不要直接写入日志。
- Grafana 权限要按团队划分。
