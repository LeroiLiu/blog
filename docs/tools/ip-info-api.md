---
title: IP 信息查询 API 整理
description: IP 信息查询 API、获取本机 IP、IP 归属地、IPv4、IPv6、Ping0、ip-api、ip.sb、纯真 IP 库 QQWry、ip2region、IP数据云、IPinfo、离线库、本地缓存和失效接口整理。
---

# IP 信息查询 API 整理

IP 信息查询通常有三类需求：

- 获取当前访问者公网 IP。
- 查询某个 IP 的归属地、运营商、ASN。
- 做风控判断，例如机房 IP、代理 IP、原生 IP、住宅宽带。

如果只是后台显示“用户来自哪里”，免费接口或本地库基本够用；如果要做风控、计费、封禁、区域限制，就要考虑稳定性、准确率、缓存和付费服务。

## 方案对比

| 方案 | 适合场景 | 注意事项 |
| --- | --- | --- |
| 免费第三方 API | 低频查询、后台工具、临时排查 | 可能限流、失效、字段变化 |
| 付费 API | 风控、商业服务、稳定接口 | 需要预算、鉴权、容灾 |
| 本地 IP 库 | 高频查询、内网服务、隐私要求 | 需要定期更新库文件 |
| Nginx/CDN Header | 获取访问者真实 IP | 只能拿 IP，不能直接拿归属地 |
| 混合方案 | 生产项目 | 本地库优先，第三方 API 补充 |

## 获取当前公网 IP

命令行可以用：

```bash
curl ping0.cc
curl -4 ping0.cc
curl -6 ping0.cc
```

Ping0 还提供详细信息：

```bash
curl ping0.cc/geo
curl -4 ping0.cc/geo
curl -6 ping0.cc/geo
```

在 PHP 中获取 IPv4：

```php
$ip = file_get_contents('http://ipv4.ping0.cc');
```

在 PHP 中获取 IPv6：

```php
$ip = file_get_contents('http://ipv6.ping0.cc');
```

这类接口适合服务器自检，不建议在高并发用户请求里每次实时调用。

## 查询指定 IP

常见免费接口：

```text
https://api.ip.sb/geoip/8.8.8.8
http://ip-api.com/json/8.8.8.8?lang=zh-CN
https://ipapi.co/8.8.8.8/json/
https://freeipapi.com/api/json/8.8.8.8
```

部分接口支持不传 IP，默认查询当前访问者；也有接口只支持查询本机 IP，不能查指定 IP。

## 后端封装建议

不要让业务代码到处直接请求第三方 API。建议封装一个服务类：

```php
namespace app\service;

class IpInfoService
{
    public function lookup(string $ip): array
    {
        if ($ip === '' || !filter_var($ip, FILTER_VALIDATE_IP)) {
            return [];
        }

        $cacheKey = 'ip:info:' . $ip;
        $cached = cache($cacheKey);

        if (is_array($cached)) {
            return $cached;
        }

        $info = $this->queryIpApi($ip);

        if ($info !== []) {
            cache($cacheKey, $info, 86400);
        }

        return $info;
    }

    private function queryIpApi(string $ip): array
    {
        $url = 'http://ip-api.com/json/' . urlencode($ip) . '?lang=zh-CN';
        $json = @file_get_contents($url);

        if ($json === false) {
            return [];
        }

        $data = json_decode($json, true);

        if (!is_array($data)) {
            return [];
        }

        return [
            'ip' => $ip,
            'country' => $data['country'] ?? '',
            'region' => $data['regionName'] ?? '',
            'city' => $data['city'] ?? '',
            'isp' => $data['isp'] ?? '',
            'source' => 'ip-api',
        ];
    }
}
```

重点：

- 校验 IP 格式。
- 加缓存。
- 失败返回空数组，不要让接口拖垮业务。
- 统一字段，不要把第三方返回结构散落到业务层。

## 获取真实访问 IP

如果站点经过 Nginx、CDN、Cloudflare、负载均衡，`REMOTE_ADDR` 可能只是代理 IP。

常见 Header：

```text
X-Forwarded-For
X-Real-IP
CF-Connecting-IP
```

处理建议：

- 只信任自己的 Nginx、CDN、负载均衡传入的 Header。
- 不要直接信任客户端随便传来的 `X-Forwarded-For`。
- 多级代理时取值规则要固定。
- 记录原始 Header，方便排查。

PHP 示例：

