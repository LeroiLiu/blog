---
title: curl 和 wget 跳过 HTTPS 证书校验
description: curl -k 与 wget --no-check-certificate 的用法、适用场景和安全风险。
---

测试环境、自签名证书或直接使用 IP 访问 HTTPS 服务时，可能会遇到证书校验失败。下面是临时跳过证书校验的写法。

## wget 跳过证书校验

```sh
wget "https://x.x.x.x/get_ips" --no-check-certificate
```

## curl 跳过证书校验

```sh
curl "https://x.x.x.x/get_ips" -k
```

`-k` 等价于 `--insecure`。

## 什么时候会用到

常见场景：

- 自签名证书的测试环境。
- IP 地址直接访问 HTTPS 服务。
- 临时排查证书链问题。
- 内网服务证书没有配置完整。

## 风险说明

跳过证书校验会降低 HTTPS 的安全性，因为客户端不再确认服务端证书是否可信。生产环境中更推荐修复证书：

- 使用可信 CA 签发证书。
- 补齐中间证书链。
- 域名访问时保证证书域名匹配。
- 内网环境使用统一的内部 CA。

临时调试可以使用 `-k` 或 `--no-check-certificate`，长期脚本不建议依赖这两个参数。
