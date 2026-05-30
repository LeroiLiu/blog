---
title: 物联网与消息
description: Arduino、ROS 2、SLAM 算法、OpenWrt、MQTT、MQTT 消息积压、EMQX、Mosquitto、设备通信、嵌入式网络、消息模型和常见问题整理。
---

# 物联网与消息

这里整理设备接入、机器人开发、消息通信、嵌入式网络和轻量协议相关内容。当前重点是 Arduino、ROS 2、SLAM 算法、OpenWrt、MQTT、MQTT 消息积压、EMQX、Mosquitto，后续可以继续补充传感器、串口、蓝牙、Modbus、边缘网关和设备运维。

## 内容

| 页面 | 内容 |
| --- | --- |
| [Arduino 基础](/iot/arduino) | 开发板、IDE、串口、引脚、Blink、库管理和常见问题 |
| [ESP8266 MQTT 实战](/iot/esp8266-arduino-mqtt) | ESP8266 连接 Wi-Fi 与 MQTT，温湿度上报、LED 控制、掉线重连和 JSON 消息 |
| [ESP8266 TCP 实战](/iot/esp8266-tcp-client-server) | ESP8266 TCP Client、TCP Server、心跳、命令下发和本地控制 |
| [ESP8266 UDP 实战](/iot/esp8266-udp-discovery) | ESP8266 UDP 局域网发现、广播控制、单播响应和丢包处理 |
| [ESP8266 综合案例](/iot/esp8266-sensor-relay-project) | 温湿度、继电器、MQTT 控制、本地按钮和离线兜底 |
| [ROS 2 快速入门](/iot/ros2-quickstart) | ROS 2 发行版选择、安装、环境变量、命令、工作空间和常见报错 |
| [SLAM 算法快速入门](/iot/slam-algorithms) | SLAM 概念、视觉 SLAM、激光 SLAM、VIO、后端优化、回环检测和常见问题 |
| [OpenWrt](/iot/openwrt) | 路由器固件、LuCI、SSH、软件包、UCI、网络、防火墙和升级问题 |
| [MQTT 基础](/iot/mqtt) | Broker、Client、Topic、QoS、Retain、Will、认证和排障 |
| [MQTT 消息积压处理](/iot/mqtt-message-backlog-emqx-php) | EMQX + ThinkPHP 8 + MySQL 的消息积压、Webhook、共享订阅、幂等和削峰方案 |
| [EMQX](/iot/emqx) | EMQX 安装、端口、Dashboard、认证、桥接和常见问题 |
| [Mosquitto](/iot/mosquitto) | Mosquitto 安装、配置、密码、测试命令和常见问题 |

## 常见场景

- 设备上报传感器数据。
- 服务端下发控制指令。
- App 或 Web 实时查看设备状态。
- 设备离线告警。
- 边缘网关采集后统一上云。
- 多协议设备通过网关转换为 MQTT。
- 机器人节点通过 ROS 2 协作处理传感器、控制、仿真和导航。
- 移动机器人通过视觉、激光、IMU 做 SLAM 定位与建图。
