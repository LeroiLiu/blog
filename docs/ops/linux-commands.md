---
title: 常用 Linux 命令
description: Linux 进程查看、服务启动、防火墙端口、历史记录、日志、磁盘和服务器维护常用命令。
---

# 常用 Linux 命令

本文整理服务器维护时常见的 Linux 命令，适合用作进程、服务、防火墙、日志和磁盘排查的速查页。

## 查看进程

查看某个进程是否存在：

```sh
ps -aux | grep mosquitto
```

![查看 mosquitto 进程](/images/articles/linux-mosquitto-process.png)

也可以使用更常见的写法：

```sh
ps aux | grep mosquitto
```

更推荐配合 `pgrep`：

```sh
pgrep -af mosquitto
```

## 启动 Mosquitto

使用指定配置文件后台启动：

```sh
mosquitto -c /etc/mosquitto/mosquitto.conf -d
```

![后台启动 mosquitto](/images/articles/linux-mosquitto-start.png)

如果是 systemd 管理的服务，优先使用：

```sh
systemctl status mosquitto
systemctl start mosquitto
systemctl restart mosquitto
```

## 结束进程

强制结束进程示例：

```sh
kill -9 7738
```

![关闭后台服务](/images/articles/linux-kill-process.png)

`kill -9` 会强制结束进程，适合进程无法正常退出时使用。普通场景建议先尝试：

```sh
kill 7738
```

确认进程仍无法退出，再使用 `kill -9`。

## 防火墙开放端口

开放 TCP 端口：

```sh
firewall-cmd --zone=public --add-port=50013/tcp --permanent
firewall-cmd --reload
```

查看已开放端口：

```sh
firewall-cmd --list-ports
```

## 清理 Bash 历史记录

第一步删除 `.bash_history` 文件，第二步清空当前会话的命令历史记录：

```sh
rm -rf ~/.bash_history
history -c
```

这会清理当前用户的 Bash 历史记录。需要注意，删除历史记录可能影响后续审计和问题回溯，生产服务器上应谨慎使用。

## 查看日志

查看服务日志：

```sh
journalctl -u nginx -f
journalctl -u docker --since "1 hour ago"
```

查看文件日志：

```sh
tail -n 200 /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

## 查看磁盘与内存

```sh
df -h
du -sh /var/log
free -h
top
```

如果磁盘满了，先定位大目录，再决定是否清理：

```sh
du -h --max-depth=1 /var | sort -h
```
