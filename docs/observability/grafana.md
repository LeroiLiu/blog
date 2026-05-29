---
title: Grafana 快速入门与常见问题
description: Grafana 仪表盘、数据源、Docker、InfluxDB、Prometheus、Loki、面板、变量、告警、反向代理和常见问题整理。
---

# Grafana 快速入门与常见问题

Grafana 是常用的可视化和告警平台，本身不负责长期存储数据，主要连接 InfluxDB、Prometheus、Loki、Elasticsearch、MySQL 等数据源，然后做仪表盘、查询和告警。

::: info 官方入口
- [Grafana 文档](https://grafana.com/docs/grafana/latest/)
- [Grafana Docker 安装](https://grafana.com/docs/grafana/latest/setup-grafana/installation/docker/)
- [Grafana + Prometheus 入门](https://grafana.com/docs/grafana/latest/fundamentals/getting-started/first-dashboards/get-started-grafana-prometheus/)
:::

## Docker 快速启动

```sh
docker volume create grafana-storage

docker run -d \
  -p 3000:3000 \
  --name grafana \
  --volume grafana-storage:/var/lib/grafana \
  grafana/grafana-enterprise
```

访问：

```text
http://localhost:3000
```

默认账号通常是：

```text
admin / admin
```

首次登录后需要修改密码。

## Docker Compose

```yaml
services:
  grafana:
    image: grafana/grafana-enterprise
    container_name: grafana
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      - grafana_storage:/var/lib/grafana
    environment:
      GF_SECURITY_ADMIN_USER: admin
      GF_SECURITY_ADMIN_PASSWORD: change_me

volumes:
  grafana_storage:
```

启动：

```sh
docker compose up -d
```

## 常见数据源

| 数据源 | 适合内容 |
| --- | --- |
| Prometheus | 服务器指标、应用指标、Kubernetes 指标 |
| InfluxDB | IoT、传感器、业务指标、时序数据 |
| Loki | 日志查询 |
| Elasticsearch | 日志搜索、事件分析 |
| MySQL | 业务报表、管理后台统计 |

## 添加 InfluxDB 数据源

重点配置：

| 项 | 示例 |
| --- | --- |
| URL | `http://influxdb:8086` |
| Organization | `leroi` |
| Token | `change_me_token` |
| Bucket | `metrics` |

如果 Grafana 和 InfluxDB 在同一个 Docker Compose 网络里，URL 应该写服务名，不是 `localhost`。

## 添加 Loki 数据源

```text
http://loki:3100
```

Grafana 中使用 LogQL 查询：

```text
{job="nginx"}
```

按关键词过滤：

```text
{job="nginx"} |= "error"
```

## 面板设计建议

- 一个仪表盘只解决一个主题，不要所有指标塞一页。
- 关键指标放上方，比如状态、错误数、请求量、耗时。
- 图表标题写清楚单位。
- 时间范围默认不要太大，避免每次打开都扫全量数据。
- 变量用于环境、服务、主机、设备切换。
- 告警规则要有恢复条件和通知分组。

## 反向代理配置

Nginx 示例：

```nginx
location / {
  proxy_pass http://127.0.0.1:3000;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
  proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  proxy_set_header X-Forwarded-Proto $scheme;
}
```

如果 Grafana 放在子路径，例如 `/grafana/`，需要配置：

```ini
[server]
root_url = https://example.com/grafana/
serve_from_sub_path = true
```

Docker 环境变量写法：

```yaml
environment:
  GF_SERVER_ROOT_URL: https://example.com/grafana/
  GF_SERVER_SERVE_FROM_SUB_PATH: "true"
```

## 常见问题

### 登录后数据全没了

容器没有挂载 `/var/lib/grafana`，删除容器后 SQLite 数据库也没了。使用 volume：

```yaml
volumes:
  - grafana_storage:/var/lib/grafana
```

### 数据源测试失败

排查：

- Grafana 容器里是否能访问数据源。
- URL 是否写成了错误的 `localhost`。
- token、账号、密码是否正确。
- 数据源服务是否监听在容器网络可访问地址。
- 防火墙是否拦截。

### 反向代理后跳转地址不对

检查：

- `root_url`。
- `serve_from_sub_path`。
- 代理是否传了 `X-Forwarded-Proto`。
- 域名 HTTPS 和内部 HTTP 的协议判断是否一致。

### 面板一直 No data

常见原因：

- 时间范围不包含数据。
- 查询条件过窄。
- 数据源变量为空。
- 字段单位或聚合函数选错。
- 数据写入到了另一个库、bucket 或 index。

### 告警没有通知

检查：

- Alert rule 是否处于 firing。
- Contact point 是否配置。
- Notification policy 是否匹配。
- 静默规则是否生效。
- 查询是否依赖面板变量。

## 生产注意事项

- 管理员密码不要用默认值。
- 给普通用户只读权限。
- 数据源 token 最小权限。
- 定期导出重要 dashboard JSON。
- 使用持久化存储。
- 对公网开放时加 HTTPS、SSO、IP 限制或反向代理认证。
- 插件不要随意安装来源不明版本。
