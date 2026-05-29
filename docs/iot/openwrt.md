---
title: OpenWrt
description: OpenWrt 基础知识、固件安装升级、LuCI、软件包、uci、网络、Wi-Fi、防火墙和常见问题。
---

# OpenWrt

OpenWrt 是面向路由器和嵌入式设备的 Linux 发行版，常用于软路由、家庭网络、边缘网关、物联网接入和网络实验环境。

## 适合场景

- 家庭或小型办公路由器。
- 软路由和多网口网关。
- 设备网络调试。
- 边缘网关和 IoT 网络接入。
- DNS、DHCP、防火墙、VLAN、QoS 等网络实验。

刷机和升级有风险。操作前要确认设备型号、硬件版本、固件类型和恢复方式，避免把设备刷坏。

## 固件类型

| 类型 | 用途 |
| --- | --- |
| Factory image | 从原厂固件刷入 OpenWrt 时常用 |
| Sysupgrade image | 已经是 OpenWrt 时升级系统常用 |
| Initramfs image | 临时启动、调试、救援场景常用 |

不要把 `factory` 和 `sysupgrade` 混用。不同厂商、不同硬件版本可能需要不同固件。

## 安装前检查

刷机前先确认：

- 设备型号和硬件版本完全匹配。
- 固件来自 OpenWrt 官方或可信构建源。
- 当前固件支持通过 Web、TFTP、串口或恢复模式刷入。
- 已备份原配置。
- 了解失败后的恢复方式。
- 电脑和路由器通过网线连接更稳。

建议先阅读设备对应的 OpenWrt Wiki 页面，不要只看通用教程。

## LuCI 管理界面

LuCI 是 OpenWrt 常用 Web 管理界面。常见访问地址：

```txt
http://192.168.1.1
```

首次进入后建议：

- 设置 root 密码。
- 修改 LAN IP，避免和上级路由冲突。
- 配置 WAN、LAN、Wi-Fi。
- 配置时区和 NTP。
- 备份一份初始配置。

## SSH 和基础命令

SSH：

```sh
ssh root@192.168.1.1
```

查看版本：

```sh
cat /etc/openwrt_release
uname -a
```

查看网络：

```sh
ip addr
ip route
logread -e netifd
```

查看服务：

```sh
/etc/init.d/network status
/etc/init.d/firewall status
```

## 软件包管理

传统 OpenWrt 常用 `opkg`：

```sh
opkg update
opkg list-installed
opkg install luci
opkg remove package_name
```

部分新版本或快照可能使用新的包管理方式，实际命令以当前系统和官方说明为准。更新软件包前先确认存储空间，路由器闪存很小，装太多包容易写满。

查看空间：

```sh
df -h
```

## UCI 配置

OpenWrt 常用 UCI 管理配置。

查看配置：

```sh
uci show network
uci show wireless
uci show firewall
```

设置示例：

```sh
uci set system.@system[0].timezone='CST-8'
uci commit system
/etc/init.d/system reload
```

网络和防火墙改动要谨慎，远程操作容易把自己踢下线。

## 网络排查

| 问题 | 常见原因 | 处理方向 |
| --- | --- | --- |
| 登录不了 LuCI | IP 不在同网段、Web 服务未启动、防火墙限制 | 直连网线，SSH 检查 `uhttpd` |
| 设备不能上网 | WAN 未获取地址、网关/DNS 错误、拨号失败 | 看接口状态和 `logread` |
| LAN IP 冲突 | 上级路由也是 `192.168.1.1` | 修改 OpenWrt LAN IP |
| Wi-Fi 不显示 | 无线未启用、国家码、驱动不匹配 | 检查 `wireless` 配置和日志 |
| 安装包失败 | 软件源不匹配、网络不通、空间不足 | 检查版本、网络和剩余空间 |
| 升级后配置异常 | 旧配置不兼容 | 恢复备份或不保留配置升级 |

## 防火墙和端口

OpenWrt 的防火墙通常按 zone 管理，例如 `lan`、`wan`。开放端口前先确认服务是否真的需要被外网访问。

查看防火墙：

```sh
uci show firewall
/etc/init.d/firewall status
```

重载：

```sh
/etc/init.d/firewall reload
```

不要把路由器管理界面直接暴露到公网。需要远程维护时，优先使用 VPN 或可信内网入口。

## 升级建议

升级前：

- 下载匹配设备的 sysupgrade 固件。
- 备份配置。
- 确认剩余空间。
- 查看新版本变更和已知问题。
- 本地网络操作更稳。

升级示例：

```sh
sysupgrade -v /tmp/openwrt-sysupgrade.bin
```

如果跨大版本升级出现异常，可以考虑不保留配置，升级后手动重新配置。

## 官方入口

- [OpenWrt Documentation](https://openwrt.org/docs/start)
- [OpenWrt User Guide](https://openwrt.org/docs/guide-user/start)
- [OpenWrt Sysupgrade](https://openwrt.org/docs/guide-user/installation/sysupgrade.cli)
