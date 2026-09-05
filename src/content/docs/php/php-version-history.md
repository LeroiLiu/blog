---
title: PHP 5 到 PHP 8.5 版本升级变化
description: 从 PHP 5.0 到 PHP 8.5 的版本升级变化、语法示例、兼容注意事项和老项目升级路线。
---

这篇整理 PHP 从 5.0 到 8.5 的主要变化。它更适合在维护老项目、判断升级风险、阅读旧代码时快速对照。

截至 2026-05-29，PHP 官方仍在支持的分支是 `8.2`、`8.3`、`8.4`、`8.5`。其中 `8.5` 是当前最新稳定分支。PHP 5、PHP 7.0 到 7.4、PHP 8.0 到 8.1 都已经不适合作为新项目运行环境。

## 版本速览

| 版本 | 核心变化 | 维护时要注意 |
| --- | --- | --- |
| PHP 5.0 | Zend Engine 2、对象模型重写、访问控制、接口、抽象类、异常、构造析构方法 | 很老的项目可能还保留 PHP 4 风格构造函数 |
| PHP 5.1 | PDO 默认启用、日期时间处理重写、性能提升 | 数据库访问开始可以统一走 PDO |
| PHP 5.2 | JSON、Filter、Zip、DateTime、内存管理改进 | `json_encode()`、`filter_input()` 开始更常见 |
| PHP 5.3 | 命名空间、闭包、后期静态绑定、nowdoc、三元简写、`__callStatic()` | 现代框架雏形开始出现 |
| PHP 5.4 | 短数组、Trait、内置 Web Server、数组解引用、移除 `register_globals`、`magic_quotes`、`safe_mode` | 老代码里依赖魔术引号会出问题 |
| PHP 5.5 | Generator、`finally`、`password_hash()`、`ClassName::class`、`empty()` 支持表达式、OPcache | 密码存储应逐步迁移到 `password_hash()` |
| PHP 5.6 | 可变参数、参数解包、常量表达式、函数与常量导入、`hash_equals()`、`phpdbg` | HTTPS 证书校验更严格，旧接口可能暴露证书问题 |
| PHP 7.0 | 标量类型、返回值类型、`??`、`<=>`、匿名类、`Throwable`、性能大幅提升 | `mysql_*` 扩展被移除，要迁移到 PDO 或 MySQLi |
| PHP 7.1 | 可空类型、`void`、`iterable`、多异常捕获、数组解构增强 | 接口签名开始更严格 |
| PHP 7.2 | `object` 类型、Sodium 成为核心扩展、参数类型放宽 | `count()` 非数组参数会出现警告 |
| PHP 7.3 | heredoc/nowdoc 语法更灵活、函数调用尾逗号、`is_countable()`、`array_key_first()` | 兼容旧代码时可以先用 `is_countable()` 包一层 |
| PHP 7.4 | 类型属性、箭头函数、`??=`、数组展开、OPcache 预加载、弱引用 | 属性必须先初始化，未初始化就读取会报错 |
| PHP 8.0 | 命名参数、Attribute、构造器属性提升、联合类型、`match`、空安全操作符、JIT | 许多 warning 变成异常，老代码要重点测错误处理 |
| PHP 8.1 | Enum、只读属性、Fiber、交叉类型、一等 callable、`never` | 枚举适合替换一堆状态常量 |
| PHP 8.2 | 只读类、DNF 类型、`true/false/null` 独立类型、动态属性弃用 | 动态给对象塞属性会触发弃用警告 |
| PHP 8.3 | 类型化类常量、`#[Override]`、动态类常量获取、`json_validate()`、只读属性克隆改进 | 适合加强继承检查和 JSON 校验 |
| PHP 8.4 | 属性钩子、非对称属性可见性、更新后的 DOM API、Lazy Object、`new` 后可直接链式调用 | DTO、值对象、ORM 懒加载会更好写 |
| PHP 8.5 | URI 扩展、管道操作符、`clone()` 修改属性、`#[NoDiscard]`、常量表达式支持闭包、一批数组和 cURL 改进 | 新语法很方便，但要确认服务器、框架和扩展是否跟上 |

## PHP 5：现代 PHP 的起点

