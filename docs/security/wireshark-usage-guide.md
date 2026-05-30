---
title: Wireshark 使用指南：抓包、过滤与协议分析
description: Wireshark 网络抓包入门，覆盖抓包准备、显示过滤器、TCP 流、TLS、DNS、HTTP、tshark、Python 解析和常见问题。
---

# Wireshark 使用指南：抓包、过滤与协议分析

Wireshark 是常用的网络抓包和协议分析工具。它适合回答这些问题：

- 程序连了哪个域名和 IP。
- 请求和响应是否正常。
- DNS 是否解析失败。
- TCP 是否重传、丢包或握手失败。
- HTTP 参数、状态码、响应体是什么。
- TLS 握手是否失败，证书是否异常。

抓包前先明确边界：只抓自己设备、自己网络、授权测试环境中的流量。不要在公共网络或他人设备上抓取敏感数据。

## 抓包前准备

先确认目标：

| 问题 | 关注点 |
| --- | --- |
| 接口请求失败 | DNS、TCP、TLS、HTTP 状态码 |
| 上传慢 | TCP 重传、窗口、RTT、服务端响应 |
| App 连不上 | 代理、证书、SNI、域名解析 |
| 协议未知 | 端口、payload、握手特征 |
| 偶发错误 | 时间线、重试、连接复用 |

记录信息：

```md
- 设备：
- 网络：
- 目标应用：
- 触发动作：
- 时间点：
- 目标域名：
- 目标接口：
```

## 选择网卡

打开 Wireshark 后选择正在通信的网卡：

| 场景 | 常见网卡 |
| --- | --- |
| 本机浏览网页 | Wi-Fi / Ethernet |
| Android 代理到电脑 | Wi-Fi / Ethernet |
| 本机回环请求 | Loopback |
| Docker / 虚拟机 | bridge / vmnet / vEthernet |

如果不确定，先看哪个网卡有波形。

## 捕获过滤器与显示过滤器

Wireshark 有两类过滤器：

| 类型 | 生效时机 | 示例 |
| --- | --- | --- |
| 捕获过滤器 | 抓包前，只保存匹配流量 | `host 1.2.3.4` |
| 显示过滤器 | 抓包后，只显示匹配包 | `ip.addr == 1.2.3.4` |

捕获过滤器语法更接近 tcpdump：

```text
host 1.2.3.4
port 443
tcp port 443
udp port 53
host example.com
```

显示过滤器更强大：

```text
ip.addr == 1.2.3.4
tcp.port == 443
udp.port == 53
http.request
http.response.code == 500
tls.handshake.type == 1
dns.qry.name contains "example"
```

入门建议：先不设捕获过滤器，抓完后用显示过滤器查。

## 常用显示过滤器

### IP 和端口

```text
ip.addr == 192.168.1.10
ip.src == 192.168.1.10
ip.dst == 192.168.1.10
tcp.port == 443
udp.port == 53
```

### DNS

```text
dns
dns.qry.name contains "example"
dns.flags.rcode != 0
```

DNS 返回码：

| rcode | 含义 |
| --- | --- |
| `0` | 成功 |
| `2` | Server failure |
| `3` | NXDOMAIN，域名不存在 |
| `5` | Refused |

### TCP

```text
tcp
tcp.flags.syn == 1
tcp.analysis.retransmission
tcp.analysis.fast_retransmission
tcp.analysis.lost_segment
tcp.analysis.window_full
tcp.analysis.zero_window
```

### TLS

```text
tls
tls.handshake
tls.handshake.type == 1
tls.handshake.extensions_server_name contains "example"
```

TLS 握手类型：

| type | 含义 |
| --- | --- |
| `1` | Client Hello |
| `2` | Server Hello |
| `11` | Certificate |
| `15` | Certificate Verify |
| `20` | Finished |

### HTTP

```text
http
http.request
http.response
http.request.method == "POST"
http.response.code >= 400
http.host contains "example"
http.request.uri contains "/api/"
```

HTTPS 默认看不到 HTTP 明文，除非你有合法的解密条件，例如测试环境密钥、浏览器 SSL key log 或代理导出的明文。

## Follow TCP Stream

看到某个 TCP 包后：

```text
右键 -> Follow -> TCP Stream
```

适合看：

- HTTP 明文请求。
- 自定义 TCP 协议。
- 服务端返回内容。
- 一次连接内的请求响应顺序。

