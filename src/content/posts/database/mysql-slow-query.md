---
title: MySQL 慢查询常见问题
description: MySQL 慢查询日志、EXPLAIN、索引失效、分页、锁等待、连接打满、CPU 飙高和常见慢 SQL 排查方法。
---

慢查询不是单纯“某条 SQL 慢”，它经常会表现为接口超时、PHP-FPM 占满、MySQL CPU 飙高、连接数打满、订单提交变慢、后台列表打不开。

排查时先确定问题属于哪一种：

- SQL 本身扫描太多行。
- 索引没有命中。
- 排序、临时表或回表成本高。
- 锁等待导致请求堆积。
- 连接数被慢请求拖满。
- 磁盘、内存、CPU、IO 已经到瓶颈。

## 快速判断

| 现象 | 优先检查 |
| --- | --- |
| 某个接口突然很慢 | 慢查询日志、接口参数、最近上线 |
| 所有接口都慢 | MySQL CPU、连接数、磁盘 IO、慢 SQL 是否集中爆发 |
| 偶发超时 | 锁等待、第三方接口、连接池、慢查询峰值 |
| 后台列表越翻越慢 | 深分页、排序、缺少联合索引 |
| 订单或库存偶发失败 | 行锁、事务过长、热点行更新 |
| `Too many connections` | 慢请求堆积、连接未释放、PHP-FPM 并发过高 |

## 开启慢查询日志

先看当前配置：

```sql
SHOW VARIABLES LIKE 'slow_query_log';
SHOW VARIABLES LIKE 'long_query_time';
SHOW VARIABLES LIKE 'slow_query_log_file';
SHOW VARIABLES LIKE 'log_output';
```

临时开启：

```sql
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 1;
```

如果想记录未使用索引的查询：

```sql
SET GLOBAL log_queries_not_using_indexes = 'ON';
```

注意：`log_queries_not_using_indexes` 在生产环境可能让日志量突然变大，建议短时间打开，排查完关闭。

## 看慢查询日志重点看什么

慢查询日志里常见字段：

```text
# Query_time: 3.214 Lock_time: 0.001 Rows_sent: 20 Rows_examined: 182340
```

重点：

- `Query_time`：执行耗时。
- `Lock_time`：等待锁的时间。
- `Rows_sent`：返回给客户端的行数。
- `Rows_examined`：扫描行数。

如果 `Rows_sent` 很小，但 `Rows_examined` 很大，通常是索引或查询条件有问题。

## 用 EXPLAIN 看执行计划

```sql
EXPLAIN
SELECT id, title, created_at
FROM articles
WHERE status = 1
ORDER BY created_at DESC
LIMIT 20;
```

重点看：

| 字段 | 说明 |
| --- | --- |
| `type` | `ALL` 通常表示全表扫描，优先关注 |
| `key` | 实际使用的索引 |
| `rows` | 预估扫描行数 |
| `Extra` | 是否出现 `Using filesort`、`Using temporary` |

MySQL 8 可以用 `EXPLAIN ANALYZE` 看真实执行过程，但它会实际执行 SQL，生产环境要谨慎。

## 最常见的慢查询原因

### 没有合适索引

慢 SQL：

```sql
SELECT id, title, created_at
FROM articles
WHERE status = 1
ORDER BY created_at DESC
LIMIT 20;
```

可考虑索引：

```sql
CREATE INDEX idx_status_created ON articles (status, created_at);
```

索引设计要按真实查询来，不要看到字段就加索引。

### 对索引列使用函数

不推荐：

```sql
SELECT id
FROM orders
WHERE DATE(created_at) = '2026-05-29';
```

推荐：

```sql
SELECT id
FROM orders
WHERE created_at >= '2026-05-29 00:00:00'
  AND created_at < '2026-05-30 00:00:00';
```

### 字段类型不一致

不推荐：

```sql
SELECT id
FROM users
WHERE mobile = 13800138000;
```

