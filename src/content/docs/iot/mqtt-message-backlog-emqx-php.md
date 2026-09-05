---
title: MQTT 消息积压处理：EMQX + ThinkPHP 8 实战
description: 讲解 MQTT 消息积压的原因、排查思路和处理方案，以 EMQX + ThinkPHP 8 + MySQL 为例，整理 Webhook 入库、ThinkPHP Command 共享订阅、幂等、批处理、失败重试和削峰方案。
---

MQTT 消息积压不是一个单点问题。它通常不是“Broker 不行”，也不是“PHP 不行”，而是**消息进入速度大于消费速度**，或者**离线会话、QoS、订阅方式、数据库写入和业务处理方式没有配合好**。

常见现象：

- EMQX 内存持续升高。
- 设备上报正常，但业务后台数据延迟很大。
- ThinkPHP 接口响应变慢，PHP-FPM 被占满。
- 消费命令重启后突然收到大量旧消息。
- 设备离线后，上线瞬间收到一堆过期指令。
- 数据库写入慢，导致 MQTT 消费速度跟不上。

本文示例按 ThinkPHP 8 项目写法组织：Webhook 进入 Controller，入库和业务处理放 Service，常驻消费使用 ThinkPHP Command。

## 先说结论

用 EMQX + ThinkPHP 8 处理消息，建议按这套思路设计：

```text
设备 -> EMQX -> ThinkPHP 接收层 -> MySQL 消息表 -> ThinkPHP 后台任务处理
```

核心原则：

| 目标 | 做法 |
| --- | --- |
| 不丢重要消息 | QoS、持久化入口、失败重试 |
| 不重复处理 | 消息唯一键、数据库唯一索引、业务幂等 |
| 不把 PHP 拖死 | 接收和业务处理拆开，先入库再异步处理 |
| 能横向扩展 | EMQX 共享订阅、多个 `php think mqtt:worker` |
| 能削峰 | 批量入库、批量处理、限制单次处理数量 |
| 能观察 | 记录消息状态、消费耗时、失败原因和积压数量 |

:::caution[重点]
消息积压不能只靠“加服务器”解决。先确认积压是在 EMQX 会话里、ThinkPHP 接口、ThinkPHP Command、MySQL 写入，还是业务处理逻辑里。
:::

## 常见积压原因

| 原因 | 表现 | 处理方向 |
| --- | --- | --- |
| 消费端太慢 | 消息延迟越来越大 | 增加 worker、批量处理、拆业务 |
| 单个 PHP 进程消费 | 一个进程处理不过来 | 使用共享订阅或 Webhook 接收后异步处理 |
| QoS 1/2 + 持久会话 | 离线后上线收到大量旧消息 | 控制 Session Expiry、离线队列和消息有效期 |
| 订阅 topic 太宽 | 一个消费者收到所有设备数据 | 按业务拆 topic，减少 `#` 通配符 |
| 数据库写入慢 | PHP 卡在 insert/update | 批量写入、索引优化、先写原始表 |
| 业务处理太重 | 消费回调里调用第三方接口 | 消费只做入库，业务异步处理 |
| 消息重复 | QoS 1 重投或客户端重连 | 消息唯一键去重 |
| 过期消息没丢弃 | 旧状态覆盖新状态 | payload 加时间戳，消费端判断有效期 |

## 两种落地方式

### 方式一：EMQX Webhook 推给 ThinkPHP

适合普通 Web 项目。ThinkPHP 不需要长连接 MQTT，只需要提供 HTTP 接口让 EMQX 规则引擎转发消息。

```text
设备发布 MQTT -> EMQX 规则引擎 -> HTTP Webhook -> ThinkPHP 入库 -> 后台任务处理
```

优点：

- 部署简单。
- ThinkPHP 仍然走常见 Web 接口。
- 容易和现有业务系统集成。
- 接收层可以快速返回，避免长时间占用 EMQX 转发链路。