注意：

- TCP Stream 是按连接重组，不等于业务请求。
- HTTP/2、WebSocket、TLS 加密流需要对应解析方式。
- 长连接里可能有多次业务消息。

## 分析 DNS 问题

典型过滤：

```text
dns.qry.name contains "api.example.com"
```

检查：

1. 是否发出查询。
2. 查询的是 A 还是 AAAA。
3. 是否有响应。
4. 响应 IP 是什么。
5. rcode 是否为 0。
6. 是否频繁重试。

常见现象：

| 现象 | 可能原因 |
| --- | --- |
| 没有 DNS 请求 | 使用缓存、直接 IP、DoH、代理 |
| NXDOMAIN | 域名不存在或环境配置错误 |
| 只有 AAAA 失败 | IPv6 环境问题 |
| DNS 很慢 | DNS 服务器或网络延迟 |

## 分析 TCP 连接失败

过滤目标 IP：

```text
ip.addr == 1.2.3.4 and tcp
```

看握手：

```text
tcp.flags.syn == 1
```

正常三次握手：

```text
Client -> Server SYN
Server -> Client SYN, ACK
Client -> Server ACK
```

异常现象：

| 现象 | 可能原因 |
| --- | --- |
| SYN 一直重传 | 服务不可达、防火墙、路由问题 |
| 收到 RST | 端口关闭、服务拒绝、代理重置 |
| 握手成功后无数据 | 应用未发送、TLS 卡住、代理问题 |
| 大量重传 | 丢包、网络质量差、MTU 问题 |

## 分析 TLS 问题

过滤：

```text
tls.handshake
```

关注：

- Client Hello 里 SNI 是否正确。
- TLS 版本。
- Cipher Suites。
- Server Hello 是否返回。
- Certificate 是否下发。
- Alert 类型。

TLS Alert 过滤：

```text
tls.alert_message
```

常见问题：

| 现象 | 可能原因 |
| --- | --- |
| 没有 Server Hello | 服务端拒绝或网络中断 |
| Certificate 后失败 | 证书校验失败、系统时间错误 |
| Unknown CA | 测试证书未信任 |
| Handshake Failure | TLS 版本或加密套件不匹配 |

## HTTP 分析

明文 HTTP 可直接看请求：

```text
http.request.method == "POST"
http.response.code >= 400
```

常看字段：

- Method
- Host
- URI
- Status Code
- Content-Type
- User-Agent
- Cookie
- Authorization
- Request Payload
- Response Body

导出对象：

```text
File -> Export Objects -> HTTP
```

如果是 gzip 响应，Wireshark 通常能自动解压。不能解压时检查 `Content-Encoding`。

## HTTPS 解密：SSLKEYLOGFILE

对于自己浏览器访问的测试站点，可以用浏览器导出会话密钥。

macOS / Linux：

```sh
export SSLKEYLOGFILE=/tmp/sslkeys.log
open -a "Google Chrome"
```

Windows PowerShell：

```powershell
$env:SSLKEYLOGFILE="C:\temp\sslkeys.log"
start chrome
```

Wireshark 设置：

```text
Preferences -> Protocols -> TLS -> (Pre)-Master-Secret log filename
```

选择 `sslkeys.log` 后，Wireshark 可以解密对应浏览器会话。

注意：

- 只对支持 key log 的客户端有效。
- 只能解密你自己产生且有 key log 的流量。
- App 不一定支持这种方式。
- HTTP/2 解密后可能显示为 `http2`。

## 命令行 tshark

查看网卡：

```sh
tshark -D
```

抓 30 秒保存：

```sh
tshark -i en0 -a duration:30 -w capture.pcapng
```

过滤显示 DNS：

```sh
tshark -r capture.pcapng -Y "dns" -T fields \
  -e frame.time \
  -e ip.src \
  -e ip.dst \
  -e dns.qry.name
```

导出 HTTP 状态码：

```sh
tshark -r capture.pcapng -Y "http.response" -T fields \
  -e frame.time \
  -e ip.src \
  -e http.response.code \
  -e http.content_type
```

统计目标 IP：

```sh
tshark -r capture.pcapng -T fields -e ip.dst |
  sort |
  uniq -c |
  sort -nr |
  head
```

## Python 读取 pcap

如果安装了 `pyshark`：

