---
title: ESP8266 TCP 实战：设备上报、命令下发与本地 TCP Server
description: 使用 Arduino 编写 ESP8266 TCP Client 和 TCP Server 案例，实现传感器数据上报、服务端命令控制、心跳、断线重连和简单文本协议。
---

# ESP8266 TCP 实战：设备上报、命令下发与本地 TCP Server

MQTT 适合设备消息，但有些项目只需要一个很轻的 TCP 长连接，例如局域网设备、门禁控制器、扫码器、串口转 Wi-Fi 模块。这里写两个可跑案例：

1. ESP8266 作为 TCP Client，连接业务服务端，上报数据并接收命令。
2. ESP8266 作为 TCP Server，手机或电脑直接连它控制 LED。

## 案例一：ESP8266 做 TCP Client

### 协议设计

使用一行一条消息，`\n` 结尾：

```text
HELLO id=esp001
PING uptime=10 rssi=-45
TEMP value=26.30
LED value=1
```

这种协议好调试，`nc`、`telnet`、Python 都能直接看。

### 本机测试服务端

先在电脑上启动一个 Python TCP Server：

```python
import socket
import threading
import time

HOST = "0.0.0.0"
PORT = 9000

def handle(conn, addr):
    print("client", addr)
    conn.sendall(b"LED value=1\n")

    last = time.time()
    with conn:
        buf = b""
        while True:
            data = conn.recv(1024)
            if not data:
                print("closed", addr)
                break

            buf += data
            while b"\n" in buf:
                line, buf = buf.split(b"\n", 1)
                print("recv:", line.decode(errors="replace"))

            if time.time() - last > 10:
                conn.sendall(b"LED value=0\n")
                last = time.time()

server = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
server.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
server.bind((HOST, PORT))
server.listen(5)
print("listen", HOST, PORT)

while True:
    conn, addr = server.accept()
    threading.Thread(target=handle, args=(conn, addr), daemon=True).start()
```

运行：

```bash
python3 tcp_server.py
```

### ESP8266 Client 完整代码

```cpp
#include <ESP8266WiFi.h>

const char* WIFI_SSID = "your-wifi";
const char* WIFI_PASS = "your-password";

const char* SERVER_HOST = "192.168.1.10";
const uint16_t SERVER_PORT = 9000;

const char* DEVICE_ID = "esp001";
const int LED_PIN = D1;

WiFiClient client;

unsigned long lastHeartbeatAt = 0;
unsigned long lastTempAt = 0;
String inputLine = "";

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  Serial.print("wifi connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("wifi ip=");
  Serial.println(WiFi.localIP());
}

bool connectServer() {
  if (client.connected()) {
    return true;
  }

  Serial.print("tcp connecting ");
  Serial.print(SERVER_HOST);
  Serial.print(":");
  Serial.println(SERVER_PORT);

  if (!client.connect(SERVER_HOST, SERVER_PORT)) {
    Serial.println("tcp connect failed");
    return false;
  }

  client.setNoDelay(true);
  client.print("HELLO id=");
  client.print(DEVICE_ID);
  client.print("\n");
  return true;
}

void sendHeartbeat() {
  client.print("PING uptime=");
  client.print(millis() / 1000);
  client.print(" rssi=");
  client.print(WiFi.RSSI());
  client.print("\n");
}

void sendTemperature() {
  float value = 24.0 + (millis() % 1000) / 100.0;
  client.print("TEMP value=");
  client.print(value, 2);
  client.print("\n");
}

int readValue(String line, String key) {
  int pos = line.indexOf(key + "=");
  if (pos < 0) {
    return -1;
  }

  int start = pos + key.length() + 1;
  int end = line.indexOf(' ', start);
  if (end < 0) {
    end = line.length();
  }

  return line.substring(start, end).toInt();
}

void handleLine(String line) {
  line.trim();
  if (line.length() == 0) {
    return;
  }

  Serial.print("server: ");
  Serial.println(line);

  if (line.startsWith("LED ")) {
    int value = readValue(line, "value");
    digitalWrite(LED_PIN, value == 1 ? HIGH : LOW);

    client.print("ACK LED value=");
    client.print(value);
    client.print("\n");
  }
}

void readServer() {
  while (client.connected() && client.available()) {
    char ch = client.read();
    if (ch == '\n') {
      handleLine(inputLine);
      inputLine = "";
    } else if (ch != '\r') {
      inputLine += ch;
      if (inputLine.length() > 128) {
        inputLine = "";
      }
    }
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  connectWiFi();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  if (!connectServer()) {
    delay(2000);
    return;
  }

  readServer();

  unsigned long now = millis();
  if (now - lastHeartbeatAt > 5000) {
    lastHeartbeatAt = now;
    sendHeartbeat();
  }

  if (now - lastTempAt > 3000) {
    lastTempAt = now;
    sendTemperature();
  }
}
```

