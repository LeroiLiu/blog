---
title: ESP8266 MQTT 实战：温湿度上报与远程控制
description: 使用 Arduino 开发 ESP8266，连接 Wi-Fi 与 MQTT Broker，实现 DHT11 温湿度上报、LED 远程控制、掉线重连和 JSON 消息处理。
---

# ESP8266 MQTT 实战：温湿度上报与远程控制

这篇文章按一个真实小项目来写：ESP8266 读取 DHT11 温湿度，每 5 秒发布到 MQTT；同时订阅控制主题，收到 `{"led":1}` 就点亮 LED，收到 `{"led":0}` 就关闭。

## 硬件清单

| 硬件 | 说明 |
| --- | --- |
| NodeMCU ESP8266 | 常见开发板，板载 USB 转串口 |
| DHT11 或 DHT22 | 温湿度传感器 |
| LED + 220R 电阻 | 用来模拟设备控制 |
| 杜邦线 | 接线 |
| MQTT Broker | 可用本机 Mosquitto、EMQX 或云 Broker |

## 接线

| 模块 | ESP8266 引脚 |
| --- | --- |
| DHT VCC | 3V3 |
| DHT GND | GND |
| DHT DATA | D5 |
| LED 正极 | D1，串 220R 电阻 |
| LED 负极 | GND |

NodeMCU 的 `D1`、`D5` 是板子丝印名，不是裸芯片 GPIO 编号。代码里可以直接使用 `D1`、`D5`。

## Broker 测试

本机用 Mosquitto 时，可以先开两个终端：

```bash
mosquitto_sub -h 192.168.1.10 -t 'home/esp8266/+/+' -v
```

```bash
mosquitto_pub -h 192.168.1.10 -t 'home/esp8266/001/cmd' -m '{"led":1}'
```

如果这两个命令互相能收到消息，再接 ESP8266。这样可以把问题分成 Broker 问题和设备问题。

## 安装 Arduino 库

Arduino IDE 里安装这些库：

| 库 | 用途 |
| --- | --- |
| PubSubClient | MQTT 客户端 |
| ArduinoJson | JSON 解析与生成 |
| DHT sensor library | 读取 DHT11/DHT22 |
| Adafruit Unified Sensor | DHT 依赖 |

## 完整代码

把 `WIFI_SSID`、`WIFI_PASS`、`MQTT_HOST` 改成自己的环境即可。

```cpp
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

const char* WIFI_SSID = "your-wifi";
const char* WIFI_PASS = "your-password";

const char* MQTT_HOST = "192.168.1.10";
const uint16_t MQTT_PORT = 1883;
const char* MQTT_USER = "";
const char* MQTT_PASS = "";

const char* DEVICE_ID = "001";
const int LED_PIN = D1;
const int DHT_PIN = D5;

#define DHT_TYPE DHT11

WiFiClient net;
PubSubClient mqtt(net);
DHT dht(DHT_PIN, DHT_TYPE);

unsigned long lastPublishAt = 0;
const unsigned long publishInterval = 5000;

String topicStatus() {
  return String("home/esp8266/") + DEVICE_ID + "/status";
}

String topicTelemetry() {
  return String("home/esp8266/") + DEVICE_ID + "/telemetry";
}

String topicCommand() {
  return String("home/esp8266/") + DEVICE_ID + "/cmd";
}

void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  Serial.print("wifi connecting");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("wifi ok, ip=");
  Serial.println(WiFi.localIP());
}

void publishStatus(const char* state) {
  StaticJsonDocument<128> doc;
  doc["device"] = DEVICE_ID;
  doc["state"] = state;
  doc["rssi"] = WiFi.RSSI();

  char payload[128];
  size_t len = serializeJson(doc, payload);
  mqtt.publish(topicStatus().c_str(), payload, len, true);
}

void handleCommand(char* topic, byte* payload, unsigned int length) {
  Serial.print("cmd topic=");
  Serial.println(topic);

  StaticJsonDocument<128> doc;
  DeserializationError err = deserializeJson(doc, payload, length);
  if (err) {
    Serial.print("json error: ");
    Serial.println(err.c_str());
    return;
  }

  if (doc.containsKey("led")) {
    int value = doc["led"];
    digitalWrite(LED_PIN, value == 1 ? HIGH : LOW);
    publishStatus(value == 1 ? "led_on" : "led_off");
  }
}

void connectMQTT() {
  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(handleCommand);

  while (!mqtt.connected()) {
    String clientId = String("esp8266-") + DEVICE_ID + "-" + String(ESP.getChipId(), HEX);

    Serial.print("mqtt connecting as ");
    Serial.println(clientId);

    bool ok;
    if (strlen(MQTT_USER) > 0) {
      ok = mqtt.connect(clientId.c_str(), MQTT_USER, MQTT_PASS, topicStatus().c_str(), 1, true, "{\"state\":\"offline\"}");
    } else {
      ok = mqtt.connect(clientId.c_str(), topicStatus().c_str(), 1, true, "{\"state\":\"offline\"}");
    }

    if (ok) {
      Serial.println("mqtt ok");
      mqtt.subscribe(topicCommand().c_str());
      publishStatus("online");
    } else {
      Serial.print("mqtt failed, rc=");
      Serial.println(mqtt.state());
      delay(2000);
    }
  }
}

void publishTelemetry() {
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("dht read failed");
    return;
  }

  StaticJsonDocument<192> doc;
  doc["device"] = DEVICE_ID;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["rssi"] = WiFi.RSSI();
  doc["uptime"] = millis() / 1000;

  char payload[192];
  size_t len = serializeJson(doc, payload);
  mqtt.publish(topicTelemetry().c_str(), payload, len);

  Serial.print("publish ");
  Serial.println(payload);
}

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  digitalWrite(LED_PIN, LOW);
  dht.begin();

  connectWiFi();
  connectMQTT();
}

void loop() {
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  if (!mqtt.connected()) {
    connectMQTT();
  }

  mqtt.loop();

  unsigned long now = millis();
  if (now - lastPublishAt >= publishInterval) {
    lastPublishAt = now;
    publishTelemetry();
  }
}
```

