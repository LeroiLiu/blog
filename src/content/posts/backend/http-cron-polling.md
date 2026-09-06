---
title: 后端 HTTP 轮询任务：ThinkPHP 8 + MySQL 如何做到不重复、不间断
description: 讲解后端轮询任务的设计思路，以 ThinkPHP 8 + MySQL + HTTP + crontab 为例，整理任务表、任务领取、幂等、防重复、失败重试、并发控制和常见问题。
---

很多项目都会遇到类似需求：

- 定时同步第三方订单、物流、支付状态。
- 定时处理待发送短信、公众号模板消息、邮件。
- 定时检查超时订单、自动关闭订单、自动确认收货。
- 定时拉取外部接口数据，再写入本地数据库。
- 后台任务不能重复处理，也不能因为某次请求失败就完全停掉。

这类任务不要只理解成“写一个 PHP 脚本然后一直跑”。更稳妥的做法是：**HTTP 任务入口只负责触发一小批任务，MySQL 负责任务状态、锁、重试和幂等，`crontab` 负责持续触发。**

本文示例按 ThinkPHP 8 项目写法组织：路由进 Controller，业务放 Service，数据库操作使用 `think\facade\Db`。

## 先说结论

小型项目可以用这套结构：

```text
crontab -> curl 请求 ThinkPHP 内部接口 -> Service 从 MySQL 领取任务 -> 执行任务 -> 更新任务状态
```

核心目标：

| 目标 | 做法 |
| --- | --- |
| 不重复 | 业务唯一键、任务状态、MySQL 行锁、幂等处理 |
| 不间断 | `crontab` 持续触发、失败重试、锁过期恢复 |
| 可恢复 | 任务落库，失败原因落库，处理中任务超时后可重新领取 |
| 可控制 | 每次只处理固定批次，避免单次请求跑太久 |
| 可观察 | 记录处理次数、错误信息、完成时间和日志 |

> **重点**
>
> HTTP 只是触发方式，不是防重复的关键。真正防重复要靠数据库任务状态、唯一键、锁和业务幂等。

## 为什么不用一个死循环 PHP 脚本

单独写一个 PHP CLI 脚本当然可以，但很多普通 Web 项目会遇到这些问题：

- 没有 `Supervisor`、`systemd` 或队列服务维护脚本常驻。
- 脚本异常退出后没人拉起。
- 多进程并发不好控制。
- 日志、权限、环境变量和 Web 运行环境不一致。
- 虚拟主机、普通面板、老项目环境里不方便部署常驻进程。

用 HTTP + `crontab` 的好处是部署简单：

- 通过 `curl` 定时访问一个内部接口。
- 接口每次处理一小批任务。
- 请求结束后释放 PHP-FPM 资源。
- 下次 `crontab` 会继续触发。
- 即使某次失败，下一轮仍然可以恢复。

这不是最高性能方案，但很适合中小型项目、老 PHP 项目、没有队列服务的项目。

## 任务表设计

先建一张任务表。所有要处理的事情都先落库，不要直接在接口里临时处理。

```sql
CREATE TABLE polling_jobs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  business_key VARCHAR(128) NOT NULL COMMENT '业务唯一键，用来防重复',
  type VARCHAR(64) NOT NULL COMMENT '任务类型',
  payload JSON NULL COMMENT '任务参数',
  status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending, processing, success, failed',
  attempts INT UNSIGNED NOT NULL DEFAULT 0 COMMENT '已尝试次数',
  max_attempts INT UNSIGNED NOT NULL DEFAULT 5 COMMENT '最大尝试次数',
  next_run_at DATETIME NOT NULL COMMENT '下次可执行时间',
  locked_by VARCHAR(100) DEFAULT NULL COMMENT '当前领取者',
  locked_until DATETIME DEFAULT NULL COMMENT '锁过期时间',
  last_error TEXT NULL COMMENT '最后一次错误',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  finished_at DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_business_key (business_key),
  KEY idx_pick (status, next_run_at, id),
  KEY idx_lock (status, locked_until),
  KEY idx_type_status (type, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

字段说明：

| 字段 | 作用 |
| --- | --- |
| `business_key` | 防止同一个业务任务重复插入，例如 `order_sync:10001` |
| `status` | 任务状态，常见为 `pending`、`processing`、`success`、`failed` |
| `attempts` | 已经执行过几次 |
| `next_run_at` | 控制延迟重试和定时执行 |
| `locked_by` | 当前是哪一个 worker 领取了任务 |
| `locked_until` | 防止 worker 异常退出后任务永远卡死 |
| `last_error` | 方便后台查看失败原因 |

## SQL 要尽量简单

这类后台任务表通常会持续增长，所以 SQL 不要写得太绕。

建议：

- 领取任务只按 `status`、`next_run_at`、`id` 走索引。
- 不在领取 SQL 里写复杂 `OR`、子查询、视图、聚合函数。
- 不在大表上频繁 `COUNT(*)`、`GROUP BY` 做实时统计。
- 任务恢复、任务领取、任务处理拆成多个简单步骤。
- 复杂控制可以放到 Redis/Predis，而不是全压到 MySQL 查询里。

本文后面的示例会遵循这个原则：**先把过期的 `processing` 恢复成 `pending`，再用一条简单 SQL 领取 `pending` 任务。**

## ThinkPHP 8 路由

`route/app.php`：

```php
<?php

