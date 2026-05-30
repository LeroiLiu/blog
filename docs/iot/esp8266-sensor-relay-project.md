---
title: ESP8266 综合案例：温湿度、继电器、MQTT 控制与本地兜底
description: 一个更完整的 ESP8266 小项目，使用 DHT11、继电器、MQTT、按钮和离线兜底逻辑，实现温湿度上报、远程开关、本地按钮控制和安全限制。
---

# ESP8266 综合案例：温湿度、继电器、MQTT 控制与本地兜底

这个案例比单独 MQTT 更接近真实设备：一个 ESP8266 控制继电器，读取温湿度，通过 MQTT 上报状态，接收远程开关命令，同时保留本地按钮。网络断了以后，按钮仍然能控制继电器。

## 目标功能

| 功能 | 说明 |
| --- | --- |
| 温湿度上报 | 每 10 秒发布一次 |
| 继电器控制 | 支持 MQTT 命令和本地按钮 |
| 状态保持 | 每次控制后发布当前状态 |
| 安全限制 | 继电器每次最多连续打开 30 分钟 |
| 离线兜底 | MQTT 不在线也能用按钮控制 |
| 设备遗嘱 | 异常断线后 Broker 标记设备离线 |

## 接线

| 模块 | ESP8266 |
| --- | --- |
| DHT DATA | D5 |
| 继电器 IN | D2 |
| 按钮一端 | D6 |
| 按钮另一端 | GND |
| DHT VCC、继电器 VCC | 3V3 或独立 5V，按模块规格 |
| GND | 共地 |

很多继电器模块是低电平触发，如果你的模块相反，改 `RELAY_ON` 和 `RELAY_OFF`。

## MQTT 消息

### 上报状态

Topic：

```text
device/esp001/state
```

Payload：

```json
{
  "relay": 1,
  "source": "mqtt",
  "temperature": 26.4,
  "humidity": 61.2,
  "rssi": -48,
  "uptime": 120
}
```

### 下发命令

Topic：

```text
device/esp001/cmd
```

Payload：

```json
{"relay":1}
```

```json
{"relay":0}
```

## 完整代码

