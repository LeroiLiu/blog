---
title: 监控日志与可观测性
description: InfluxDB、Elastic Stack、ELK、Grafana、Loki、日志、指标、时序数据、仪表盘、告警和常见问题整理。
---

# 监控日志与可观测性

这里整理日志、指标、时序数据、仪表盘和告警相关内容。目标是把“系统出问题后怎么发现、怎么定位、怎么复盘”写成可以复用的文档。

## 内容

| 页面 | 内容 |
| --- | --- |
| [InfluxDB 快速入门](/observability/influxdb) | 时序数据库、版本选择、Docker、Line Protocol、查询和常见问题 |
| [Elastic Stack / ELK](/observability/elastic-stack) | Elasticsearch、Logstash、Kibana、索引、日志采集、常见报错 |
| [Grafana 快速入门](/observability/grafana) | 仪表盘、数据源、Docker、面板、变量、告警和权限 |
| [Loki 快速入门](/observability/loki) | 日志存储、标签、LogQL、Grafana 查询、采集和常见问题 |

## 怎么选

| 场景 | 推荐 |
| --- | --- |
| 设备传感器、CPU、温度、业务指标 | InfluxDB、Prometheus |
| 日志全文搜索、复杂检索、日志分析 | Elastic Stack |
| 日志成本敏感、主要按标签过滤 | Loki |
| 统一展示仪表盘和告警 | Grafana |

## 基本思路

可观测性常见三类数据：

- Metrics：指标，比如 CPU、内存、接口耗时、QPS。
- Logs：日志，比如访问日志、错误日志、业务日志。
- Traces：链路追踪，比如一次请求经过了哪些服务。

小项目可以从 Grafana + Loki 或 Grafana + InfluxDB 开始；日志检索量大、字段分析复杂时，再考虑 Elastic Stack。