PHP 5 的重点是对象模型升级。今天的类、接口、抽象类、异常处理，大量基础都从这个阶段稳定下来。

### PHP 5.0：对象模型变化

```php
<?php

interface Logger
{
    public function info($message);
}

abstract class Service
{
    protected $logger;

    public function __construct(Logger $logger)
    {
        $this->logger = $logger;
    }

    abstract public function handle();
}
```

这类写法在今天看起来很普通，但在 PHP 5 之前，对象模型没有这么完整。维护非常老的代码时，可能会看到这种 PHP 4 风格构造函数：

```php
<?php

class UserService
{
    public function UserService()
    {
        // 老式构造函数，不建议继续使用
    }
}
```

新代码统一写成 `__construct()`。

### PHP 5.1 到 5.2：PDO、JSON、过滤器

PDO 让数据库访问更统一，JSON 扩展成为接口开发里的基础能力。

```php
<?php

$pdo = new PDO(
    'mysql:host=127.0.0.1;dbname=demo;charset=utf8mb4',
    'root',
    'secret'
);

$stmt = $pdo->prepare('select id, name from users where id = ?');
$stmt->execute([1]);

echo json_encode($stmt->fetch(PDO::FETCH_ASSOC), JSON_UNESCAPED_UNICODE);
```

输入过滤可以先做基础清洗，但不要把它当成完整的业务校验。

```php
<?php

$email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);

if ($email === false || $email === null) {
    exit('邮箱格式不正确');
}
```

### PHP 5.3：命名空间与闭包

命名空间解决类名冲突，闭包让回调和集合处理更自然。

```php
<?php

namespace App\Service;

class OrderService
{
    public function paidOrders(array $orders)
    {
        return array_filter($orders, function (array $order) {
            return $order['status'] === 'paid';
        });
    }
}
```

后期静态绑定让继承里的静态调用更符合直觉。

```php
<?php

class Model
{
    public static function table()
    {
        return get_called_class();
    }
}

class User extends Model
{
}

echo User::table();
```

### PHP 5.4：短数组与 Trait

短数组让配置和数据结构更清爽。

```php
<?php

$config = [
    'debug' => true,
    'timezone' => 'Asia/Shanghai',
];
```

Trait 常用于复用一小段横向能力，但不要把它当成继承体系乱混。

```php
<?php

trait HasTimestamps
{
    public function now()
    {
        return date('Y-m-d H:i:s');
    }
}

class Article
{
    use HasTimestamps;
}
```

内置开发服务器也从这个阶段开始方便本地临时调试：

```bash
php -S 127.0.0.1:8000 -t public
```

### PHP 5.5：Generator、finally、密码哈希

Generator 适合处理大列表，避免一次性把所有数据塞进内存。

```php
<?php

function readLines($file)
{
    $handle = fopen($file, 'r');

    try {
        while (($line = fgets($handle)) !== false) {
            yield trim($line);
        }
    } finally {
        fclose($handle);
    }
}

foreach (readLines(__DIR__ . '/access.log') as $line) {
    echo $line . PHP_EOL;
}
```

密码不应该再自己拼盐做 `md5()`。

```php
<?php

$hash = password_hash('123456', PASSWORD_DEFAULT);

if (password_verify('123456', $hash)) {
    echo '登录成功';
}
```

### PHP 5.6：可变参数与参数解包

以前写不定参数通常要用 `func_get_args()`，PHP 5.6 开始可以直接写 `...`。

```php
<?php

function sum(...$numbers)
{
    return array_sum($numbers);
}

echo sum(1, 2, 3);
```

数组也可以解包到参数里。

```php
<?php

function makeUrl($scheme, $host, $path)
{
    return $scheme . '://' . $host . '/' . ltrim($path, '/');
}

$args = ['https', 'example.com', 'api/users'];

echo makeUrl(...$args);
```

安全比较可以使用 `hash_equals()`，避免签名比较里的时序攻击问题。

```php
<?php

$expected = hash_hmac('sha256', $payload, $secret);

if (!hash_equals($expected, $signature)) {
    exit('签名错误');
}
```

## PHP 7：性能与类型系统升级

PHP 7 最大的感受是性能提升明显，语法也开始强调类型声明。

