---
title: MySQL 索引
description: MySQL 索引基础、B+Tree、联合索引、最左前缀、EXPLAIN、慢查询和常见优化问题。
---

# MySQL 索引

MySQL 索引的目标是减少扫描行数，让查询更快定位数据。索引不是越多越好，过多索引会增加写入成本、占用磁盘，并让优化器选择变复杂。

## 常见索引类型

| 类型 | 说明 |
| --- | --- |
| 主键索引 | 表的主键，InnoDB 聚簇索引按主键组织数据 |
| 唯一索引 | 保证字段或字段组合唯一 |
| 普通索引 | 加速查询，不保证唯一 |
| 联合索引 | 多列组成一个索引 |
| 前缀索引 | 对字符串前 N 个字符建立索引 |
| 全文索引 | 适合文本检索场景 |

## 创建索引

```sql
CREATE INDEX idx_user_created_at ON orders (user_id, created_at);
```

唯一索引：

```sql
CREATE UNIQUE INDEX uk_user_email ON users (email);
```

删除索引：

```sql
DROP INDEX idx_user_created_at ON orders;
```

查看索引：

```sql
SHOW INDEX FROM orders;
```

## 联合索引和最左前缀

索引：

```sql
CREATE INDEX idx_user_status_created ON orders (user_id, status, created_at);
```

容易命中的查询：

```sql
SELECT * FROM orders WHERE user_id = 1;
SELECT * FROM orders WHERE user_id = 1 AND status = 'paid';
SELECT * FROM orders WHERE user_id = 1 AND status = 'paid' ORDER BY created_at DESC;
```

不一定能充分利用的查询：

```sql
SELECT * FROM orders WHERE status = 'paid';
SELECT * FROM orders WHERE created_at > '2026-01-01';
```

联合索引的列顺序非常重要。一般把高频过滤条件、等值条件、选择性较好的字段放在更合适的位置，再结合排序和范围查询设计。

## EXPLAIN

```sql
EXPLAIN SELECT * FROM orders WHERE user_id = 1 AND status = 'paid';
```

重点看：

| 字段 | 说明 |
| --- | --- |
| `type` | 访问类型，常见有 `ALL`、`range`、`ref`、`const` |
| `key` | 实际使用的索引 |
| `rows` | 预估扫描行数 |
| `Extra` | 额外信息，例如 `Using where`、`Using index`、`Using filesort` |

`EXPLAIN` 是优化起点，不是最终真相。还要结合真实数据量、慢查询日志和执行耗时。

## 索引失效常见原因

| 写法 | 问题 |
| --- | --- |
| `WHERE DATE(created_at) = '2026-01-01'` | 对索引列使用函数 |
| `WHERE name LIKE '%abc'` | 前置通配符难以使用普通 B+Tree 索引 |
| `WHERE id + 1 = 10` | 对索引列做计算 |
| 字段类型不一致 | 可能发生隐式转换 |
| 联合索引跳过最左列 | 无法充分利用联合索引 |
| `OR` 条件复杂 | 优化器可能放弃索引 |

优化写法示例：

```sql
  WHERE created_at >= '2026-01-01 00:00:00'
AND created_at < '2026-01-02 00:00:00'
```

## 慢查询排查

更完整的慢查询排查见：[MySQL 慢查询常见问题](/database/mysql-slow-query)。

开启慢查询前先确认环境和日志路径。常用变量：

```sql
SHOW VARIABLES LIKE 'slow_query_log';
SHOW VARIABLES LIKE 'long_query_time';
SHOW VARIABLES LIKE 'slow_query_log_file';
```

临时开启示例：

```sql
  SET GLOBAL slow_query_log = 'ON';
  SET GLOBAL long_query_time = 1;
```

生产环境修改前要确认日志量，避免磁盘被大量慢查询日志打满。

## 设计建议

- 按真实查询设计索引，不按字段名想当然加索引。
- 高频查询优先。
- 更新频繁的字段谨慎加索引。
- 联合索引优先覆盖多个查询场景。
- 避免重复索引，例如 `(a)` 和 `(a, b)` 要看是否都必要。
- 分页深时考虑游标分页或条件翻页。
- 大表加索引前评估锁、耗时和回滚方案。

## 常见问题

### 为什么加了索引还是慢

可能原因：

- 查询没有用到索引。
- 扫描行数仍然很大。
- 回表太多。
- 排序或临时表成本高。
- 数据分布导致索引选择性差。
- 返回字段太多。
- 数据库资源瓶颈不在索引。

### `Using filesort` 一定有问题吗

不一定。它表示 MySQL 需要额外排序，不代表一定慢。是否需要优化要看数据量、耗时和业务频率。

### 索引会影响写入吗

会。每次插入、更新、删除都可能维护索引。写多读少的表要控制索引数量。

## 官方入口

- [MySQL Optimization and Indexes](https://dev.mysql.com/doc/refman/8.4/en/optimization-indexes.html)
- [MySQL EXPLAIN Statement](https://dev.mysql.com/doc/refman/8.4/en/explain.html)