缺点：

- HTTP 接口必须稳定。
- 接口慢会影响转发。
- 高并发时要注意 PHP-FPM 和数据库压力。

### 方式二：ThinkPHP Command 共享订阅

适合能部署常驻进程的项目。

```text
设备发布 MQTT -> EMQX -> 多个 php think mqtt:worker 共享订阅 -> MySQL 入库 -> 后台任务处理
```

共享订阅示例：

```text
$share/tp8-workers/device/+/telemetry
```

多个 worker 订阅同一个共享订阅 topic 后，EMQX 会把消息分发给同组消费者，避免所有 worker 都收到同一条消息。

## 推荐结构：先入库，再处理

无论是 Webhook 还是 ThinkPHP Command，都建议先把消息写入一张原始消息表。

```sql
CREATE TABLE mqtt_messages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  message_key VARCHAR(128) NOT NULL COMMENT '消息唯一键',
  topic VARCHAR(255) NOT NULL,
  client_id VARCHAR(128) DEFAULT NULL,
  qos TINYINT UNSIGNED NOT NULL DEFAULT 0,
  payload JSON NULL,
  payload_hash CHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' COMMENT 'pending, processing, success, failed, ignored',
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  max_attempts INT UNSIGNED NOT NULL DEFAULT 5,
  published_at DATETIME DEFAULT NULL,
  next_run_at DATETIME NOT NULL,
  locked_by VARCHAR(100) DEFAULT NULL,
  locked_until DATETIME DEFAULT NULL,
  last_error TEXT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  finished_at DATETIME DEFAULT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_message_key (message_key),
  KEY idx_status_next_run (status, next_run_at, id),
  KEY idx_lock (status, locked_until),
  KEY idx_topic_created (topic, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

`message_key` 是防重复的关键。不要只用秒级时间戳，也不要用 `updated_at` 这种状态更新时间来判断重复。同一秒内完全可能有很多条正常消息，时间只能辅助排序，不能单独作为唯一键。

推荐按设备侧的稳定编号生成，例如：

```text
device_id + msg_id
device_id + seq
device_id + ts_ms + seq
```

其中 `msg_id` 可以是设备生成的消息编号，`seq` 可以是设备递增序号，`ts_ms` 是毫秒级上报时间。`id` 是数据库自增主键，只能标识消息表里的某一行，不能判断两条 MQTT 消息是不是同一条业务消息。

如果设备完全没有提供 `msg_id`、`seq` 这类稳定字段，接收端不要硬用 `payload_hash + 秒级时间` 去去重，因为这样可能把同一秒内的正常重复值误删。更稳妥的做法是先生成接收侧唯一键保证消息不丢，然后尽快补齐设备协议。

## SQL 要尽量简单

MQTT 消息表可能增长很快，不建议把复杂统计都压在 MySQL 大表上。

建议：

- 消费领取只按 `status`、`next_run_at`、`id` 走索引。
- 不在领取 SQL 里写复杂 `OR`、子查询、视图、聚合函数。
- 不在大表上频繁执行 `COUNT(*)`、`GROUP BY`、`MIN()`、`TIMESTAMPDIFF()`。
- 积压数量可以用 Redis 计数、监控系统或单独指标表记录。
- MySQL 负责可靠状态流转，Redis/Predis 可以负责限流、去重、轻量队列和计数。

本文后面的领取逻辑会先恢复过期 `processing`，再只领取 `pending` 消息，避免把条件写得很复杂。

## 设备消息格式建议

设备上报不要只传一个值，至少带上设备 ID、消息 ID 和时间戳。

```json
{
  "msg_id": "00000001",
  "seq": 1,
  "device_id": "esp32-001",
  "ts": "2026-05-28T12:00:00+08:00",
  "ts_ms": 1780000000123,
  "type": "telemetry",
  "data": {
    "temperature": 26.3,
    "humidity": 61.5
  }
}
```

这样 ThinkPHP 可以判断：

- 这条消息是否已经处理过。
- 是否是过期数据。
- 设备时间是否异常。
- 同一设备消息顺序是否错乱。

## ThinkPHP 8 配置

`config/mqtt.php`：

```php
<?php