### PHP 7.0：标量类型、返回值、`??`、`<=>`

```php
<?php

declare(strict_types=1);

function total(int $price, int $count): int
{
    return $price * $count;
}

echo total(20, 3);
```

`??` 很适合处理请求参数和默认值。

```php
<?php

$page = $_GET['page'] ?? 1;
$keyword = trim($_GET['keyword'] ?? '');
```

`<=>` 常用于排序。

```php
<?php

usort($users, function (array $a, array $b) {
    return $a['created_at'] <=> $b['created_at'];
});
```

PHP 7.0 也是很多老项目升级时最容易卡住的版本，因为 `mysql_*` 扩展已经移除。

```php
<?php

// 旧写法：PHP 7 不再支持
// mysql_query('select * from users');

// 新写法：改用 PDO 或 MySQLi
$stmt = $pdo->query('select id, name from users');
```

### PHP 7.1：可空类型、`void`、多异常捕获

```php
<?php

function findUser(int $id): ?array
{
    return $id > 0 ? ['id' => $id, 'name' => 'Leroi'] : null;
}

function writeLog(string $message): void
{
    error_log($message);
}
```

多个异常可以合并捕获。

```php
<?php

try {
    $service->handle();
} catch (InvalidArgumentException | RuntimeException $e) {
    report($e);
}
```

### PHP 7.2 到 7.3：`object`、Sodium、数组辅助函数

PHP 7.2 增加 `object` 类型，适合约束必须传对象。

```php
<?php

function touchModel(object $model): object
{
    $model->updated_at = date('Y-m-d H:i:s');

    return $model;
}
```

PHP 7.3 增加 `array_key_first()`、`array_key_last()` 和 `is_countable()`，处理数组边界更舒服。

```php
<?php

if (is_countable($items) && count($items) > 0) {
    $firstKey = array_key_first($items);
    $lastKey = array_key_last($items);
}
```

### PHP 7.4：类型属性、箭头函数、`??=`

类型属性可以把 DTO 写得更清楚。

```php
<?php

class UserData
{
    public int $id;
    public string $name;
    public ?string $mobile = null;
}
```

箭头函数适合短回调。

```php
<?php

$names = array_map(
    fn (array $user) => $user['name'],
    $users
);
```

`??=` 很适合补默认配置。

```php
<?php

$config['timeout'] ??= 5;
$config['retry'] ??= 3;
```

需要注意：类型属性未初始化就读取会报错。

```php
<?php

class Task
{
    public string $name;
}

$task = new Task();

// Fatal error: Typed property Task::$name must not be accessed before initialization
// echo $task->name;
```

## PHP 8：语法现代化与强约束

PHP 8 更像现代语言：类型更强、对象写法更简洁、错误更明确。

### PHP 8.0：命名参数、Attribute、构造器属性提升

命名参数可以减少一长串可选参数的阅读成本。

```php
<?php

echo htmlspecialchars(
    string: $content,
    flags: ENT_QUOTES,
    encoding: 'UTF-8',
    double_encode: false
);
```

Attribute 可以替代一部分注解写法。

```php
<?php

class UserController
{
    #[Route('/api/users/{id}', methods: ['GET'])]
    public function show(int $id): array
    {
        return $this->userService->find($id);
    }
}
```

构造器属性提升让值对象更短。

```php
<?php

class Point
{
    public function __construct(
        public float $x,
        public float $y,
        public float $z = 0.0,
    ) {
    }
}
```

`match` 比 `switch` 更严格，也会返回值。

```php
<?php

$label = match ($status) {
    0 => '待支付',
    1 => '已支付',
    2 => '已取消',
    default => '未知状态',
};
```

空安全操作符适合处理可能为空的对象链。

```php
<?php

$city = $order->user?->profile?->city ?? '未知';
```

### PHP 8.1：Enum 与 readonly

状态常量可以逐步迁移成 Enum。

```php
<?php

enum OrderStatus: string
{
    case Pending = 'pending';
    case Paid = 'paid';
    case Closed = 'closed';
}

function canRefund(OrderStatus $status): bool
{
    return $status === OrderStatus::Paid;
}
```

只读属性适合值对象、配置对象和查询结果对象。

