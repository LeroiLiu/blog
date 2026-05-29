---
title: Arduino 基础
description: Arduino 开发板、IDE、串口、引脚、Blink、库管理、传感器接线和常见问题。
---

# Arduino 基础

Arduino 适合快速学习单片机、传感器、执行器和简单物联网原型。入门重点不是一开始写复杂项目，而是先把开发板、串口、引脚、电源和库管理跑通。

## 基础概念

| 概念 | 说明 |
| --- | --- |
| Board | 开发板型号，例如 Uno、Nano、Mega、ESP32 系列 |
| Sketch | Arduino 项目代码 |
| `setup()` | 上电或复位后执行一次 |
| `loop()` | 循环执行的主逻辑 |
| Digital Pin | 数字输入输出引脚 |
| Analog Pin | 模拟输入引脚 |
| PWM | 用数字引脚模拟不同占空比输出 |
| Serial | 串口调试和通信 |

## Blink 示例

最常见的入门程序是点亮板载 LED。

```cpp
void setup() {
  pinMode(LED_BUILTIN, OUTPUT);
}

void loop() {
  digitalWrite(LED_BUILTIN, HIGH);
  delay(1000);
  digitalWrite(LED_BUILTIN, LOW);
  delay(1000);
}
```

如果 Blink 都无法上传，先不要接传感器，优先排查开发板、端口、驱动和线材。

## 串口调试

```cpp
void setup() {
  Serial.begin(9600);
}

void loop() {
  Serial.println("hello arduino");
  delay(1000);
}
```

串口监视器的波特率要和 `Serial.begin()` 一致。

## 常用排查

| 问题 | 常见原因 | 处理方向 |
| --- | --- | --- |
| 找不到端口 | 数据线只能充电、驱动缺失、板子未识别 | 换数据线、看系统设备列表 |
| 上传失败 | 板型选错、端口选错、Bootloader 问题 | 选对 Board 和 Port |
| 串口乱码 | 波特率不一致 | 串口监视器和代码保持一致 |
| 传感器无数据 | 接线、电压、库、通信地址错误 | 查模块文档和示例代码 |
| 板子反复重启 | 供电不足、短路、外设电流过大 | 独立供电并检查接线 |
| 编译找不到库 | 库未安装或头文件名错误 | Library Manager 安装依赖 |

## 接线建议

- 先断电再接线。
- 注意 3.3V 和 5V 电平差异。
- 外设电流较大时不要直接从开发板引脚供电。
- 共地很重要，多个电源模块通信时要确认 GND 连接。
- 不确定模块电压时先查规格，不要凭感觉接。

## 和 MQTT 结合

Arduino 或 ESP32 常见物联网流程：

1. 连接 Wi-Fi。
2. 读取传感器数据。
3. 通过 MQTT 发布到 topic。
4. 订阅控制 topic。
5. 根据服务端指令控制继电器、LED、屏幕等。

设备侧要特别注意断线重连、心跳、认证信息保护和消息频率。

## 官方入口

- [Arduino Documentation](https://docs.arduino.cc/)
- [Arduino IDE](https://docs.arduino.cc/software/ide/)