return [
    'webhook_token' => env('mqtt.webhook_token', 'change_me'),
    'host' => env('mqtt.host', '127.0.0.1'),
    'port' => (int) env('mqtt.port', 1883),
    'username' => env('mqtt.username', ''),
    'password' => env('mqtt.password', ''),
    'worker_group' => env('mqtt.worker_group', 'tp8-workers'),
    'lock_minutes' => 5,
    'recover_limit' => 200,
];
```

`.env`：

```text
MQTT_WEBHOOK_TOKEN=change_me_to_long_random_string
MQTT_HOST=127.0.0.1
MQTT_PORT=1883
MQTT_USERNAME=worker
MQTT_PASSWORD=password
MQTT_WORKER_GROUP=tp8-workers
```

## 可选：Predis 做去重和计数

Redis 不应该替代 MySQL 的最终状态，但很适合做入口削峰、短期去重和指标计数。

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

$dedupeKey = 'mqtt:dedupe:' . $messageKey;
$isNew = $redis->set($dedupeKey, '1', 'EX', 86400, 'NX');

if (!$isNew) {
    return;
}

$redis->incr('metric:mqtt:pending');
```

Redis 去重只能作为加速层，MySQL 里的 `message_key` 唯一索引仍然要保留。因为 Redis 可能重启、过期或被清理，最终兜底仍然要靠数据库唯一键和业务幂等。

## 方案一：EMQX Webhook 到 ThinkPHP

EMQX 规则引擎可以把指定 topic 的消息转发到 HTTP 服务。ThinkPHP 接口只做三件事：

1. 校验签名或 token。
2. 解析 topic 和 payload。
3. 幂等入库后快速返回。

`route/app.php`：

```php
<?php

use think\facade\Route;

Route::post('internal/mqtt/ingest', 'internal.Mqtt/ingest');
```

`app/controller/internal/Mqtt.php`：

```php
<?php

declare(strict_types=1);

namespace app\controller\internal;

use app\service\MqttMessageService;
use think\Request;
use think\Response;
use Throwable;

class Mqtt
{
    public function ingest(Request $request, MqttMessageService $service): Response
    {
        if ($request->header('x-mqtt-token') !== config('mqtt.webhook_token')) {
            return json(['message' => 'forbidden'], 403);
        }

        try {
            $service->saveFromWebhook($request->param());
        } catch (Throwable $e) {
            return json([
                'ok' => false,
                'message' => $e->getMessage(),
            ], 500);
        }

        return json(['ok' => true]);
    }
}
```

:::caution[接口要快]
Webhook 接口不要直接调用第三方接口、不要做复杂统计、不要发模板消息。先入库，快速返回，真正业务处理交给后台任务。
:::

## Service：消息入库

`app/service/MqttMessageService.php`：

