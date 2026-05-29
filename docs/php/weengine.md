---
title: 微擎常见问题
description: 微擎 WeEngine 安装环境、模块开发、公众号小程序配置、权限、伪静态、支付、升级和常见报错整理。
---

# 微擎常见问题

微擎常用于公众号、小程序、模块化业务系统和微信生态项目。维护微擎项目时，重点不是只看 PHP 代码，还要同时关注站点配置、公众号配置、模块权限、数据库结构、附件目录和支付参数。

::: info 官方入口
- [微擎开发者中心](https://dev.w7.cc/)
- [微擎开发文档](https://wiki.w7.com/)
:::

## 环境检查

常见环境：

- Linux
- Nginx 或 Apache
- PHP
- MySQL
- Redis 可选

检查 PHP 版本：

```sh
php -v
```

查看扩展：

```sh
php -m
```

常见需要关注的扩展：

- `pdo_mysql`
- `curl`
- `openssl`
- `mbstring`
- `gd`
- `fileinfo`
- `xml`
- `zip`

## 目录权限

微擎项目常见可写目录包括附件、缓存、数据目录。权限不对时，可能出现上传失败、生成二维码失败、缓存无法写入。

```sh
chown -R www-data:www-data attachment data
chmod -R 775 attachment data
```

实际用户要根据 PHP-FPM 运行用户调整。

## Nginx 伪静态

示例：

```nginx
location / {
  try_files $uri $uri/ /index.php?$query_string;
}

location ~ \.php$ {
  fastcgi_pass 127.0.0.1:9000;
  fastcgi_index index.php;
  include fastcgi_params;
  fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
}
```

如果后台能打开但前台路由 404，优先检查伪静态和入口目录。

## 公众号配置

公众号对接一般要检查：

- `AppID`
- `AppSecret`
- Token
- EncodingAESKey
- 服务器 URL
- IP 白名单
- JS 接口安全域名
- 网页授权域名

如果消息收不到，先确认公众号后台服务器配置是否启用。

## 小程序配置

小程序常见配置：

- 小程序 `AppID`
- 小程序密钥
- request 合法域名
- uploadFile 合法域名
- downloadFile 合法域名
- socket 合法域名
- 业务域名

本地调试通过，不代表线上可用。线上必须配置合法域名，并且通常要求 HTTPS。

## 支付配置

微信支付常见参数：

- 商户号
- API v2 key 或 API v3 key
- 商户证书
- 支付回调地址
- 证书序列号

常见问题：

### 签名错误

检查：

- 商户号是否和 AppID 绑定。
- API key 是否填错。
- 参数排序和签名算法是否符合当前接口版本。
- 证书文件路径是否正确。

### 回调不执行

检查：

- 回调 URL 是否公网可访问。
- HTTPS 证书是否有效。
- Nginx 是否拦截 `POST`。
- 模块是否正确处理通知并返回成功响应。

## 模块开发目录理解

微擎模块通常围绕模块标识组织代码。维护时要先确认：

- 模块安装信息。
- 模块版本。
- 数据表结构。
- 前台入口。
- 后台入口。
- 模板目录。
- 静态资源目录。

不要直接改核心文件。能在模块内修就放模块内，方便升级和迁移。

## 常见报错

### 白屏或 500

排查日志：

```sh
tail -n 200 /var/log/nginx/error.log
tail -n 200 /var/log/php-fpm/error.log
```

同时打开 PHP 错误日志，不要只看浏览器页面。

### 后台登录验证码不显示

常见原因：

- GD 扩展缺失。
- Session 目录不可写。
- 反向代理缓存了验证码图片。
- PHP 报错但前端只显示图片裂开。

### 上传图片失败

检查：

```ini
upload_max_filesize = 20M
post_max_size = 20M
```

Nginx：

```nginx
client_max_body_size 20m;
```

还要检查附件目录权限。

### 更新后模块异常

处理顺序：

1. 备份数据库和代码。
2. 看更新日志和模块版本要求。
3. 检查 PHP 版本和扩展。
4. 清理缓存。
5. 对比数据库字段是否缺失。

## 维护建议

- 升级前先完整备份。
- 不要在核心文件里堆业务修改。
- 模块改动要记录变更说明。
- 支付、登录、回调接口要保留原始日志。
- 线上站点不要开启详细错误显示。
- 老项目迁移时先固定 PHP 和 MySQL 版本，再逐步升级。