如果 `mobile` 是字符串，应写成：

```sql
SELECT id
FROM users
WHERE mobile = '13800138000';
```

类型不一致可能触发隐式转换，导致索引效果变差。

### 前置模糊查询

不推荐：

```sql
SELECT id
FROM products
WHERE name LIKE '%手机';
```

普通 B+Tree 索引难以处理前置 `%`。如果需要搜索，优先考虑：

- 调整为后缀匹配：`LIKE '手机%'`。
- 单独维护搜索字段。
- 使用全文索引。
- 使用搜索引擎。

### 深分页

慢 SQL：

```sql
SELECT id, title
FROM articles
WHERE status = 1
ORDER BY id DESC
LIMIT 100000, 20;
```

推荐游标翻页：

```sql
SELECT id, title
FROM articles
WHERE status = 1
  AND id < 900000
ORDER BY id DESC
LIMIT 20;
```

接口里把上一页最后一个 `id` 传回来，下一页从它继续查。

### 查询字段太多

不推荐：

```sql
SELECT *
FROM orders
WHERE user_id = 10001
ORDER BY id DESC
LIMIT 20;
```

推荐：

```sql
SELECT id, order_no, status, pay_amount, created_at
FROM orders
WHERE user_id = 10001
ORDER BY id DESC
LIMIT 20;
```

后台列表不要一次查出大文本、JSON、详情字段和无用字段。

## 锁等待不是索引问题

常见报错：

```text
Lock wait timeout exceeded; try restarting transaction
```

常见原因：

- 事务里做了外部 HTTP 请求。
- 事务里循环处理太多数据。
- 热点行频繁更新。
- 更新条件没有索引，导致锁范围扩大。
- 多个事务更新顺序不一致，容易死锁。

建议：

- 事务尽量短。
- 事务内只放必须一起成功或失败的数据库操作。
- 不要在事务里请求第三方接口。
- 更新条件必须命中索引。
- 多表更新保持固定顺序。

## 连接被打满

报错：

```text
Too many connections
```

不一定是连接数配置太小。很多时候是慢 SQL 导致请求释放太慢，连接被持续占用。

排查：

```sql
SHOW PROCESSLIST;
SHOW STATUS LIKE 'Threads_connected';
SHOW VARIABLES LIKE 'max_connections';
```

处理顺序：

1. 先找正在跑很久的 SQL。
2. 再看是否有大量 `Sleep` 连接。
3. 检查 PHP-FPM 并发和数据库连接数是否匹配。
4. 优化最慢、最频繁的查询。
5. 最后再评估是否提高 `max_connections`。

## 常见优化顺序

1. 先从慢查询日志找 Top SQL。
2. 用 `EXPLAIN` 看是否命中索引。
3. 优先优化扫描行数最多的 SQL。
4. 优先优化调用频率最高的接口。
5. 改 SQL 前先确认业务结果不能变。
6. 大表加索引前先评估时间、锁和回滚方案。
7. 上线后继续观察慢查询日志。

## 常见问题

### `Using filesort` 一定要优化吗

不一定。小数据量、低频接口可以接受。真正要关注的是耗时、扫描行数和调用频率。

### `Using temporary` 一定有问题吗

不一定，但在大表、复杂排序、分组统计里要重点关注。后台报表可以异步生成，不要每次打开页面都实时扫全表。

### 所有慢查询都要加索引吗

不是。低频导出、后台统计、一次性脚本不一定要为它增加索引。索引会增加写入成本。

### 为什么本地快，线上慢

常见原因：

- 线上数据量更大。
- 线上并发更高。
- 线上字段分布不同。
- 线上硬盘 IO 或 CPU 不足。
- 本地没有真实排序、分页和筛选条件。

## 官方入口

- [MySQL Slow Query Log](https://dev.mysql.com/doc/refman/8.4/en/slow-query-log.html)
- [MySQL EXPLAIN Statement](https://dev.mysql.com/doc/refman/8.4/en/explain.html)