```cpp
#include <ESP8266WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

const char* WIFI_SSID = "your-wifi";
const char* WIFI_PASS = "your-password";

const char* MQTT_HOST = "192.168.1.10";
const uint16_t MQTT_PORT = 1883;

const char* DEVICE_ID = "esp001";

const int DHT_PIN = D5;
const int RELAY_PIN = D2;
const int BUTTON_PIN = D6;

const int RELAY_ON = LOW;
const int RELAY_OFF = HIGH;

const unsigned long REPORT_INTERVAL = 10000;
const unsigned long MAX_ON_TIME = 30UL * 60UL * 1000UL;
const unsigned long DEBOUNCE_MS = 40;

#define DHT_TYPE DHT11

WiFiClient net;
PubSubClient mqtt(net);
DHT dht(DHT_PIN, DHT_TYPE);

bool relayOn = false;
bool lastButtonLevel = HIGH;
bool stableButtonLevel = HIGH;
unsigned long buttonChangedAt = 0;
unsigned long relayOnAt = 0;
unsigned long lastReportAt = 0;

String topicState() {
  return String("device/") + DEVICE_ID + "/state";
}

String topicCmd() {
  return String("device/") + DEVICE_ID + "/cmd";
}

String topicOnline() {
  return String("device/") + DEVICE_ID + "/online";
}

void setRelay(bool on, const char* source) {
  relayOn = on;
  digitalWrite(RELAY_PIN, on ? RELAY_ON : RELAY_OFF);

  if (on) {
    relayOnAt = millis();
  } else {
    relayOnAt = 0;
  }

  Serial.print("relay ");
  Serial.print(on ? "on" : "off");
  Serial.print(" by ");
  Serial.println(source);
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) {
    return;
  }

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  unsigned long started = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - started < 15000) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  if (WiFi.status() == WL_CONNECTED) {
    Serial.print("wifi ip=");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println("wifi timeout, local button still works");
  }
}

void publishState(const char* source) {
  if (!mqtt.connected()) {
    return;
  }

  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  StaticJsonDocument<256> doc;
  doc["relay"] = relayOn ? 1 : 0;
  doc["source"] = source;
  doc["rssi"] = WiFi.RSSI();
  doc["uptime"] = millis() / 1000;

  if (!isnan(temperature)) {
    doc["temperature"] = temperature;
  }
  if (!isnan(humidity)) {
    doc["humidity"] = humidity;
  }

  char payload[256];
  size_t len = serializeJson(doc, payload);
  mqtt.publish(topicState().c_str(), payload, len, true);

  Serial.print("state ");
  Serial.println(payload);
}

void onMqttMessage(char* topic, byte* payload, unsigned int length) {
  StaticJsonDocument<128> doc;
  DeserializationError err = deserializeJson(doc, payload, length);
  if (err) {
    Serial.print("cmd json error ");
    Serial.println(err.c_str());
    return;
  }

  if (doc.containsKey("relay")) {
    bool on = doc["relay"].as<int>() == 1;
    setRelay(on, "mqtt");
    publishState("mqtt");
  }
}

void connectMQTT() {
  if (WiFi.status() != WL_CONNECTED || mqtt.connected()) {
    return;
  }

  mqtt.setServer(MQTT_HOST, MQTT_PORT);
  mqtt.setCallback(onMqttMessage);

  String clientId = String("esp8266-") + DEVICE_ID + "-" + String(ESP.getChipId(), HEX);
  bool ok = mqtt.connect(clientId.c_str(), topicOnline().c_str(), 1, true, "0");

  if (!ok) {
    Serial.print("mqtt failed rc=");
    Serial.println(mqtt.state());
    return;
  }

  mqtt.publish(topicOnline().c_str(), "1", true);
  mqtt.subscribe(topicCmd().c_str());
  publishState("boot");
}

void readButton() {
  bool level = digitalRead(BUTTON_PIN);

  if (level != lastButtonLevel) {
    lastButtonLevel = level;
    buttonChangedAt = millis();
  }

  if (millis() - buttonChangedAt > DEBOUNCE_MS && level != stableButtonLevel) {
    stableButtonLevel = level;

    if (stableButtonLevel == LOW) {
      setRelay(!relayOn, "button");
      publishState("button");
    }
  }
}

void checkSafety() {
  if (relayOn && relayOnAt > 0 && millis() - relayOnAt > MAX_ON_TIME) {
    setRelay(false, "safety");
    publishState("safety");
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  digitalWrite(RELAY_PIN, RELAY_OFF);
  dht.begin();

  connectWiFi();
  connectMQTT();
}

void loop() {
  readButton();
  checkSafety();

  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }

  if (!mqtt.connected()) {
    connectMQTT();
  }

  if (mqtt.connected()) {
    mqtt.loop();
  }

  unsigned long now = millis();
  if (now - lastReportAt > REPORT_INTERVAL) {
    lastReportAt = now;
    publishState("report");
  }
}
```

## 命令测试

订阅状态：

```bash
mosquitto_sub -h 192.168.1.10 -t 'device/esp001/#' -v
```

打开继电器：

```bash
mosquitto_pub -h 192.168.1.10 -t 'device/esp001/cmd' -m '{"relay":1}'
```

关闭继电器：

```bash
mosquitto_pub -h 192.168.1.10 -t 'device/esp001/cmd' -m '{"relay":0}'
```

看在线状态：

```bash
mosquitto_sub -h 192.168.1.10 -t 'device/esp001/online' -v
```

异常断电后，Broker 会收到：

```text
device/esp001/online 0
```

## 继电器安全注意

如果继电器控制的是真实电器，建议至少做到：

- 强弱电隔离，接线盒封闭。
- 继电器额定电流大于负载电流。
- 高功率设备不要用便宜小继电器硬扛。
- 程序里加最大开启时间，避免网络异常导致长期开启。
- 关键设备使用物理急停或机械开关兜底。

## 可继续扩展

这个案例可以继续加：

- OTA 升级。
- NTP 校时。
- MQTT 用户名密码。
- TLS。
- Home Assistant discovery。
- Web 配网。
- EEPROM 或 LittleFS 保存配置。

真实项目里，最先补的通常是配置保存和 OTA，不然每次改 Wi-Fi 或 Broker 都要重新烧录。