use think\facade\Route;

Route::post('internal/jobs/run', 'internal.Job/run');
```

这个接口只给 `crontab` 或内部系统调用，不应该作为公开业务 API。

## 配置 token 和批次

`config/job.php`：

```php
<?php

return [
    'token' => env('job.token', 'change_me'),
    'max_seconds' => 45,
    'batch_size' => 20,
    'lock_minutes' => 5,
    'recover_limit' => 100,
];
```

`.env`：

```text
JOB_TOKEN=change_me_to_long_random_string
```

## crontab 调 HTTP 接口

`crontab` 中可以用 `curl` 定时请求内部任务接口：

```sh
* * * * * /usr/bin/curl -fsS -m 55 -X POST "https://example.com/internal/jobs/run?token=change_me_to_long_random_string" >/dev/null 2>&1
```

参数含义：

| 参数 | 说明 |
| --- | --- |
| `-f` | HTTP 非 2xx 时返回失败 |
| `-sS` | 安静输出，但保留错误 |
| `-m 55` | 最多执行 55 秒，避免请求卡死 |
| `-X POST` | 用 POST 表示这是一个执行动作 |

如果想提高频率，可以在一分钟内分三次触发：

```sh
* * * * * /usr/bin/curl -fsS -m 18 -X POST "https://example.com/internal/jobs/run?token=change_me_to_long_random_string" >/dev/null 2>&1
* * * * * sleep 20; /usr/bin/curl -fsS -m 18 -X POST "https://example.com/internal/jobs/run?token=change_me_to_long_random_string" >/dev/null 2>&1
* * * * * sleep 40; /usr/bin/curl -fsS -m 18 -X POST "https://example.com/internal/jobs/run?token=change_me_to_long_random_string" >/dev/null 2>&1
```

> **安全注意**
>
> 这个 HTTP 接口不能直接裸奔。至少要加 token、IP 白名单、内网访问限制，最好只允许服务器本机或固定出口访问。

## Controller：只负责触发

`app/controller/internal/Job.php`：

```php
<?php

declare(strict_types=1);

namespace app\controller\internal;

use app\service\PollingJobService;
use think\Request;
use think\Response;
use Throwable;

class Job
{
    public function run(Request $request, PollingJobService $service): Response
    {
        if ($request->param('token') !== config('job.token')) {
            return json(['message' => 'forbidden'], 403);
        }

        ignore_user_abort(true);
        set_time_limit((int) config('job.max_seconds') + 5);

        $workerId = gethostname() . ':' . getmypid() . ':' . bin2hex(random_bytes(4));
        $deadline = time() + (int) config('job.max_seconds');
        $limit = (int) config('job.batch_size');
        $done = 0;
        $failed = 0;

        $service->recoverExpired();

        while (time() < $deadline && $done < $limit) {
            $job = $service->claim($workerId);

            if (!$job) {
                break;
            }

            try {
                $service->handle($job);
                $service->markSuccess((int) $job['id']);
            } catch (Throwable $e) {
                $failed++;
                $service->markRetryOrFailed($job, $e);
            }

            $done++;
        }

        return json([
            'ok' => true,
            'done' => $done,
            'failed' => $failed,
        ]);
    }
}
```

Controller 只做触发、鉴权和循环控制。真正的任务领取、状态流转和业务处理都放到 Service。

## 可选：Predis 防止重复触发

如果担心多个 `crontab`、多个服务器或手动访问同时触发同一个 HTTP 任务入口，可以在 Controller 外层加一个 Redis 锁。这样 MySQL 只负责处理任务状态，不需要靠复杂 SQL 做全局互斥。

安装：

```sh
composer require predis/predis
```

示例：

```php
use Predis\Client as RedisClient;