### 运行效果

Python 服务端会看到：

```text
client ('192.168.1.33', 53112)
recv: HELLO id=esp001
recv: ACK LED value=1
recv: TEMP value=25.20
recv: PING uptime=6 rssi=-47
recv: TEMP value=27.81
```

设备串口会看到：

```text
wifi ip=192.168.1.33
tcp connecting 192.168.1.10:9000
server: LED value=1
server: LED value=0
```

## 案例二：ESP8266 做 TCP Server

这个场景适合局域网内直接控制设备，例如电脑连接 ESP8266 后发送 `ON`、`OFF`、`STATUS`。

### ESP8266 Server 代码

```cpp
#include <ESP8266WiFi.h>

const char* WIFI_SSID = "your-wifi";
const char* WIFI_PASS = "your-password";

const int LED_PIN = D1;
const uint16_t LISTEN_PORT = 9001;

WiFiServer server(LISTEN_PORT);
WiFiClient client;
String line = "";

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("server ip=");
  Serial.println(WiFi.localIP());
}

void replyStatus(WiFiClient& c) {
  c.print("STATUS led=");
  c.print(digitalRead(LED_PIN) == HIGH ? 1 : 0);
  c.print(" rssi=");
  c.print(WiFi.RSSI());
  c.print("\n");
}

void handleCommand(WiFiClient& c, String cmd) {
  cmd.trim();
  cmd.toUpperCase();

  if (cmd == "ON") {
    digitalWrite(LED_PIN, HIGH);
    c.print("OK LED ON\n");
  } else if (cmd == "OFF") {
    digitalWrite(LED_PIN, LOW);
    c.print("OK LED OFF\n");
  } else if (cmd == "STATUS") {
    replyStatus(c);
  } else {
    c.print("ERR unknown command\n");
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);

  connectWiFi();
  server.begin();
  server.setNoDelay(true);
}

void loop() {
  if (!client || !client.connected()) {
    client = server.available();
    if (client) {
      client.print("ESP8266 READY\n");
    }
    return;
  }

  while (client.available()) {
    char ch = client.read();
    if (ch == '\n') {
      handleCommand(client, line);
      line = "";
    } else if (ch != '\r') {
      line += ch;
      if (line.length() > 64) {
        line = "";
        client.print("ERR line too long\n");
      }
    }
  }
}
```

### 用 netcat 控制

```bash
nc 192.168.1.33 9001
```

输入：

```text
STATUS
ON
STATUS
OFF
```

返回：

```text
ESP8266 READY
STATUS led=0 rssi=-52
OK LED ON
STATUS led=1 rssi=-51
OK LED OFF
```

## TCP 项目常见坑

| 问题 | 原因 | 处理 |
| --- | --- | --- |
| 粘包 | TCP 是字节流，不保留消息边界 | 用 `\n`、固定长度或 length-prefix |
| 断线后不重连 | 只在 `setup()` 连接一次 | 在 `loop()` 检查 `client.connected()` |
| 服务端收不到 | 电脑防火墙、IP 写错、热点隔离 | 先用 `nc` 从另一台机器连服务端 |
| 中文乱码 | 串口或协议编码不统一 | 控制协议尽量用 ASCII |
| 延迟明显 | Nagle 或服务端没及时 flush | ESP8266 调 `client.setNoDelay(true)` |

## 什么时候选 TCP，不选 MQTT

选 TCP 的场景：

- 协议已经由设备厂商规定。
- 局域网内点对点控制，不需要 Broker。
- 需要和现有 TCP 网关对接。
- 设备消息格式非常简单，后端愿意自己维护连接状态。

选 MQTT 的场景：

- 设备很多。
- 需要离线状态、主题权限、保留消息、共享订阅。
- App、Web、服务端都要订阅设备状态。
- 希望 Broker 处理连接、订阅和消息分发。