```php
<?php

class Config
{
    public function __construct(
        public readonly string $appName,
        public readonly string $env,
    ) {
    }
}
```

### PHP 8.2：只读类与动态属性弃用

只读类可以减少重复写 `readonly`。

```php
<?php

readonly class UserSnapshot
{
    public function __construct(
        public int $id,
        public string $name,
    ) {
    }
}
```

动态属性弃用是老项目升级 PHP 8.2 时常见问题。

```php
<?php

class User
{
    public string $name = '';
}

$user = new User();

// Deprecated: Creation of dynamic property User::$age is deprecated
$user->age = 18;
```

应改成显式声明属性，或者用数组保存动态字段。

```php
<?php

class User
{
    public string $name = '';
    public int $age = 0;
}
```

### PHP 8.3：类型化类常量、`#[Override]`、JSON 校验

类型化类常量能避免子类或实现类把常量改成奇怪类型。

```php
<?php

interface ApiVersion
{
    public const string VERSION = 'v1';
}
```

`#[Override]` 可以帮你发现方法名写错。

```php
<?php

class BaseController
{
    public function boot(): void
    {
    }
}

class UserController extends BaseController
{
    #[Override]
    public function boot(): void
    {
        parent::boot();
    }
}
```

`json_validate()` 适合只判断 JSON 是否合法，不需要马上解码。

```php
<?php

if (!json_validate($rawBody)) {
    http_response_code(400);
    exit('JSON 格式错误');
}
```

### PHP 8.4：属性钩子与非对称可见性

属性钩子可以把简单 getter/setter 合并到属性声明里。

```php
<?php

class UserName
{
    public string $name {
        set => trim($value);
    }
}

$user = new UserName();
$user->name = ' Leroi ';

echo $user->name;
```

非对称可见性适合“外部可读，内部或构造阶段可写”的模型。

```php
<?php

class Article
{
    public private(set) string $title;

    public function __construct(string $title)
    {
        $this->title = $title;
    }
}
```

`new` 后直接链式调用也更自然。

```php
<?php

$date = new DateTimeImmutable('now')->format('Y-m-d');
```

### PHP 8.5：URI、管道操作符与 clone with

PHP 8.5 新增 URI 扩展，适合更标准地处理 URL。

```php
<?php

use Uri\Rfc3986\Uri;

$uri = new Uri('https://example.com/docs/php?page=1');

echo $uri->getHost();
```

管道操作符让一串转换按从上到下的顺序阅读。

```php
<?php

$slug = ' PHP 8.5 Released '
    |> trim(...)
    |> (fn (string $value) => str_replace(' ', '-', $value))
    |> strtolower(...);

echo $slug;
```

`clone()` 支持克隆时修改属性，对只读对象的“改一个字段生成新对象”很有用。

```php
<?php

readonly class Color
{
    public function __construct(
        public int $red,
        public int $green,
        public int $blue,
        public int $alpha = 255,
    ) {
    }

    public function withAlpha(int $alpha): self
    {
        return clone($this, [
            'alpha' => $alpha,
        ]);
    }
}
```

`#[NoDiscard]` 可以提醒调用方不要忽略重要返回值。

```php
<?php

#[\NoDiscard]
function createToken(int $userId): string
{
    return bin2hex(random_bytes(16));
}

createToken(1);
```

## 老项目升级路线

不要从 PHP 5.3、5.4 直接盲跳到 PHP 8.5。更稳的做法是先清点依赖，再分阶段处理兼容问题。

### 1. 先确认当前运行环境

```bash
php -v
php -m
php --ini
composer --version
```

### 2. 固定 Composer 平台版本

本地开发和服务器版本不一致时，先在 `composer.json` 里明确平台版本，避免装到线上跑不了的包。

```json
{
  "config": {
    "platform": {
      "php": "8.2.0"
    }
  }
}
```

检查依赖为什么不能升级：

```bash
composer why-not php 8.2
composer outdated
```

### 3. 优先处理高风险旧写法