```python
import pyshark

cap = pyshark.FileCapture("capture.pcapng", display_filter="dns")

for pkt in cap:
    try:
        print(pkt.frame_info.time, pkt.ip.src, pkt.dns.qry_name)
    except AttributeError:
        pass
```

用 tshark 输出 JSON 再让 Python 处理也很稳：

```sh
tshark -r capture.pcapng -Y "dns" -T json > dns.json
```

Python：

```python
import json

with open("dns.json", "r", encoding="utf-8") as f:
    packets = json.load(f)

for item in packets:
    layers = item["_source"]["layers"]
    dns = layers.get("dns", {})
    print(dns.get("Queries"))
```

## 小案例：接口偶发 502

目标：分析 `api.example.com` 偶发 502。

步骤：

1. 开始抓包。
2. 触发接口请求。
3. 记录发生问题的时间。
4. 过滤域名：

```text
dns.qry.name contains "api.example.com"
```

5. 找到解析 IP。
6. 过滤 IP：

```text
ip.addr == 1.2.3.4
```

7. 查看 TCP 是否重传：

```text
ip.addr == 1.2.3.4 and tcp.analysis.retransmission
```

8. 如果是明文或可解密 HTTP，查状态码：

```text
http.response.code == 502
```

记录：

```md
- DNS 解析正常，返回 `1.2.3.4`。
- TCP 握手正常，无明显重传。
- 服务端返回 HTTP 502。
- 502 前请求耗时约 3 秒。
- 初步判断更接近服务端网关或上游异常。
```

## 完整案例：从“App 网络异常”定位 TLS 证书问题

场景：测试 App 请求 `https://api.test.local/user/profile` 失败，客户端只提示“网络异常”。目标是判断问题发生在 DNS、TCP、TLS 还是 HTTP。

![Wireshark 网络排障流程](/images/security/tool-guides/wireshark-troubleshooting-flow.svg)

### 1. 抓包前记录

```md
- 设备：Android 测试机
- 网络：测试 Wi-Fi
- 目标域名：api.test.local
- 触发动作：进入个人资料页
- 发生时间：10:32:15
```

### 2. 看 DNS

显示过滤器：

```text
dns.qry.name contains "api.test.local"
```

如果看到：

```text
Standard query A api.test.local
Standard query response A 10.10.20.15
```

说明 DNS 正常。

### 3. 看 TCP

过滤：

```text
ip.addr == 10.10.20.15 and tcp.port == 443
```

正常三次握手应该是：

```text
Client -> Server SYN
Server -> Client SYN, ACK
Client -> Server ACK
```

如果出现 SYN 重传：

```text
tcp.analysis.retransmission and ip.addr == 10.10.20.15
```

问题可能在网络、防火墙或服务端端口。本案例假设 TCP 正常。

### 4. 看 TLS

过滤：

```text
tls.handshake or tls.alert_message
```

看到：

```text
Client Hello, SNI: api.test.local
Server Hello
Certificate
Alert (Level: Fatal, Description: Unknown CA)
```

说明：

- SNI 正确。
- 服务端有响应。
- 失败发生在证书校验阶段。
- `Unknown CA` 指向客户端不信任服务端证书链。

### 5. 用 tshark 导出证据

```sh
tshark -r app-fail.pcapng -Y "tls.alert_message" -T fields \
  -e frame.time \
  -e ip.src \
  -e ip.dst \
  -e tls.alert_message.desc
```

示例：

```text
May 31, 2026 10:32:16.123456  192.168.1.23  10.10.20.15  Unknown CA
```

DNS 摘要：

```sh
tshark -r app-fail.pcapng -Y "dns.qry.name contains api.test.local" -T fields \
  -e frame.time \
  -e dns.qry.name \
  -e dns.a
```

### 6. 结论

```md
本次“网络异常”发生在 TLS 证书校验阶段。

证据：

1. DNS 正常，`api.test.local` 解析到 `10.10.20.15`。
2. TCP 三次握手正常，没有明显重传。
3. TLS Client Hello 的 SNI 是 `api.test.local`。
4. 服务端返回 Certificate 后出现 Fatal Alert：Unknown CA。

建议：

- 检查测试环境证书链是否完整。
- 确认 Android 测试机是否安装测试 CA。
- 如果 App 使用证书绑定，检查内置证书是否过期或环境不匹配。
```

## 完整案例：HTTP 500 是客户端参数错还是服务端异常

