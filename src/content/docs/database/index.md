---
title: 数据库
description: 数据库相关技术文章，整理 MySQL 安装测试、索引、慢查询、join、查询理解、InfluxDB 时序数据和数据处理笔记。
---

这里放数据库相关内容。当前重点是 MySQL 安装测试、索引、慢查询、查询理解、连接排查、InfluxDB 时序数据和常见使用笔记，后续可以继续补充事务、备份恢复和数据建模。

## 内容

| 页面 | 内容 |
| --- | --- |
| [MySQL 安装与测试](/database/mysql-install-test) | Linux 安装、初始化、安全配置、连接测试、远程访问和常见报错 |
| [MySQL 索引](/database/mysql-indexes) | 索引类型、联合索引、最左前缀、EXPLAIN、慢查询和优化问题 |
| [MySQL 慢查询常见问题](/database/mysql-slow-query) | 慢查询日志、EXPLAIN、索引失效、深分页、锁等待、连接打满和 CPU 飙高 |
| [MySQL join 图解](/database/mysql-join) | `join`、`left join`、`right join` 的区别和示例 |
| [InfluxDB](/observability/influxdb) | 时序数据库、Line Protocol、Bucket、Token、Grafana 接入和常见问题 |