```php
<?php

declare(strict_types=1);

namespace app\service;

use DateTimeImmutable;
use RuntimeException;
use think\facade\Db;
use Throwable;

class MqttMessageService
{
    public function saveFromWebhook(array $body): void
    {
        $topic = (string) ($body['topic'] ?? '');
        $clientId = (string) ($body['clientid'] ?? '');
        $qos = (int) ($body['qos'] ?? 0);
        $payloadRaw = (string) ($body['payload'] ?? '{}');
        $payload = json_decode($payloadRaw, true, 512, JSON_THROW_ON_ERROR);

        $this->saveRawMessage($topic, $payloadRaw, $payload, $clientId, $qos);
    }

    public function saveRawMessage(
        string $topic,
        string $payloadRaw,
        array $payload,
        string $clientId = '',
        int $qos = 1
    ): void {
        $now = date('Y-m-d H:i:s');
        $messageKey = $this->buildMessageKey($topic, $payload, $clientId);
        $publishedAt = $this->parsePublishedAt($payload['ts'] ?? null);

        try {
            Db::table('mqtt_messages')->insert([
                'message_key' => $messageKey,
                'topic' => $topic,
                'client_id' => $clientId,
                'qos' => $qos,
                'payload' => json_encode($payload, JSON_UNESCAPED_UNICODE),
                'payload_hash' => hash('sha256', $payloadRaw),
                'status' => 'pending',
                'published_at' => $publishedAt,
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

    private function buildMessageKey(string $topic, array $payload, string $clientId): string
    {
        $deviceId = (string) ($payload['device_id'] ?? $clientId);

        if (!empty($payload['msg_id'])) {
            return $this->joinMessageKey($deviceId, (string) $payload['msg_id']);
        }

        if ($deviceId !== '' && isset($payload['seq'])) {
            return $this->joinMessageKey($deviceId, (string) $payload['seq']);
        }

        // 没有设备侧稳定编号时，先保证消息不被误删，后续应补齐设备协议。
        return 'receive:' . hash('sha256', $topic . '|' . $clientId . '|' . uniqid('', true));
    }

    private function joinMessageKey(string $deviceId, string $value): string
    {
        if ($deviceId === '') {
            return $value;
        }

        return $deviceId . ':' . $value;
    }

    private function parsePublishedAt(?string $time): ?string
    {
        if (!$time) {
            return null;
        }

        try {
            return (new DateTimeImmutable($time))->format('Y-m-d H:i:s');
        } catch (Throwable $e) {
            return null;
        }
    }

    private function isDuplicateKey(Throwable $e): bool
    {
        return str_contains($e->getMessage(), 'Duplicate entry')
            || str_contains($e->getMessage(), '1062');
    }
}
```

## 恢复过期消息

后台处理可以沿用 HTTP 轮询任务文章里的思路：HTTP + `crontab` 或 ThinkPHP Command 都可以。

领取之前，先恢复锁超时的 `processing` 消息。这一步只按 `status + locked_until` 索引走。

```php
public function recoverExpired(): void
{
    $now = date('Y-m-d H:i:s');

    Db::table('mqtt_messages')
        ->where('status', 'processing')
        ->where('locked_until', '<', $now)
        ->limit((int) config('mqtt.recover_limit'))
        ->update([
            'status' => 'pending',
            'locked_by' => null,
            'locked_until' => null,
            'updated_at' => $now,
        ]);
}
```

## 领取消息

恢复过期消息后，领取逻辑只查 `pending`，不把 `processing` 恢复条件混在同一条 SQL 里。

```php
public function claim(string $workerId): ?array
{
    return Db::transaction(function () use ($workerId) {
        $now = date('Y-m-d H:i:s');

        $message = Db::table('mqtt_messages')
            ->where('status', 'pending')
            ->where('next_run_at', '<=', $now)
            ->order('id', 'asc')
            ->lock(true)
            ->find();

        if (!$message) {
            return null;
        }

        Db::table('mqtt_messages')
            ->where('id', $message['id'])
            ->inc('attempts')
            ->update([
                'status' => 'processing',
                'locked_by' => $workerId,
                'locked_until' => date('Y-m-d H:i:s', time() + ((int) config('mqtt.lock_minutes') * 60)),
                'updated_at' => $now,
            ]);

        return $message;
    });
}
```

处理业务时要注意过期消息：