场景：测试环境接口偶发 HTTP 500。你已经通过 SSLKEYLOGFILE 解密了浏览器流量。

### 1. 过滤 500 响应

```text
http.response.code == 500
```

查看目标接口：

```text
http.request.uri contains "/api/order/create"
```

### 2. Follow HTTP Stream

右键其中一个 500 响应：

```text
Follow -> HTTP Stream
```

失败请求：

```http
POST /api/order/create HTTP/1.1
Host: api.test.local
Content-Type: application/json

{"sku_id":"","count":1}
```

失败响应：

```http
HTTP/1.1 500 Internal Server Error
Content-Type: application/json

{"message":"database error"}
```

成功请求：

```json
{"sku_id":"A1001","count":1}
```

### 3. 判断

可以写成：

```md
HTTP 500 与请求体中的空 `sku_id` 相关。

证据：

- 成功请求 `sku_id = A1001`。
- 失败请求 `sku_id = ""`。
- 服务端返回 `database error`，说明服务端没有把参数错误转换成 4xx。

建议：

- 客户端提交前校验 `sku_id`。
- 服务端对空 `sku_id` 返回 400，并记录明确错误码。
```

## 常见问题

### 为什么抓不到包

可能原因：

- 选错网卡。
- 流量走了代理、VPN 或其他接口。
- 目标在本机回环，但抓的是 Wi-Fi。
- 没有权限抓包。
- App 使用 QUIC / HTTP3，走 UDP 443。

先用简单过滤确认是否有流量：

```text
ip
tcp or udp
dns
```

### 为什么 HTTPS 看不到内容

HTTPS 是加密的。Wireshark 默认只能看到：

- IP。
- 端口。
- TLS 握手。
- SNI。
- 证书。
- 包大小和时间。

看明文需要合法解密条件，如 SSLKEYLOGFILE、测试代理或服务端私钥配合旧式 RSA 握手。现代 TLS 通常不能仅凭服务端私钥解密。

### 为什么只有 HTTP/2 看不懂

HTTP/2 是二进制协议。解密后 Wireshark 会显示 `http2` 帧。关注：

```text
http2.headers
http2.data.data
```

可以在 Follow Stream 里看重组内容，但不如 HTTP/1.1 直观。

### 大量 TCP 重传一定是服务端问题吗

不一定。重传可能来自：

- 客户端网络差。
- Wi-Fi 丢包。
- VPN 或代理。
- 中间链路拥塞。
- 服务端响应慢导致超时重试。

要结合 RTT、重传方向和时间线判断。

### QUIC / HTTP3 怎么看

QUIC 通常走 UDP 443：

```text
udp.port == 443
quic
```

如果只是想排查 HTTP 行为，可以在浏览器或测试环境临时关闭 QUIC；如果是 App，要看它是否支持切换协议。

## 抓包记录模板

```md
## 场景

- 时间：
- 设备：
- 网络：
- 应用：
- 触发动作：

## 过滤器

```text
dns.qry.name contains "example"
ip.addr == x.x.x.x
tcp.analysis.retransmission
```

## 观察

- DNS：
- TCP：
- TLS：
- HTTP：
- 异常包：

## 结论

-
```

## 案例三：定位接口慢是 DNS、建连还是服务端处理慢

### 场景

测试环境反馈：App 点击登录后等 5 秒才返回。服务端说接口只处理了 80ms，客户端说就是慢。用 Wireshark 拆时间线。

### 1. 过滤目标域名 DNS

```text
dns.qry.name contains "api.demo.local"
```

关注：

| 字段 | 说明 |
| --- | --- |
| Query 到 Response 间隔 | DNS 解析耗时 |
| 返回 IP | 是否符合预期环境 |
| 是否重复查询 | 是否 DNS 缓存失效或失败重试 |

如果 DNS 就用了 3 秒，先不要看 HTTP。

### 2. 过滤目标 IP

假设解析到 `10.10.20.8`：

```text
ip.addr == 10.10.20.8
```

看 TCP 三次握手：

```text
tcp.flags.syn == 1 || tcp.flags.ack == 1
```

计算：

```text
SYN -> SYN,ACK
```

这个时间接近网络 RTT。如果 SYN 重传：

```text
tcp.analysis.retransmission && tcp.flags.syn == 1
```

说明连接阶段就不稳定。

### 3. 看 TLS 握手

```text
tls.handshake
```

关注：