## 订阅与控制

订阅设备上报：

```bash
mosquitto_sub -h 192.168.1.10 -t 'home/esp8266/001/#' -v
```

打开 LED：

```bash
mosquitto_pub -h 192.168.1.10 -t 'home/esp8266/001/cmd' -m '{"led":1}'
```

关闭 LED：

```bash
mosquitto_pub -h 192.168.1.10 -t 'home/esp8266/001/cmd' -m '{"led":0}'
```

你应该能看到类似输出：

```text
home/esp8266/001/status {"device":"001","state":"online","rssi":-48}
home/esp8266/001/telemetry {"device":"001","temperature":26.5,"humidity":62,"rssi":-51,"uptime":31}
home/esp8266/001/status {"device":"001","state":"led_on","rssi":-49}
```

## 主题设计

这个案例使用：

| Topic | 方向 | 说明 |
| --- | --- | --- |
| `home/esp8266/001/telemetry` | 设备到服务端 | 温湿度、信号强度、运行时间 |
| `home/esp8266/001/status` | 设备到服务端 | 在线、离线、控制结果 |
| `home/esp8266/001/cmd` | 服务端到设备 | 控制命令 |

实际项目建议把 `home` 换成项目名，例如 `factory/a-line/esp8266/001/telemetry`。设备多了以后，主题层级越清楚，后端订阅和权限控制越容易做。

## 常见问题

### MQTT 一直 `rc=-2`

`-2` 通常是 TCP 连不上 Broker。

排查顺序：

1. ESP8266 串口里的 IP 是否和 Broker 在同一个网络。
2. `MQTT_HOST` 是否写成了电脑的局域网 IP，而不是 `127.0.0.1`。
3. Broker 1883 端口是否被防火墙拦截。
4. 手机热点场景下，客户端之间是否被热点隔离。

### MQTT 一直 `rc=5`

`5` 通常是用户名或密码错误。先用命令行确认：

```bash
mosquitto_pub -h 192.168.1.10 -u your-user -P your-pass -t test -m ok
```

命令行能发成功，再检查 Arduino 代码里的用户名、密码和认证配置。

### 设备在线状态不准

代码里使用了 MQTT Last Will：

```cpp
mqtt.connect(clientId.c_str(), topicStatus().c_str(), 1, true, "{\"state\":\"offline\"}");
```

如果设备异常断电，Broker 会替它发布 `offline`。如果设备主动重启太快，可能会出现在线离线频繁跳动，可以在服务端做 10 到 30 秒防抖。

### DHT 偶尔读取失败

DHT11 本身速度慢、精度一般，偶发失败正常。不要在失败时立刻重启设备，跳过本次上报即可。生产环境可以换 SHT30、AHT20、BME280 这类传感器。