| 旧写法 | 问题 | 建议 |
| --- | --- | --- |
| `mysql_query()` | PHP 7 已移除 | 改 PDO 或 MySQLi |
| 动态属性 | PHP 8.2 起弃用 | 显式声明属性或使用数组 |
| 魔术引号相关逻辑 | PHP 5.4 已移除 | 删除兼容代码，统一输入过滤 |
| 老式构造函数 | PHP 7/8 迁移容易混乱 | 统一改 `__construct()` |
| 依赖 warning 的流程 | PHP 8 很多错误更严格 | 用异常和显式判断改写 |
| 未初始化类型属性 | PHP 7.4 起会报错 | 给默认值或在构造函数初始化 |

### 4. 一段旧代码的升级示例

老写法：

```php
<?php

$id = intval($_GET['id']);
$sql = "select * from users where id = {$id}";
$result = mysql_query($sql);
$user = mysql_fetch_assoc($result);

echo json_encode($user);
```

较新的写法：

```php
<?php

$id = (int) ($_GET['id'] ?? 0);

$stmt = $pdo->prepare('select id, name, mobile from users where id = ? limit 1');
$stmt->execute([$id]);

$user = $stmt->fetch(PDO::FETCH_ASSOC);

header('Content-Type: application/json; charset=utf-8');
echo json_encode($user ?: [], JSON_UNESCAPED_UNICODE);
```

再进一步，可以把输入、查询和输出拆开，后续迁移框架也更容易。

```php
<?php

function findUser(PDO $pdo, int $id): ?array
{
    $stmt = $pdo->prepare('select id, name, mobile from users where id = ? limit 1');
    $stmt->execute([$id]);

    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    return $user === false ? null : $user;
}

$id = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
$user = $id ? findUser($pdo, $id) : null;

header('Content-Type: application/json; charset=utf-8');
echo json_encode($user ?? [], JSON_UNESCAPED_UNICODE);
```

## 新项目怎么选版本

| 场景 | 建议 |
| --- | --- |
| 全新项目 | 优先选官方仍在支持的较新版本，并确认框架、扩展、服务器镜像都支持 |
| ThinkPHP 8 项目 | 优先确认 ThinkPHP、Composer 包、PHP 扩展和部署面板支持的 PHP 版本 |
| 老项目维护 | 先升级到当前依赖能承受的版本，再逐步替换旧扩展和旧语法 |
| 商业项目 | 不建议运行 EOL 版本，至少要保证安全支持期内 |
| 面板环境 | 先看宝塔、1Panel、MAMP、XAMPP 提供的 PHP 版本和扩展完整度 |

实际项目里，版本选择不是“越新越好”这么简单。新版本语法好用，但线上服务器、Composer 包、扩展、框架版本、部署面板都要一起确认。

## 常见升级报错

### Call to undefined function mysql_connect()

PHP 7 已移除 `mysql_*` 扩展。

```text
Fatal error: Uncaught Error: Call to undefined function mysql_connect()
```

处理方法：改成 PDO 或 MySQLi，不建议继续寻找旧扩展补丁。

### Creation of dynamic property is deprecated

PHP 8.2 开始不推荐动态属性。

```text
Deprecated: Creation of dynamic property User::$age is deprecated
```

处理方法：显式声明属性。

```php
<?php

class User
{
    public int $age = 0;
}
```

### Typed property must not be accessed before initialization

PHP 7.4 类型属性未初始化就读取会报错。

```text
Fatal error: Typed property User::$name must not be accessed before initialization
```

处理方法：给默认值，或者在构造函数中初始化。

```php
<?php

class User
{
    public string $name = '';
}
```

### Composer PHP version does not satisfy

本机 PHP 版本和依赖要求不匹配。

```text
Your PHP version does not satisfy that requirement.
```

处理方法：先看当前 PHP 版本和依赖约束。

```bash
php -v
composer why-not php 8.2
composer show package/name --all
```

## 官方入口

- [PHP 支持版本](https://www.php.net/supported-versions.php)
- [PHP 8.5 发布说明](https://www.php.net/releases/8.5/en.php)
- [PHP 8.4 发布说明](https://www.php.net/releases/8.4/en.php)
- [PHP 8 迁移指南](https://www.php.net/manual/en/migration80.php)
- [PHP 7 迁移指南](https://www.php.net/manual/en/migration70.php)
- [PHP 5 旧文档说明](https://www.php.net/manual/php5.php)