```php
public function handle(array $message): void
{
    $payload = json_decode($message['payload'] ?: '{}', true, 512, JSON_THROW_ON_ERROR);

    if ($this->isExpired($payload['ts'] ?? null)) {
        $this->markIgnored((int) $message['id'], 'expired message');
        return;
    }

    if ($this->topicEndsWith($message['topic'], '/telemetry')) {
        $this->saveTelemetry($payload);
        $this->markSuccess((int) $message['id']);
        return;
    }

    if ($this->topicEndsWith($message['topic'], '/event')) {
        $this->saveDeviceEvent($payload, (string) $message['message_key']);
        $this->markSuccess((int) $message['id']);
        return;
    }

    $this->markIgnored((int) $message['id'], 'unknown topic');
}

private function saveTelemetry(array $payload): void
{
    Db::table('device_telemetry')->insert([
        'device_id' => $payload['device_id'] ?? '',
        'temperature' => $payload['data']['temperature'] ?? null,
        'humidity' => $payload['data']['humidity'] ?? null,
        'reported_at' => $this->parsePublishedAt($payload['ts'] ?? null),
        'created_at' => date('Y-m-d H:i:s'),
    ]);
}

private function saveDeviceEvent(array $payload, string $messageKey): void
{
    Db::table('device_events')->insert([
        'message_key' => $messageKey,
        'device_id' => $payload['device_id'] ?? '',
        'event_type' => $payload['type'] ?? 'event',
        'payload' => json_encode($payload, JSON_UNESCAPED_UNICODE),
        'created_at' => date('Y-m-d H:i:s'),
    ]);
}

private function isExpired(?string $time): bool
{
    if (!$time) {
        return false;
    }

    try {
        $messageTime = new DateTimeImmutable($time);
    } catch (Throwable $e) {
        return false;
    }

    return $messageTime < new DateTimeImmutable('-10 minutes');
}

private function topicEndsWith(string $topic, string $suffix): bool
{
    return substr($topic, -strlen($suffix)) === $suffix;
}
```

状态更新：

```php
public function markSuccess(int $id): void
{
    Db::table('mqtt_messages')
        ->where('id', $id)
        ->update([
            'status' => 'success',
            'locked_by' => null,
            'locked_until' => null,
            'last_error' => null,
            'finished_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
}

public function markIgnored(int $id, string $reason): void
{
    Db::table('mqtt_messages')
        ->where('id', $id)
        ->update([
            'status' => 'ignored',
            'locked_by' => null,
            'locked_until' => null,
            'last_error' => $reason,
            'finished_at' => date('Y-m-d H:i:s'),
            'updated_at' => date('Y-m-d H:i:s'),
        ]);
}

public function markRetryOrFailed(array $message, Throwable $e): void
{
    $attempts = (int) $message['attempts'] + 1;
    $maxAttempts = (int) $message['max_attempts'];
    $delaySeconds = min(3600, 30 * (2 ** min($attempts, 6)));
    $status = $attempts >= $maxAttempts ? 'failed' : 'pending';
    $now = time();

    Db::table('mqtt_messages')
        ->where('id', $message['id'])
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

## 方案二：ThinkPHP Command 共享订阅

如果你可以部署常驻进程，可以让多个 ThinkPHP Command 直接订阅 EMQX。

安装 MQTT 客户端库：

```sh
composer require php-mqtt/client
```

注册命令，`config/console.php`：

```php
<?php

return [
    'commands' => [
        'mqtt:worker' => \app\command\MqttWorker::class,
    ],
];
```

`app/command/MqttWorker.php`：

```php
<?php

declare(strict_types=1);

namespace app\command;

use app\service\MqttMessageService;
use PhpMqtt\Client\ConnectionSettings;
use PhpMqtt\Client\MqttClient;
use think\console\Command;
use think\console\Input;
use think\console\Output;
use Throwable;

class MqttWorker extends Command
{
    protected function configure(): void
    {
        $this->setName('mqtt:worker')
            ->setDescription('Consume MQTT messages from EMQX');
    }

