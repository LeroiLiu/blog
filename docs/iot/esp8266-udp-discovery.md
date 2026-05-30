---
title: ESP8266 UDP 实战：局域网发现、广播控制与传感器上报
description: 使用 Arduino 编写 ESP8266 UDP 案例，实现局域网设备发现、广播命令、单播响应、UDP 传感器上报和丢包处理。
---

# ESP8266 UDP 实战：局域网发现、广播控制与传感器上报

UDP 不建立连接，适合局域网发现、广播通知、低频传感器上报。它不保证到达、不保证顺序，所以不要用它直接做关键控制闭环。

这篇做一个局域网发现案例：

1. 电脑广播 `DISCOVER_ESP8266`。
2. ESP8266 收到后回复自己的 ID、IP、RSSI。
3. 电脑发送 `LED 1` 或 `LED 0` 控制 LED。
4. ESP8266 每 5 秒向电脑上报一次状态。

## 协议

| 消息 | 方向 | 示例 |
| --- | --- | --- |
| 发现广播 | 电脑到设备 | `DISCOVER_ESP8266` |
| 发现响应 | 设备到电脑 | `ESP8266 id=esp001 ip=192.168.1.33 rssi=-48` |
| 控制命令 | 电脑到设备 | `LED 1` |
| 控制响应 | 设备到电脑 | `ACK led=1` |
| 状态上报 | 设备到电脑 | `STATUS id=esp001 led=1 uptime=20 rssi=-50` |

## ESP8266 UDP 完整代码

```cpp
#include <ESP8266WiFi.h>
#include <WiFiUdp.h>

const char* WIFI_SSID = "your-wifi";
const char* WIFI_PASS = "your-password";

const char* DEVICE_ID = "esp001";
const int LED_PIN = D1;

const uint16_t LOCAL_PORT = 4210;
const uint16_t REPORT_PORT = 4211;

WiFiUDP udp;
char packet[256];
unsigned long lastReportAt = 0;
IPAddress lastRemoteIp;
bool hasRemote = false;

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  Serial.print("wifi connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("ip=");
  Serial.println(WiFi.localIP());
}

void sendTo(IPAddress ip, uint16_t port, const String& text) {
  udp.beginPacket(ip, port);
  udp.write(text.c_str());
  udp.endPacket();
}

String statusLine() {
  String text = "STATUS id=";
  text += DEVICE_ID;
  text += " led=";
  text += digitalRead(LED_PIN) == HIGH ? "1" : "0";
  text += " uptime=";
  text += millis() / 1000;
  text += " rssi=";
  text += WiFi.RSSI();
  return text;
}

void handlePacket(String msg, IPAddress remoteIp, uint16_t remotePort) {
  msg.trim();

  Serial.print("udp from ");
  Serial.print(remoteIp);
  Serial.print(":");
  Serial.print(remotePort);
  Serial.print(" ");
  Serial.println(msg);

  lastRemoteIp = remoteIp;
  hasRemote = true;

  if (msg == "DISCOVER_ESP8266") {
    String reply = "ESP8266 id=";
    reply += DEVICE_ID;
    reply += " ip=";
    reply += WiFi.localIP().toString();
    reply += " rssi=";
    reply += WiFi.RSSI();
    sendTo(remoteIp, remotePort, reply);
    return;
  }

  if (msg == "LED 1") {
    digitalWrite(LED_PIN, HIGH);
    sendTo(remoteIp, remotePort, "ACK led=1");
    return;
  }

  if (msg == "LED 0") {
    digitalWrite(LED_PIN, LOW);
    sendTo(remoteIp, remotePort, "ACK led=0");
    return;
  }

  if (msg == "STATUS") {
    sendTo(remoteIp, remotePort, statusLine());
    return;
  }

  sendTo(remoteIp, remotePort, "ERR unknown");
}

void readUdp() {
  int size = udp.parsePacket();
  if (size <= 0) {
    return;
  }

  int len = udp.read(packet, sizeof(packet) - 1);
  if (len <= 0) {
    return;
  }

  packet[len] = '\0';
  handlePacket(String(packet), udp.remoteIP(), udp.remotePort());
}

void reportStatus() {
  if (!hasRemote) {
    return;
  }

  sendTo(lastRemoteIp, REPORT_PORT, statusLine());
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  connectWiFi();
  udp.begin(LOCAL_PORT);

  Serial.print("udp listen ");
  Serial.println(LOCAL_PORT);
}

void loop() {
  readUdp();

  unsigned long now = millis();
  if (now - lastReportAt > 5000) {
    lastReportAt = now;
    reportStatus();
  }
}
```

## Python 发现与控制脚本

```python
import socket
import time

DISCOVER_PORT = 4210
REPORT_PORT = 4211

sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
sock.setsockopt(socket.SOL_SOCKET, socket.SO_BROADCAST, 1)
sock.bind(("", REPORT_PORT))
sock.settimeout(2)

sock.sendto(b"DISCOVER_ESP8266", ("255.255.255.255", DISCOVER_PORT))

devices = []
started = time.time()
while time.time() - started < 3:
    try:
        data, addr = sock.recvfrom(1024)
    except socket.timeout:
        break

    text = data.decode(errors="replace")
    print("found", addr, text)
    devices.append(addr[0])

if not devices:
    raise SystemExit("no device found")

ip = devices[0]
sock.sendto(b"LED 1", (ip, DISCOVER_PORT))
print(sock.recvfrom(1024))

sock.sendto(b"STATUS", (ip, DISCOVER_PORT))
print(sock.recvfrom(1024))

time.sleep(1)
sock.sendto(b"LED 0", (ip, DISCOVER_PORT))
print(sock.recvfrom(1024))
```

运行结果：

```text
found ('192.168.1.33', 4210) ESP8266 id=esp001 ip=192.168.1.33 rssi=-46
(b'ACK led=1', ('192.168.1.33', 4210))
(b'STATUS id=esp001 led=1 uptime=42 rssi=-48', ('192.168.1.33', 4210))
(b'ACK led=0', ('192.168.1.33', 4210))
```

## 广播地址怎么选

常见局域网是 `192.168.1.0/24`，广播地址通常是：

```text
192.168.1.255
```

但 Python 里用 `255.255.255.255` 更省事。某些路由器或手机热点会屏蔽广播，这时可以改成扫描网段单播：

```python
for i in range(1, 255):
    ip = f"192.168.1.{i}"
    sock.sendto(b"DISCOVER_ESP8266", (ip, 4210))
```

## UDP 丢包处理

UDP 命令想更可靠一点，可以加 `seq`：

```text
LED seq=1001 value=1
ACK seq=1001 led=1
```

电脑侧 500ms 没收到 ACK 就重发，最多重发 3 次。不要无限重发，否则网络异常时会把设备和路由器都拖慢。

## UDP 适合什么

适合：

- 局域网发现设备。
- 低频状态广播。
- 不关键的灯效、屏幕刷新、遥测上报。
- 对接已有 UDP 网关。

不适合：

- 支付、门锁、闸机这类关键控制。
- 必须有顺序的文件传输。
- 需要严格到达确认的设备指令。

如果控制命令很关键，建议使用 MQTT QoS 1、TCP 应用层 ACK，或者 HTTP 接口。

