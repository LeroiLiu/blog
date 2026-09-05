---
title: ThinkPHP 8 高并发处理
description: ThinkPHP 8 在高并发场景下的库存扣减、幂等、Redis 锁、简单 SQL、事务、队列、限流和常见问题处理。
---

ThinkPHP 8 项目处理高并发时，重点不是写复杂 SQL，而是把并发入口、幂等、库存、锁、事务、缓存、队列和限流拆清楚。

原则：

- SQL 尽量简单。
- 条件必须命中索引。
- 不在事务里请求第三方接口。
- 幂等优先于重复重试。
- Redis 只做加速和协调，最终一致性仍要靠数据库约束兜底。

## 常见高并发场景

| 场景 | 风险 |
| --- | --- |
| 秒杀库存 | 超卖、热点行、锁等待 |
| 支付回调 | 重复通知、订单状态被反复更新 |
| 优惠券领取 | 一人多领、库存扣多 |
| 接口提交 | 用户重复点击、网络重试 |
| 定时任务 | 多进程重复处理同一条任务 |
| 消息消费 | 消息重复、消费失败、积压 |

## 表结构先兜底

订单表建议有业务唯一键：

```sql
CREATE TABLE order_main (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  order_no VARCHAR(64) NOT NULL,
  user_id BIGINT UNSIGNED NOT NULL,
  status TINYINT UNSIGNED NOT NULL DEFAULT 0,
  pay_amount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_order_no (order_no),
  KEY idx_user_id_id (user_id, id),
  KEY idx_status_id (status, id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

库存表：

```sql
CREATE TABLE product_stock (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  product_id BIGINT UNSIGNED NOT NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  sold INT UNSIGNED NOT NULL DEFAULT 0,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

幂等表：

```sql
CREATE TABLE request_idempotent (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  request_key VARCHAR(128) NOT NULL,
  biz_type VARCHAR(32) NOT NULL,
  biz_id VARCHAR(64) NOT NULL DEFAULT '',
  status TINYINT UNSIGNED NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_request_key (request_key),
  KEY idx_biz_type_biz_id (biz_type, biz_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

并发最终一定要靠唯一索引、状态条件和影响行数兜底。

## 库存扣减

不要先查库存再扣库存。并发下，先查再扣很容易超卖。

推荐用一条简单更新：

```php
use think\facade\Db;

$affected = Db::table('product_stock')
    ->where('product_id', $productId)
    ->where('stock', '>', 0)
    ->dec('stock')
    ->inc('sold')
    ->update([
        'updated_at' => date('Y-m-d H:i:s'),
    ]);

if ($affected !== 1) {
    return json([
        'code' => 400,
        'msg' => '库存不足',
    ]);
}
```

关键点：

- `product_id` 要有唯一索引。
- `where('stock', '>', 0)` 是防超卖条件。
- 用影响行数判断是否扣减成功。
- 不需要复杂子查询。

## 支付回调幂等

支付平台可能重复通知，同一个订单回调多次很正常。

推荐用状态条件更新：

```php
use think\facade\Db;

$now = date('Y-m-d H:i:s');

$affected = Db::table('order_main')
    ->where('order_no', $orderNo)
    ->where('status', 0)
    ->update([
        'status' => 1,
        'paid_at' => $now,
        'updated_at' => $now,
    ]);

if ($affected === 1) {
    // 第一次支付成功，后续可以发消息、加积分、发货前置处理
}

return 'success';
```

关键点：

- `order_no` 必须唯一。
- 只有 `status = 0` 才能改成已支付。
- 第二次回调影响行数为 `0`，直接返回成功即可。
- 不要因为重复回调就报错，否则支付平台会继续重试。

## 防重复提交

前端防抖只能改善体验，不能当最终保证。后端要做幂等。

示例：用户提交表单时传 `request_key`。

```php
use think\facade\Db;
use think\db\exception\PDOException;

$now = date('Y-m-d H:i:s');

try {
    Db::table('request_idempotent')->insert([
        'request_key' => $requestKey,
        'biz_type' => 'create_order',
        'biz_id' => '',
        'status' => 0,
        'created_at' => $now,
        'updated_at' => $now,
    ]);
} catch (PDOException $e) {
    return json([
        'code' => 409,
        'msg' => '请勿重复提交',
    ]);
}
```

这里不使用复杂 SQL，也不使用 `duplicate`。唯一索引冲突就是最清晰的重复判断。

## Redis 锁适合什么

Redis 锁适合短时间保护某个热点动作，例如同一个用户同一秒多次点击。

示例使用 Predis：

```php
use Predis\Client;

$redis = new Client([
    'scheme' => 'tcp',
    'host' => '127.0.0.1',
    'port' => 6379,
]);

$lockKey = 'lock:order:create:' . $userId;
$lockValue = bin2hex(random_bytes(16));

$locked = $redis->set($lockKey, $lockValue, 'PX', 5000, 'NX');

if ($locked !== true && $locked !== 'OK') {
    return json([
        'code' => 429,
        'msg' => '操作太频繁，请稍后再试',
    ]);
}

try {
    // 执行业务逻辑
} finally {
    if ($redis->get($lockKey) === $lockValue) {
        $redis->del([$lockKey]);
    }
}
```

注意：

- 锁过期时间要短。
- 释放锁时要校验 `lockValue`。
- Redis 锁不能替代数据库唯一索引和状态更新。
- 复杂跨服务一致性不要只靠一个 Redis 锁硬顶。

## 事务怎么用

事务只包住必须一起成功或失败的数据库操作。

```php
use think\facade\Db;

Db::transaction(function () use ($orderNo, $productId, $userId) {
    $now = date('Y-m-d H:i:s');

    $affected = Db::table('product_stock')
        ->where('product_id', $productId)
        ->where('stock', '>', 0)
        ->dec('stock')
        ->inc('sold')
        ->update([
            'updated_at' => $now,
        ]);

    if ($affected !== 1) {
        throw new RuntimeException('库存不足');
    }

    Db::table('order_main')->insert([
        'order_no' => $orderNo,
        'user_id' => $userId,
        'status' => 0,
        'pay_amount' => 99.00,
        'created_at' => $now,
        'updated_at' => $now,
    ]);
});
```

不要在事务里做：

- 请求微信、支付宝、短信、第三方 HTTP。
- 生成大文件。
- 发送邮件。
- 循环处理几千条数据。
- 等待用户操作。

## 热点数据怎么处理

热点商品、热门活动、热门文章会造成数据库压力集中。

常见做法：

- 商品详情放缓存。
- 库存展示用缓存，扣减仍走数据库兜底。
- 阅读数、浏览数先写 Redis，再定时合并。
- 高频接口做限流。
- 大列表使用游标分页。

浏览数示例：

```php
$redis->incr('article:view:' . $articleId);
```

定时合并时分批读取，不要一次扫全部 key。

## 限流

用户级限流：

```php
$key = 'limit:api:' . $userId . ':' . date('YmdHi');
$count = $redis->incr($key);

if ($count === 1) {
    $redis->expire($key, 70);
}

if ($count > 60) {
    return json([
        'code' => 429,
        'msg' => '请求过于频繁',
    ]);
}
```

这类限流简单直接，适合大多数后台和小程序接口。

## 常见问题

### 为什么不推荐复杂 SQL

复杂 SQL 可能导致：

- 难以命中索引。
- 执行计划不稳定。
- 排查慢查询困难。
- 线上数据量变大后突然变慢。
- 开发者不容易判断是否正确。

高并发接口优先使用简单 SQL、明确索引和状态条件。

### 只用 Redis 锁可以吗

不可以。Redis 锁可能过期、释放失败、网络超时。数据库唯一索引、状态字段和影响行数仍然是最终兜底。

### PHP-FPM 能处理高并发吗

能处理常规并发，但不适合把长时间任务压在 HTTP 请求里。长任务应拆成队列、轮询任务或异步任务，HTTP 只负责接收请求和返回状态。

### 高并发下先查再更新为什么危险

因为多个请求可能同时读到同一个旧值，然后都认为可以更新。应使用带条件的原子更新，并检查影响行数。

## 相关入口

- [ThinkPHP 8.x](/php/thinkphp-8-x)
- [HTTP 轮询任务](/backend/http-cron-polling)
- [MySQL 慢查询常见问题](/database/mysql-slow-query)
- [MySQL 索引](/database/mysql-indexes)
