---
title: MySQL join 图解
description: MySQL inner join、left join、right join 的区别、图解、示例和使用建议。
---

# MySQL join 图解

`join` 用来把多张表按关联条件组合在一起。最常用的是 `inner join` 和 `left join`，`right join` 可以理解为把左右表顺序反过来的外连接。

## 图解

![MySQL join 图解](/images/articles/mysql-join.png)

## 示例表

用户表 `users`：

| id | name |
| --- | --- |
| 1 | Alice |
| 2 | Bob |
| 3 | Cindy |

订单表 `orders`：

| id | user_id | total |
| --- | --- | --- |
| 10 | 1 | 99 |
| 11 | 2 | 188 |
| 12 | 4 | 66 |

## join

`join` 默认通常指 `inner join`，只返回两边都匹配的数据：

```sql
select users.id, users.name, orders.total
  from users
  join orders on users.id = orders.user_id;
```

结果只包含 `Alice` 和 `Bob`，因为只有他们有匹配订单。

## left join

`left join` 保留左表全部记录，右表匹配不到时显示 `null`：

```sql
select users.id, users.name, orders.total
  from users
  left join orders on users.id = orders.user_id;
```

结果会包含 `Cindy`，但她的订单金额为 `null`。

## right join

`right join` 保留右表全部记录，左表匹配不到时显示 `null`：

```sql
select users.id, users.name, orders.total
  from users
  right join orders on users.id = orders.user_id;
```

结果会包含 `user_id = 4` 的订单，但用户信息为 `null`。

## 使用建议

- 业务查询中最常用的是 `inner join` 和 `left join`。
- 为了让阅读顺序更清楚，可以把 `right join` 改写成 `left join`。
- 关联字段要建立索引，否则数据量变大后查询会明显变慢。
- `where` 条件可能改变外连接结果，过滤右表字段时要特别注意。