$redis = new RedisClient([
    'scheme' => 'tcp',
    'host' => '127.0.0.1',
    'port' => 6379,
]);

$lockKey = 'lock:job:runner';
$lockValue = $workerId;
$locked = $redis->set($lockKey, $lockValue, 'EX', 50, 'NX');

if (!$locked) {
    return json([
        'ok' => true,
        'message' => 'another runner is working',
    ]);
}

try {
    // 执行任务循环
} finally {
    if ($redis->get($lockKey) === $lockValue) {
        $redis->del([$lockKey]);
    }
}
```

这个锁不是替代 MySQL 任务状态，而是减少重复触发和并发压力。真正的防重复仍然要靠 `business_key`、任务状态和业务幂等。

## Service：创建任务

`app/service/PollingJobService.php`：

```php
<?php

declare(strict_types=1);

namespace app\service;

use RuntimeException;
use think\facade\Db;
use Throwable;

class PollingJobService
{
    public function createOrderSyncJob(int $orderId): void
    {
        $now = date('Y-m-d H:i:s');
        $businessKey = 'order_sync:' . $orderId;
        $payload = json_encode(['order_id' => $orderId], JSON_UNESCAPED_UNICODE);

        try {
            Db::table('polling_jobs')->insert([
                'business_key' => $businessKey,
                'type' => 'order_sync',
                'payload' => $payload,
                'status' => 'pending',
                'next_run_at' => $now,
                'created_at' => $now,
                'updated_at' => $now,
            ]);
        } catch (Throwable $e) {
            if (!$this->isDuplicateKey($e)) {
                throw $e;
            }
        }
    }

