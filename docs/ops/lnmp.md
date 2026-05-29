---
title: LNMP 一键安装
description: LNMP 一键安装包的安装流程、安装前检查、常用命令、虚拟主机和常见报错。
---

# LNMP 一键安装

LNMP 一键安装包适合快速部署 Linux、Nginx、MySQL 或 MariaDB、PHP 环境。它的优点是省事，缺点是会接管较多系统组件，所以建议在干净服务器上安装。

## 安装前检查

安装前先确认：

- 服务器是新环境，或者已经备份旧站点和数据库。
- 系统源可用，能正常使用 `yum`、`dnf` 或 `apt`。
- 内存、磁盘空间满足所选 PHP、MySQL、MariaDB 版本要求。
- `80`、`443`、`3306` 等端口没有被其他服务占用。
- 云服务器安全组和系统防火墙策略清楚。
- SSH 会话建议放在 `screen` 或 `tmux` 中，避免网络断开导致安装中断。

安装 `screen`：

```sh
yum install -y screen
```

或：

```sh
apt-get update
apt-get install -y screen
```

进入安装会话：

```sh
screen -S lnmp
```

## 安装 LNMP

当前官方稳定版示例：

```sh
wget https://soft.lnmp.com/lnmp/lnmp2.2.tar.gz -O lnmp2.2.tar.gz
tar zxf lnmp2.2.tar.gz
cd lnmp2.2
./install.sh lnmp
```

也可以合并成一行：

```sh
wget https://soft.lnmp.com/lnmp/lnmp2.2.tar.gz -O lnmp2.2.tar.gz && tar zxf lnmp2.2.tar.gz && cd lnmp2.2 && ./install.sh lnmp
```

如果需要 Apache：

```sh
./install.sh lnmpa
```

如果只需要 LAMP：

```sh
./install.sh lamp
```

安装过程中会选择 MySQL、MariaDB、PHP 等版本。生产环境建议选长期维护、项目兼容、服务器资源能承受的版本，不要只追最新。

## 常用命令

常用脚本命令以当前安装版本为准，可以先看帮助：

```sh
lnmp
lnmp status
lnmp restart
lnmp vhost add
lnmp ssl add
```

常见目录：

- 默认网站目录：`/home/wwwroot/`
- Nginx 主配置：`/usr/local/nginx/conf/nginx.conf`
- Nginx 虚拟主机：`/usr/local/nginx/conf/vhost/`
- MySQL 数据目录：安装时可能自定义，以实际配置为准。

## 添加站点后的检查

添加站点后建议检查：

```sh
nginx -t
lnmp restart
tail -n 100 /usr/local/nginx/logs/error.log
```

PHP 项目要确认：

- 入口目录是否指向 `public`。
- 伪静态规则是否匹配框架版本。
- PHP 版本和扩展是否满足项目。
- 运行目录、缓存目录、上传目录是否可写。

## 常见报错

| 问题 | 常见原因 | 处理方向 |
| --- | --- | --- |
| `wget: command not found` | 系统没有安装 wget | `yum install wget` 或 `apt-get install wget` |
| 安装中断 | SSH 断开或系统源不可用 | 使用 `screen`，检查软件源 |
| 端口被占用 | 原有 Nginx、Apache、MySQL 已启动 | `ss -lntp` 找到并停止冲突服务 |
| 编译失败 | 系统太新或太旧、依赖缺失、内存不足 | 更换兼容版本或选择二进制安装 |
| MySQL 安装慢 | 编译安装耗时长 | 内存足够时优先考虑官方支持的二进制选项 |
| 网站 404 | vhost、root 或伪静态错误 | 检查虚拟主机配置和真实文件路径 |
| PHP 500 | 扩展缺失、权限、代码异常 | 看 PHP 和应用日志 |
| 证书申请失败 | 域名未解析、80 端口不可访问 | 检查 DNS、安全组、防火墙 |

## 什么时候不建议用一键包

以下场景更适合 Docker、1Panel、云数据库或手工拆分服务：

- 同一台服务器要跑很多不同版本的 PHP。
- 需要严格可重复部署。
- 需要容器化、灰度发布或 <code>CI/CD</code>。
- 需要多人维护，且希望配置更加标准化。
- 已经有成熟的 Nginx、MySQL、PHP 环境，不想被安装脚本覆盖。

## 官方入口

- [LNMP 一键安装包安装文档](https://lnmp.org/install.html)