```php
function client_ip(): string
{
    $headers = [
        'HTTP_CF_CONNECTING_IP',
        'HTTP_X_REAL_IP',
        'HTTP_X_FORWARDED_FOR',
        'REMOTE_ADDR',
    ];

    foreach ($headers as $key) {
        $value = $_SERVER[$key] ?? '';

        if ($value === '') {
            continue;
        }

        $ip = trim(explode(',', $value)[0]);

        if (filter_var($ip, FILTER_VALIDATE_IP)) {
            return $ip;
        }
    }

    return '';
}
```

生产环境要结合代理信任列表，不能无条件相信所有 Header。

## 缓存策略

IP 归属地不需要每次实时查。

建议：

- 普通归属地缓存 1 到 7 天。
- 风控结果缓存时间短一些。
- 查询失败缓存 5 到 10 分钟，避免接口故障时反复请求。
- 批量任务里加速率限制。
- 保存 `source` 字段，方便知道结果来自哪个接口。

## 本地库适合什么场景

适合：

- 每天大量查询。
- 不希望请求第三方。
- 只需要国家、省、市、运营商。
- 查询速度要求高。

不适合：

- 要判断代理、机房、原生 IP、住宅宽带。
- 要高精度风控。
- 不愿意维护库文件更新。

## 本地库方案

本地库的优势是稳定、快、不会被第三方接口限流，也不会把用户 IP 发给外部服务。缺点是数据需要更新，精度和字段丰富度取决于库本身。

| 本地库 | 适合场景 | 注意事项 |
| --- | --- | --- |
| 纯真 IP 库 `QQWry` | 老 PHP 项目、简单国内归属地、历史系统兼容 | 多为 IPv4 场景，数据文件要更新，精度不适合风控 |
| `ip2region` | 高并发本地查询、PHP/Go/Java/Node 等多语言项目 | 使用 `xdb` 文件，适合做国家、省、市、运营商等基础查询 |
| 商业离线库 | 金融、风控、广告、审计、离线部署 | 要看授权、更新频率、字段、IPv6 和代理识别能力 |

### 纯真 IP 库 `QQWry`

`QQWry` 常见于老 PHP 项目，通常以 `qqwry.dat` 这类数据文件形式使用。

适合：

- 只做简单 IP 归属地展示。
- 老项目已经集成了相关解析类。
- 查询量比较大，不想每次请求第三方接口。

不适合：

- IPv6 查询。
- 高精度定位。
- 代理、机房、住宅宽带识别。
- 风控、支付、安全审计等高准确率场景。

使用建议：

- 把数据文件放到非 Web 可直接访问目录。
- 做一层服务封装，不要在业务代码里直接解析文件。
- 定期更新数据文件。
- 查询失败时返回空结果，不要影响主流程。

### `ip2region`

`ip2region` 是更适合新项目的本地 IP 查询方案，常见数据文件是 `xdb`。它适合把 IP 查询放在自己的服务里，避免频繁请求第三方接口。

适合：

- 高并发查询。
- 内网部署。
- 需要统一封装给多个业务调用。
- PHP、Go、Java、Node.js、Python 等多语言项目。

返回字段通常可以统一成：

```text
country
province
city
isp
source
```

封装时建议：

- 服务启动时加载或缓存查询对象。
- 不要每次请求都重新读取数据文件。
- 记录当前数据文件版本和更新时间。
- 查询结果加业务缓存，例如 Redis 或应用缓存。
- 需要更高精度时，购买商业离线库或专业 API。

## 商业和专业服务

这类服务适合对准确率、稳定性、IPv6、ASN、代理识别、机房识别、风险画像有要求的项目。

| 服务 | 类型 | 适合场景 |
| --- | --- | --- |
| IP数据云 | API、离线库 | 国内业务、归属地、应用场景、代理识别、风险画像 |
| IPinfo | API、数据服务 | 国际业务、ASN、隐私识别、托管商、代理/VPN/Tor 识别 |
| IPIP.NET | API、离线库 | 国内 IP 数据、城市级定位、应用场景、代理风险识别 |
| DB-IP | API、离线库 | 通用 IP 地理位置数据 |
| MaxMind GeoIP | 离线库、商业服务 | 海外项目、GeoIP、风控、分析 |

选择商业服务时先确认：

- 是否支持 IPv6。
- 是否支持国内省市区县。
- 是否有 ASN、ISP、IDC、云服务商、代理、VPN、Tor 字段。
- API 是否有 QPS、日限额、并发限制。
- 是否提供离线库。
- 数据更新频率。
- 是否允许缓存结果。
- 是否有正式合同、发票和技术支持。