    private function isDuplicateKey(Throwable $e): bool
    {
        return str_contains($e->getMessage(), 'Duplicate entry')
            || str_contains($e->getMessage(), '1062');
    }
}
```

这里靠 `business_key` 的唯一索引防止重复创建。`id` 是自增主键，只能唯一标识某一行，不能判断两个请求是不是同一个订单同步任务。`business_key` 应该来自业务本身，例如 `order_sync:10001`，不要用秒级时间戳或 `updated_at` 拼出来。即使同一秒触发很多次同一个订单任务，第二次插入也会触发 `business_key` 唯一冲突，代码捕获后直接忽略。

## 恢复过期任务

领取任务之前，先把已经锁超时的 `processing` 恢复成 `pending`。这一步 SQL 很简单，只按 `status + locked_until` 索引走。

把下面方法放进 `PollingJobService`：

```php
public function recoverExpired(): void
{
    $now = date('Y-m-d H:i:s');

    Db::table('polling_jobs')
        ->where('status', 'processing')
        ->where('locked_until', '<', $now)
        ->limit((int) config('job.recover_limit'))
        ->update([
            'status' => 'pending',
            'locked_by' => null,
            'locked_until' => null,
            'updated_at' => $now,
        ]);
}
```

Controller 的循环开始前可以调用一次：

```php
$service->recoverExpired();
```

## 领取任务

恢复过期任务后，领取任务只查 `pending`。这样 SQL 比较干净，也更容易走 `idx_pick(status, next_run_at, id)`。

```php
public function claim(string $workerId): ?array
{
    return Db::transaction(function () use ($workerId) {
        $now = date('Y-m-d H:i:s');

        $job = Db::table('polling_jobs')
            ->where('status', 'pending')
            ->where('next_run_at', '<=', $now)
            ->order('id', 'asc')
            ->lock(true)
            ->find();

        if (!$job) {
            return null;
        }

        Db::table('polling_jobs')
            ->where('id', $job['id'])
            ->inc('attempts')
            ->update([
                'status' => 'processing',
                'locked_by' => $workerId,
                'locked_until' => date('Y-m-d H:i:s', time() + ((int) config('job.lock_minutes') * 60)),
                'updated_at' => $now,
            ]);

        return $job;
    });
}
```

这里的 `lock(true)` 会在事务内锁住当前选中的任务行。因为前面已经把过期任务恢复了，所以领取 SQL 不需要复杂 `OR` 条件。

这里也没有在领取 SQL 里判断 `attempts < max_attempts`。原因是失败处理时已经会把超限任务改成 `failed`，正常可领取的任务只需要保持 `pending` 状态即可。

## 无 Redis 时的并发

如果不使用 Redis 外层锁，也可以用一次原子更新领取任务。这个写法 SQL 仍然只围绕 `pending` 状态，不做复杂嵌套条件。

```php
public function claimByUpdate(string $workerId): ?array
{
    $lockKey = $workerId . ':' . bin2hex(random_bytes(8));
    $now = date('Y-m-d H:i:s');

    $affected = Db::table('polling_jobs')
        ->where('status', 'pending')
        ->where('next_run_at', '<=', $now)
        ->order('id', 'asc')
        ->limit(1)
        ->inc('attempts')
        ->update([
            'status' => 'processing',
            'locked_by' => $lockKey,
            'locked_until' => date('Y-m-d H:i:s', time() + 300),
            'updated_at' => $now,
        ]);

    if ($affected === 0) {
        return null;
    }

    $job = Db::table('polling_jobs')
        ->where('locked_by', $lockKey)
        ->find();

    return $job ?: null;
}
```

这个写法适合简单场景。并发量高、任务量大时，更建议使用 Redis 外层锁、ThinkPHP Queue、Redis Stream 或真正的消息队列。

## 执行任务要幂等

数据库锁只能保证“领取过程尽量不重复”，但外部接口超时、PHP 中断、网络重试时，仍然可能出现“任务已经执行了一半”的情况。

所以任务处理函数必须尽量幂等。

```php
public function handle(array $job): void
{
    $payload = json_decode($job['payload'] ?: '{}', true, 512, JSON_THROW_ON_ERROR);

    if ($job['type'] === 'order_sync') {
        $this->syncOrderToRemote((int) $payload['order_id']);
        return;
    }

    throw new RuntimeException('Unknown job type: ' . $job['type']);
}
```

比如 `syncOrderToRemote()` 里要注意：

- 本地先查订单是否存在。
- 已经同步成功的订单不要重复同步。
- 调第三方接口时带上业务唯一号，例如订单号。
- 第三方如果支持幂等键，就传 `business_key`。
- 写本地结果时使用唯一键或状态判断。

示例：

```php
private function syncOrderToRemote(int $orderId): void
{
    $order = Db::table('orders')
        ->where('id', $orderId)
        ->field('id,order_no,sync_status')
        ->find();

    if (!$order) {
        throw new RuntimeException('Order not found: ' . $orderId);
    }

    if ($order['sync_status'] === 'success') {
        return;
    }

    // 这里调用第三方接口。实际项目里要设置超时，并记录请求和响应。
    $remoteResult = [
        'success' => true,
        'remote_id' => 'remote-' . $order['order_no'],
    ];

    if (!$remoteResult['success']) {
        throw new RuntimeException('Remote sync failed');
    }

    Db::table('orders')
        ->where('id', $orderId)
        ->update([
            'sync_status' => 'success',
            'remote_id' => $remoteResult['remote_id'],
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
}
```

## 成功和失败状态

成功时直接标记完成：

```php
public function markSuccess(int $jobId): void
{
    Db::table('polling_jobs')
        ->where('id', $jobId)
        ->update([
            'status' => 'success',
            'locked_by' => null,
            'locked_until' => null,
            'last_error' => null,
            'finished_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
}
```

失败时不要立刻丢弃，可以延迟重试：

```php
public function markRetryOrFailed(array $job, Throwable $e): void
{
    $attempts = (int) $job['attempts'] + 1;
    $maxAttempts = (int) $job['max_attempts'];
    $delaySeconds = min(3600, 60 * (2 ** min($attempts, 6)));
    $status = $attempts >= $maxAttempts ? 'failed' : 'pending';
    $now = time();

    Db::table('polling_jobs')
        ->where('id', $job['id'])
        ->update([
            'status' => $status,
            'next_run_at' => date('Y-m-d H:i:s', $now + $delaySeconds),
            'locked_by' => null,
            'locked_until' => null,
            'last_error' => mb_substr($e->getMessage(), 0, 1000),
            'finished_at' => $status === 'failed' ? date('Y-m-d H:i:s', $now) : null,
            'updated_at' => date('Y-m-d H:i:s', $now),
        ]);
}
```

重试时间不要固定 1 秒，否则第三方服务异常时会被你自己的任务系统打爆。建议用递增间隔，比如 1 分钟、2 分钟、4 分钟、8 分钟。

## 如何做到不重复

不重复不是一个点解决的，而是一组规则：

| 层级 | 做法 |
| --- | --- |
| 创建任务 | `business_key` 加唯一索引 |
| 领取任务 | MySQL 行锁或原子 `UPDATE` |
| 执行任务 | 业务处理函数要幂等 |
| 外部接口 | 尽量传幂等键、订单号、请求号 |
| 写入结果 | 用唯一索引或状态判断兜底 |

最容易出问题的是：只做了任务锁，但业务处理不幂等。比如第三方接口已经成功了，但本地还没来得及更新状态，请求就断了。下一轮重试时，如果没有业务幂等，就可能重复扣款、重复发货、重复发消息。

## 如何做到不间断

不间断也不是让一个 PHP 请求永远跑，而是让系统可以持续恢复：

| 问题 | 解决方式 |
| --- | --- |
| 某次 HTTP 请求失败 | 下一分钟 `crontab` 继续触发 |
| 任务执行到一半中断 | `locked_until` 过期后重新领取 |
| 第三方接口临时异常 | `next_run_at` 延迟重试 |
| 单次任务太多 | 每次处理固定批次，下一轮继续 |
| 长期失败任务 | 达到 `max_attempts` 后标记 `failed`，人工处理 |

所以正确理解是：**单次请求可以中断，但任务系统不能因为单次中断而整体停掉。**

## HTTP 并发要控制

HTTP 接口虽然方便，但也要注意 PHP-FPM 的处理能力。

建议：

- 每次请求限制处理时间，例如 `45` 秒。
- 每次请求限制处理数量，例如 `20` 条。
- `curl` 设置超时时间。
- 不要把任务接口放到公网随便访问。
- 不要无限增加 `crontab` 并发。
- 大任务拆成小任务，不要一条任务处理几千条数据。

如果任务数量比较多，可以按类型拆接口：

```text
/internal/jobs/run?type=order_sync
/internal/jobs/run?type=message_send
/internal/jobs/run?type=stock_check
```

也可以按业务拆不同任务表，或者把 `type` 加入领取条件。

## 什么时候该上队列

HTTP + `crontab` + MySQL 适合中小任务，但不是万能方案。

下面这些情况建议上队列：

- 每秒都有大量任务进来。
- 任务需要高并发消费。
- 任务处理耗时很长。
- 需要精确控制 worker 数量。
- 需要消息确认、死信队列、延迟队列。
- 任务失败要有完整重放能力。

可选方向：

- Redis 队列。
- RabbitMQ。
- Kafka。
- ThinkPHP Queue。
- Swoole 常驻进程。
- Go worker 服务。

## 常见问题

### HTTP 请求超时会不会导致任务重复

有可能，所以要靠幂等和锁过期机制兜底。

如果任务已经调用了外部接口，但本地还没写成功，下一轮可能会重新执行。这时候业务层必须通过订单号、请求号、幂等键判断是否已经处理过。

### `crontab` 每分钟触发一次会不会太慢

看业务需求。

普通同步任务每分钟一次就够了。如果需要更快，可以在一分钟内用 `sleep 20`、`sleep 40` 分段触发，或者把任务接入队列。

### 可以用 GET 请求吗

不建议。

执行任务属于有副作用的动作，建议使用 POST。即使接口只给 `crontab` 调，也不要养成用 GET 执行写操作的习惯。

### 任务卡在 `processing` 怎么办

看 `locked_until` 是否已经过期。过期后下一轮会重新领取。

如果大量任务都卡住，要排查：

- PHP 是否报错。
- 第三方接口是否超时。
- 数据库连接是否异常。
- `locked_until` 设置是否太长。
- `crontab` 是否还在运行。

### 为什么已经有锁了还要唯一键

锁解决的是“领取时并发处理”的问题，唯一键解决的是“创建任务时重复插入”的问题。两者不是一回事。

### 为什么已经有唯一键了还要幂等

唯一键只能防止任务表里出现重复任务，不能保证外部接口和业务状态不会重复执行。真正稳的任务系统一定要做业务幂等。

## 最小落地清单

上线前至少确认这些点：

- 任务表有 `business_key` 唯一索引。
- 领取任务使用行锁或原子更新。
- 任务有 `locked_until`，异常中断后能恢复。
- 任务有 `attempts`、`max_attempts`、`next_run_at`。
- 业务处理函数具备幂等能力。
- HTTP 接口有 token 或内网限制。
- `crontab` 有超时参数。
- 单次请求有最大时长和最大批次。
- 失败任务可以在后台或数据库中查到原因。

这套方案的核心不是“HTTP 比 CLI 更强”，而是把任务变成可记录、可领取、可重试、可恢复的数据。只要任务状态设计清楚，中小型 ThinkPHP 8 项目就可以比较稳地跑定时轮询任务。
