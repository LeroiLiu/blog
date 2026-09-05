---
title: EasyWeChat 常见问题
description: EasyWeChat 微信公众号、小程序、支付、消息回调、JS-SDK、access_token、服务器配置和常见报错整理。
---

EasyWeChat 是 PHP 微信开发 SDK，常用于公众号、小程序、微信支付、企业微信、开放平台等对接。它能减少签名、加解密、`access_token`、消息回调等重复代码。

:::note[官方入口]
- [EasyWeChat 首页](https://easywechat.com/)
- [EasyWeChat 6.x 文档](https://easywechat.com/6.x/)
- [EasyWeChat 5.x 文档](https://easywechat.com/5.x/)
:::

## 安装

```sh
composer require w7corp/easywechat
```

老项目如果使用 5.x 或更早版本，要先确认 PHP 版本、框架版本和 EasyWeChat 大版本，不要直接照新版本代码复制。

## 公众号配置示例

```php
use EasyWeChat\OfficialAccount\Application;

$config = [
  'app_id' => 'wx1234567890',
  'secret' => 'your-secret',
  'token' => 'your-token',
  'aes_key' => 'your-encoding-aes-key',
];

$app = new Application($config);
```

## 服务器验证

微信公众号后台配置服务器地址时，会发起 `GET` 请求验证签名。核心是校验 `signature`、`timestamp`、`nonce` 和 `echostr`。

使用 SDK 时通常交给 server 处理：

```php
$server = $app->getServer();
$response = $server->serve();

$response->send();
```

如果框架已经接管响应对象，需要按框架方式返回内容。

## 接收消息

```php
$server = $app->getServer();

$server->with(function ($message) {
  if ($message['MsgType'] === 'text') {
    return '收到：' . $message['Content'];
  }

  return 'success';
});

$response = $server->serve();
$response->send();
```

## 调用接口

```php
$client = $app->getClient();

$response = $client->get('/cgi-bin/user/info', [
  'query' => [
    'openid' => 'OPENID',
    'lang' => 'zh_CN'
  ]
]);

$data = $response->toArray();
```

## JS-SDK 常见配置

JS-SDK 最常见问题是当前网页 URL 和签名 URL 不一致。

```php
$utils = $app->getUtils();

$config = $utils->buildJsSdkConfig(
  url: 'https://example.com/page',
  jsApiList: ['updateAppMessageShareData', 'chooseImage']
);
```

注意：

- 后端签名 URL 要和浏览器实际访问 URL 一致。
- 微信里可能带有额外参数，前端传当前页面 URL 给后端更稳。
- 公众号后台要配置 JS 接口安全域名。

## access_token 问题

常见报错：

```txt
invalid credential
access_token is invalid or not latest
```

排查：

- `app_id` 和 `secret` 是否对应同一个公众号。
- 多台服务器是否共用 token 缓存。
- 是否手动刷新 token 导致旧 token 失效。
- 是否误用测试号、服务号、订阅号配置。

生产环境建议把 token 缓存放到 Redis 或共享缓存里，避免多实例互相覆盖。

## 支付回调注意点

- 回调必须能公网访问。
- 回调要校验签名。
- 业务处理必须幂等，同一个订单可能收到多次通知。
- 先记录原始通知日志，再更新订单状态。
- 返回给微信的内容要符合接口要求，否则会重复通知。

## 常见问题

### 服务器配置一直验证失败

检查：

- URL 是否公网可访问。
- 是否使用了 HTTPS 但证书不可信。
- Token 是否和代码里一致。
- Nginx 是否把 `GET` 参数转发完整。
- 框架中间件是否拦截了微信验证请求。

### 消息回调偶尔超时

微信回调处理要快。耗时任务建议写入队列：

```php
return 'success';
```

图片处理、外部接口调用、复杂数据库操作不要阻塞回调响应。

### 本地怎么调试微信回调

可以使用：

- [Cloudflare Tunnel](/ops/cloudflare-tunnel)
- [ngrok](/ops/intranet-tunnel-ngrok)
- 自有服务器反向代理到本地

微信平台通常要求公网 HTTPS 地址。