## IP 查询接口状态整理

这里只整理接口本身的可用性和适合场景，不再把读者跳转到其他博客文章。

### 可继续测试

| IP 查询接口 | 状态 | 备注 |
| --- | --- | --- |
| `https://api.ip.sb/geoip/` | 可继续测试 | 可查当前 IP，也可通过路径参数查指定 IP |
| `http://ip-api.com/json/?lang=zh-CN` | 可继续测试 | 可查当前 IP，也可查指定 IP，支持中文 |
| `https://ipapi.co/json/` | 可继续测试 | 可查当前 IP，也可按路径查指定 IP |
| `https://freeipapi.com/api/json` | 可继续测试 | 免费 IP 信息接口 |
| `https://ipwhois.app/json/?format=json` | 可继续测试 | IP 信息查询接口 |
| `https://api.db-ip.com/v2/free/self` | 可继续测试 | DB-IP 免费查询接口 |
| `https://ping0.cc/geo` | 可继续测试 | 获取当前 IP 简要地理信息 |
| `https://whois.pconline.com.cn/ipJson.jsp?ip=8.8.8.8&json=true` | 可继续测试 | 太平洋网络 IP 查询接口，返回字段包含省、市、地区和运营商 |
| `https://api.ipinfo.io/lookup/me` | 可继续测试 | IPinfo 新接口体系，用于查询当前 IP，更多字段通常需要对应套餐 |
| `https://api.ipinfo.io/lookup/8.8.8.8` | 可继续测试 | IPinfo 指定 IP 查询接口，适合国际 IP 信息和 ASN 场景 |

### 需要鉴权或付费

| IP 查询接口 | 状态 | 备注 |
| --- | --- | --- |
| `https://ping0.cc/apiloc/apikey(...)/ip(...)` | 需要鉴权或付费 | 查询指定 IP 的高精度信息 |
| `http://apis.juhe.cn/ip/ip2addr` | 需要鉴权 | 聚合数据接口，需要申请 `APPKEY` |
| `https://api.ipdatacloud.com/v2/query?ip=8.8.8.8&key=...` | 需要鉴权或付费 | IP数据云接口，适合归属地、应用场景、风险画像等商业场景 |

### 历史接口，建议复核后再使用

这些接口在历史资料中比较常见，但稳定性、字段结构、限流策略或可用性需要重新测试。

| IP 查询接口 | 状态 | 备注 |
| --- | --- | --- |
| `http://opendata.baidu.com/api.php?query=8.8.8.8&co=&resource_id=6006&oe=utf8` | 建议复核 | 百度开放数据老接口，字段和编码可能变化 |
| `https://www.ipplus360.com/getIP` | 建议复核 | 查询当前请求 IP，是否适合生产要重新测试 |
| `https://freeapi.ipip.net/8.8.8.8` | 建议复核 | IPIP.NET 免费接口，适合简单归属地测试 |

### 已失效或不建议使用

以下接口当前不建议直接用于新项目。后续如果重新恢复，也建议重新测试字段、限流、稳定性和返回结构。

| IP 查询接口 | 状态 |
| --- | --- |
| `https://webapi-pc.meitu.com/common/ip_location` | 已失效 |
| `https://www.ip.cn/api/index?ip=&type=0` | 已失效 |
| `https://api.vore.top/api/IPdata?ip=` | 已失效 |
| `https://ip-api.io/json` | 已失效 |
| `https://api.qjqq.cn/api/Local` | 已失效 |
| `https://ip.useragentinfo.com/json` | 已失效 |
| `https://api.uomg.com/api/visitor.info?skey=1` | 已失效 |
| `https://test.ipw.cn/api/ip/myip?json` | 已失效 |
| `https://check.torproject.org/api/ip` | 已失效 |
| `https://ipapi.com/ip_api.php?ip=121.8.215.106` | 已失效 |
| `https://mesh.if.iqiyi.com/aid/ip/info` | 已失效 |
| `http://ip.taobao.com/service/getIpInfo.php` | 老接口，不建议用于新项目 |
| `http://ip.taobao.com/service/getIpInfo2.php` | 老接口，不建议用于新项目 |

## 生产建议

- 新项目不要依赖单个免费接口。
- 业务代码只调用自己的 `IpInfoService`。
- 免费接口要加缓存、超时、降级。
- 查询失败不要阻断核心业务。
- 风控场景优先看付费接口或专业服务。
- 高频场景优先使用本地 IP 库。