- Client Hello。
- Server Hello。
- Certificate。
- Finished。

如果 TLS 握手前后卡很久，可能是证书链、代理、网络或服务端 TLS 配置问题。

### 4. 看 HTTP 请求到响应

如果能解密 HTTP：

```text
http.request || http.response
```

或者 HTTP/2：

```text
http2.headers
```

计算：

```text
request headers -> response headers
```

如果这段是 80ms，但总耗时 5 秒，那么慢点在 DNS、TCP 或 TLS；如果这段就是 5 秒，才看服务端。

### 5. tshark 导出时间线

```bash
tshark -r login.pcapng \
  -Y 'dns || tcp.port == 443 || tls || http2' \
  -T fields \
  -e frame.number \
  -e frame.time_relative \
  -e ip.src \
  -e ip.dst \
  -e _ws.col.Protocol \
  -e _ws.col.Info
```

记录模板：

```md
| 阶段 | 起止包 | 耗时 | 结论 |
| --- | --- | --- | --- |
| DNS | 12-13 | 3.2s | DNS 响应慢 |
| TCP | 14-16 | 40ms | 正常 |
| TLS | 17-25 | 120ms | 正常 |
| HTTP | 26-31 | 80ms | 服务端处理正常 |
```

这个案例最后的结论可能是：登录慢不是接口处理慢，而是测试 Wi-Fi 的 DNS 服务器响应慢。

## 案例四：确认客户端是否真的发出了 JSON 字段

### 场景

服务端报错：

```text
missing field: device_id
```

客户端开发说代码里已经传了。用抓包确认线上实际请求。

### 1. 过滤接口

如果是 HTTP 明文：

```text
http.request.uri contains "/api/device/bind"
```

如果是已解密 HTTPS/HTTP2：

```text
http2.headers.path contains "/api/device/bind"
```

### 2. Follow Stream

右键目标包：

```text
Follow -> HTTP Stream
```

检查请求体：

```json
{
  "deviceId": "abc123",
  "model": "Pixel 8"
}
```

如果服务端要求 `device_id`，而客户端发的是 `deviceId`，问题就不是网络，是字段命名不一致。

### 3. 用 tshark 导出请求体

HTTP/1.1 明文：

```bash
tshark -r bind.pcapng \
  -Y 'http.request.uri contains "/api/device/bind"' \
  -T fields \
  -e http.file_data
```

如果输出十六进制或转义内容，可以先导出对象，或者在 Wireshark 的 Packet Bytes 里复制为 printable text。

### 4. 结论写法

```md
- 接口：`POST /api/device/bind`
- 客户端实际字段：`deviceId`
- 服务端期望字段：`device_id`
- 不是丢包、代理、TLS 或服务端超时问题
- 修复方向：统一接口字段命名，或服务端兼容旧字段
```

## 案例五：判断 WebSocket 心跳是否断了

### 场景

页面显示“设备离线”，但设备端日志说自己一直在线。抓浏览器到网关的 WebSocket。

### 1. 过滤 WebSocket

```text
websocket
```

或者先找升级请求：

```text
http.request && http.request.line contains "Upgrade: websocket"
```

### 2. 看握手

正常握手应该看到：

```text
GET /ws/device HTTP/1.1
Upgrade: websocket
```

响应：

```text
HTTP/1.1 101 Switching Protocols
```

如果没有 101，先看鉴权、路径和代理配置。

### 3. 看心跳帧

Wireshark 过滤：

```text
websocket.payload contains "ping" || websocket.payload contains "pong"
```

如果是标准控制帧：

```text
websocket.opcode == 9 || websocket.opcode == 10
```

### 4. 判断断线位置

| 现象 | 可能原因 |
| --- | --- |
| 客户端持续发 ping，服务端不回 pong | 服务端卡住、网关丢弃、反向代理超时 |
| 服务端发消息，客户端 TCP ACK 正常但页面没更新 | 前端业务处理问题 |
| 出现 TCP FIN | 一方主动关闭 |
| 出现 TCP RST | 连接被重置，常见于代理或进程异常 |

### 5. 记录结论

```md
- WebSocket 握手：成功，HTTP 101
- 心跳周期：客户端每 15 秒 ping
- 异常点：第 382 包后服务端不再返回 pong
- TCP 状态：30 秒后代理发送 FIN
- 修复方向：检查网关 idle timeout，或缩短心跳间隔到 10 秒
```
