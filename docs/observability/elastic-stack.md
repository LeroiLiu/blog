---
title: Elastic Stack / ELK 快速入门与常见问题
description: Elastic Stack、ELK、Elasticsearch、Logstash、Kibana、索引、日志采集、Docker、搜索分析和常见报错整理。
---

# Elastic Stack / ELK 快速入门与常见问题

ELK 通常指 `Elasticsearch + Logstash + Kibana`。现在更完整的名字是 Elastic Stack，常见组件还包括 Beats、Elastic Agent、APM 等。

::: info 官方入口
- [Elastic Stack 文档](https://www.elastic.co/docs/get-started/the-stack)
- [Elasticsearch 安装](https://www.elastic.co/docs/deploy-manage/deploy/self-managed/installing-elasticsearch)
- [Elasticsearch Docker 快速启动](https://www.elastic.co/docs/deploy-manage/deploy/self-managed/install-elasticsearch-docker-basic)
- [Logstash 入门](https://www.elastic.co/docs/reference/logstash/getting-started-with-logstash)
- [Kibana Docker 安装](https://www.elastic.co/docs/deploy-manage/deploy/self-managed/install-kibana-with-docker)
:::

## 组件职责

| 组件 | 作用 |
| --- | --- |
| Elasticsearch | 存储、索引、搜索和聚合 |
| Logstash | 采集、解析、过滤、转换和输出日志 |
| Kibana | 查询、可视化、仪表盘和管理界面 |
| Beats / Elastic Agent | 轻量采集客户端 |

日志链路通常是：

```text
应用日志 -> Filebeat/Logstash -> Elasticsearch -> Kibana
```

## 版本注意

Elastic Stack 各组件要保持同一大版本，最好同一具体版本。例如 Elasticsearch、Kibana、Logstash 都使用 `9.4.1`。混用版本容易出现连接、索引模板、认证和 API 兼容问题。

## 本地快速体验

开发测试可以先只启动 Elasticsearch 和 Kibana。生产环境需要考虑安全、内存、磁盘、快照、索引生命周期和集群高可用。

```yaml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:9.4.1
    container_name: elasticsearch
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - ES_JAVA_OPTS=-Xms1g -Xmx1g
    ports:
      - "9200:9200"
    volumes:
      - es_data:/usr/share/elasticsearch/data

  kibana:
    image: docker.elastic.co/kibana/kibana:9.4.1
    container_name: kibana
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

volumes:
  es_data:
```

启动：

```sh
docker compose up -d
curl http://localhost:9200
```

Kibana：

```text
http://localhost:5601
```

::: warning 本地配置不要直接用于生产
上面的示例关闭了安全认证，只适合本地学习。生产环境必须开启安全认证、TLS、权限控制和备份。
:::

## 写入一条测试数据

```sh
curl -X POST "http://localhost:9200/app-logs/_doc" \
  -H "Content-Type: application/json" \
  -d '{
    "@timestamp": "2026-05-28T12:00:00Z",
    "level": "error",
    "service": "api",
    "message": "database connection timeout"
  }'
```

查询：

```sh
curl "http://localhost:9200/app-logs/_search?pretty"
```

## Logstash 最小配置

`logstash.conf`：

```text
input {
  file {
    path => "/logs/app.log"
    start_position => "beginning"
  }
}

filter {
  grok {
    match => {
      "message" => "%{TIMESTAMP_ISO8601:time} %{LOGLEVEL:level} %{GREEDYDATA:content}"
    }
  }
}

output {
  elasticsearch {
    hosts => ["http://elasticsearch:9200"]
    index => "app-logs-%{+YYYY.MM.dd}"
  }
}
```

Logstash 更适合需要解析和转换的场景。如果只是采集文件日志，Filebeat 或 Elastic Agent 通常更轻。

## 索引和分片

| 概念 | 说明 |
| --- | --- |
| Index | 类似一类文档集合 |
| Document | 一条 JSON 文档 |
| Field | 文档字段 |
| Mapping | 字段类型和索引规则 |
| Shard | 分片，影响存储和查询 |
| Replica | 副本，影响可用性 |

常见日志索引命名：

```text
app-logs-2026.05.28
nginx-access-2026.05.28
payment-error-2026.05.28
```

数据量不大时，不要给每个小业务拆太多索引，否则 shard 数会膨胀。

## 常见问题

### `vm.max_map_count is too low`

Linux 上 Elasticsearch 常见报错：

```sh
sudo sysctl -w vm.max_map_count=262144
```

长期生效：

```sh
echo "vm.max_map_count=262144" | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

### Kibana 连不上 Elasticsearch

排查：

- `ELASTICSEARCH_HOSTS` 是否写错。
- 容器网络里是否应该写服务名 `elasticsearch`，而不是 `localhost`。
- Elasticsearch 是否启动完成。
- 安全认证是否开启。
- 版本是否一致。

```sh
docker logs elasticsearch
docker logs kibana
curl http://localhost:9200
```

### Elasticsearch 启动后很快退出

常见原因：

- 内存太小。
- 数据目录权限错误。
- `vm.max_map_count` 不满足。
- 配置了生产网络但 bootstrap checks 不通过。
- 磁盘空间不足。

### 日志进来了但 Kibana 搜不到

检查：

- 时间字段是否正确。
- Kibana 时间范围是否包含数据时间。
- index pattern 或 data view 是否匹配。
- 字段类型是否被错误映射。
- Logstash 输出 index 名称是否符合预期。

### 磁盘被打满

处理方向：

- 配置索引生命周期。
- 限制日志保留天数。
- 避免 debug 日志长期打开。
- 不要把大字段、请求体、响应体全量写入。
- 配置快照后删除过期索引。

## 生产注意事项

- Elasticsearch、Kibana、Logstash 保持同版本。
- 生产环境开启认证和 TLS。
- 设置 JVM heap，不要让 ES 抢完整机内存。
- 控制 shard 数量。
- 建立快照策略。
- 日志字段先规范，再进入大规模采集。
- 对敏感字段脱敏，例如手机号、token、身份证、支付信息。