    protected function execute(Input $input, Output $output): int
    {
        $clientId = 'tp8-worker-' . getmypid();
        $server = (string) config('mqtt.host');
        $port = (int) config('mqtt.port');
        $group = (string) config('mqtt.worker_group');

        $mqtt = new MqttClient($server, $port, $clientId);
        $settings = (new ConnectionSettings())
            ->setUsername((string) config('mqtt.username'))
            ->setPassword((string) config('mqtt.password'))
            ->setKeepAliveInterval(30);

        $mqtt->connect($settings, true);

        /** @var MqttMessageService $service */
        $service = app(MqttMessageService::class);
        $topic = '$share/' . $group . '/device/+/telemetry';

        $mqtt->subscribe($topic, function (string $topic, string $message) use ($service, $output): void {
            try {
                $payload = json_decode($message, true, 512, JSON_THROW_ON_ERROR);
                $service->saveRawMessage($topic, $message, $payload);
            } catch (Throwable $e) {
                $output->writeln('[mqtt] ' . $e->getMessage());
            }
        }, 1);

        $output->writeln('MQTT worker started: ' . $clientId);
        $mqtt->loop(true);

        return self::SUCCESS;
    }
}
```

启动多个 worker：

```sh
php think mqtt:worker
php think mqtt:worker
php think mqtt:worker
```

生产环境要用 `Supervisor`、`systemd` 或容器编排管理 worker，避免进程退出后没人拉起。

## Topic 拆分建议

不要让一个订阅处理所有消息。

不推荐：

```text
device/#
```

更推荐：

```text
device/+/telemetry
device/+/event
device/+/status
device/+/command_reply
```

不同类型消息可以进入不同处理链路：

| Topic | 处理方式 |
| --- | --- |
| `device/+/telemetry` | 高频数据，批量写入，允许丢弃过期消息 |
| `device/+/event` | 设备事件，QoS 1，必须去重 |
| `device/+/status` | 设备在线状态，可用 retained message |
| `device/+/command_reply` | 指令响应，需要关联指令 ID |

## QoS 和离线消息

QoS 不是越高越好。

| 场景 | 建议 |
| --- | --- |
| 温度、电压、位置等高频遥测 | QoS 0 或 QoS 1，消费端丢弃过期数据 |
| 报警、故障、订单、支付类事件 | QoS 1，并做业务去重 |
| 强一致指令 | QoS 1 或 QoS 2，但要控制并发和超时 |
| 在线状态 | retained message + Last Will |

对于离线设备：

- 不要给高频遥测长期保留离线队列。
- 指令消息要设置有效期，过期不要继续执行。
- 持久会话要配合 Session Expiry，不要无限堆积。
- 设备上线后先同步最新状态，不要盲目执行所有旧消息。

## 如何确认积压在哪里

先按链路分段排查：

```text
设备发布速度 -> EMQX 接收速度 -> EMQX 转发速度 -> ThinkPHP 接收速度 -> MySQL 写入速度 -> 业务处理速度
```

检查项：

| 位置 | 看什么 |
| --- | --- |
| 设备 | 上报频率、payload 大小、是否重连重发 |
| EMQX | 连接数、消息速率、会话数、离线队列、规则引擎执行情况 |
| ThinkPHP HTTP | 响应时间、状态码、PHP-FPM 进程数、错误日志 |
| ThinkPHP Command | worker 数量、单条处理耗时、异常退出次数 |
| MySQL | 慢查询、锁等待、表索引、磁盘 IO |
| 业务处理 | 是否调用第三方接口、是否逐条写库、是否重复计算 |

查看当前是否有积压，尽量用简单查询，不要在大表上频繁聚合。

查看前 100 条待处理消息：

```sql
SELECT id, topic, message_key, created_at
FROM mqtt_messages
WHERE status = 'pending'
ORDER BY id ASC
LIMIT 100;
```

查看最老的一条待处理消息：

```sql
SELECT id, topic, message_key, created_at
FROM mqtt_messages
WHERE status = 'pending'
ORDER BY id ASC
LIMIT 1;
```

处理延迟可以拿最老一条的 `created_at`，在 PHP 或监控系统里计算，不建议在消息大表里频繁执行时间差聚合。

如果确实需要统计积压数量，更推荐在状态变化时维护 Redis 计数或单独指标表，例如：

```php
$redis->incr('metric:mqtt:pending');
$redis->decr('metric:mqtt:pending');
```

单独指标表也可以很简单：

```sql
SELECT metric_key, metric_value
FROM mqtt_metrics
WHERE metric_key = 'pending_total'
LIMIT 1;
```

## 消息积压后的处理步骤

### 1. 先止血

- 降低设备上报频率。
- 暂停非关键 topic。
- 临时增加 `php think mqtt:worker` 数量。
- 暂停耗时业务，只保留入库。
- 对明显过期的遥测数据标记为 `ignored`。

### 2. 再定位瓶颈

- 如果 EMQX 积压，检查离线会话、QoS、规则引擎和订阅者。
- 如果 ThinkPHP 接口慢，检查 PHP-FPM、Nginx、应用日志。
- 如果 MySQL 慢，检查索引、慢查询和磁盘 IO。
- 如果业务慢，把业务处理拆成异步任务。

### 3. 最后优化结构

- 高频数据批量写入。
- 事件数据幂等处理。
- 旧遥测数据过期丢弃。
- 不同 topic 分不同消费组。
- 重要消息和普通消息拆开。
- 用监控记录积压数量和最老消息时间。

## 常见错误设计

### 消费回调里直接做复杂业务

错误：

```text
收到 MQTT -> 调第三方接口 -> 查数据库 -> 发短信 -> 更新统计 -> ACK
```

更稳：

```text
收到 MQTT -> 幂等入库 -> ACK -> 后台任务慢慢处理
```

### 所有设备共用一个 Client ID

Client ID 冲突会导致连接互相踢下线，表现为设备频繁断开、消息重复或收不到消息。

每个设备必须使用稳定且唯一的 Client ID。

### 高频数据用 retained message

Retain 适合保存最后状态，不适合保存每条遥测数据。

高频遥测使用 retained message 可能导致新订阅者收到旧数据，引发误判。

### 订阅 `#` 后什么都处理

`#` 很方便，但生产环境里容易把所有消息都压到一个消费者上。

应该按业务拆 topic，并用共享订阅分散压力。

## 什么时候要上更强的架构

如果消息量继续增大，建议引入专门的数据通道：

- EMQX 规则引擎转发到 Kafka。
- EMQX 数据桥接到 Redis Stream。
- ThinkPHP 只处理业务事件，高频遥测进入时序数据库。
- 设备遥测进入 InfluxDB，业务事件进入 MySQL。
- 用 Go、Java 或 Node.js 写专门消费服务。

ThinkPHP 8 可以处理不少业务场景，但不适合把所有高频实时流都压在 PHP-FPM 请求里。对于高频、大量、低延迟消息，要把接收、存储、计算和业务动作拆开。

## 最小落地清单

上线前至少确认：

- 设备消息里有 `device_id`，并且有 `msg_id` 或 `seq`。
- 不用秒级时间戳、`updated_at`、数据库自增 `id` 做消息去重。
- ThinkPHP 入库表有 `message_key` 唯一索引。
- EMQX topic 按业务拆分，不滥用 `#`。
- 高频遥测可以丢弃过期消息。
- 事件消息必须幂等处理。
- Webhook 接口只做轻量入库。
- ThinkPHP Command 使用共享订阅扩展消费能力。
- MySQL 查询保持简单，积压计数用 Redis 或单独指标表。
- 失败消息有 `attempts`、`next_run_at`、`last_error`。
- 有监控能看到 pending 数量和最老消息时间。

解决 MQTT 消息积压的关键不是某一个参数，而是整条链路都要能承压：EMQX 负责稳定接收和路由，ThinkPHP 负责快速落库和业务处理，MySQL 负责状态、幂等和可恢复。只要入口快、处理可重试、消息可去重，积压就能被定位和逐步消化。
