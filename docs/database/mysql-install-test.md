---
title: MySQL 安装与测试
description: MySQL 在 Linux 服务器上的安装、初始化、安全配置、连接测试、远程访问和常见报错排查。
---

# MySQL 安装与测试

MySQL 安装完成不等于环境可用。更稳的流程是：安装服务、确认启动、执行安全初始化、创建业务库和账号、本机连接测试、远程连接测试、确认字符集和备份方式。

## 安装前检查

先确认：

- 系统版本和 CPU 架构。
- 磁盘空间是否足够。
- 服务器是否已有 MySQL、MariaDB、Percona Server。
- `3306` 端口是否被占用。
- 是否需要指定 MySQL LTS 版本。
- 是否已经备份旧数据库。

查看端口：

```sh
ss -lntp | grep 3306
```

查看已安装包：

```sh
rpm -qa | grep -i mysql
dpkg -l | grep -i mysql
```

## Ubuntu / Debian 安装

如果使用系统仓库：

```sh
sudo apt update
sudo apt install -y mysql-server
sudo systemctl enable mysql
sudo systemctl start mysql
```

如果需要使用 MySQL 官方 APT 仓库，先到官方页面下载 `mysql-apt-config` 包，再执行：

```sh
sudo dpkg -i mysql-apt-config_*.deb
sudo apt update
sudo apt install -y mysql-server
```

官方仓库方式更适合明确指定 MySQL 版本系列；系统仓库方式更省事，但版本由发行版维护。

## RHEL / Rocky / AlmaLinux 安装

如果使用系统仓库：

```sh
sudo dnf install -y mysql-server
sudo systemctl enable mysqld
sudo systemctl start mysqld
```

如果使用 MySQL 官方 Yum 仓库，先下载对应系统版本的 release 包，再执行：

```sh
sudo rpm -Uvh mysql84-community-release-*.rpm
sudo dnf install -y mysql-community-server
sudo systemctl enable mysqld
sudo systemctl start mysqld
```

release 包名称会随系统版本和 MySQL 版本变化，实际以官方下载页为准。

## 初始化安全配置

```sh
sudo mysql_secure_installation
```

常见会配置：

- root 密码。
- 是否移除匿名用户。
- 是否禁止 root 远程登录。
- 是否删除 test 数据库。
- 是否重新加载权限表。

生产环境建议禁止 root 远程登录，业务系统使用独立账号。

## 服务测试

查看服务：

```sh
sudo systemctl status mysql
sudo systemctl status mysqld
```

不同系统服务名可能是 `mysql` 或 `mysqld`。

查看版本：

```sh
mysql --version
```

登录测试：

```sh
mysql -u root -p
```

执行 SQL：

```sql
SELECT VERSION();
SHOW DATABASES;
SHOW VARIABLES LIKE 'character_set_server';
SHOW VARIABLES LIKE 'collation_server';
```

## 创建业务库和账号

MySQL 8 常用示例：

```sql
CREATE DATABASE app DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'app'@'%' IDENTIFIED BY 'StrongPasswordHere!';
GRANT ALL PRIVILEGES ON app.* TO 'app'@'%';
FLUSH PRIVILEGES;
```

如果是 MySQL 5.7 或更旧版本，可以使用：

```sql
CREATE DATABASE app DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

业务账号不要直接授予所有库的权限。只给它需要访问的数据库。

## 本机连接测试

```sh
mysql -h 127.0.0.1 -P 3306 -u app -p app
```

如果 `localhost` 连接异常，改用 `127.0.0.1`，可以避免 socket 和 TCP 连接方式混淆。

## 远程连接测试

先确认 MySQL 监听地址。

常见配置文件位置：

- `/etc/mysql/mysql.conf.d/mysqld.cnf`
- `/etc/my.cnf`
- `/etc/my.cnf.d/mysql-server.cnf`

如果要允许远程连接，通常需要调整：

```ini
bind-address = 0.0.0.0
```

重启：

```sh
sudo systemctl restart mysql
sudo systemctl restart mysqld
```

再检查监听：

```sh
ss -lntp | grep 3306
```

远程连接同时需要满足：

- 数据库用户 host 允许远程来源。
- 系统防火墙开放 `3306`。
- 云服务器安全组开放 `3306`。
- MySQL 只允许可信来源访问，不要随意对公网开放。

## 备份和恢复测试

备份：

```sh
mysqldump -u root -p --single-transaction --routines --triggers app > app.sql
```

恢复：

```sh
mysql -u root -p app < app.sql
```

备份文件要定期恢复验证。只有能恢复的备份才算真正可用。

## 常见报错

| 报错 | 常见原因 | 处理方向 |
| --- | --- | --- |
| `Access denied for user` | 账号、密码、host 或权限不对 | 检查 `mysql.user` 和授权 |
| `Can't connect to local MySQL server through socket` | MySQL 未启动或 socket 路径不对 | 检查服务状态，改用 TCP 测试 |
| `Connection refused` | 服务未监听端口或防火墙拦截 | `ss -lntp`、防火墙、安全组 |
| `Unknown database` | 数据库不存在或连接库名写错 | `SHOW DATABASES` |
| `Too many connections` | 连接池过大或连接泄漏 | 查慢查询、连接数、应用连接池 |
| `Packet for query is too large` | 数据包超过限制 | 调整 `max_allowed_packet` |
| 中文乱码 | 字符集、连接字符集、表字段不一致 | 统一使用 `utf8mb4` |
| `Authentication plugin 'caching_sha2_password'` | 客户端太旧 | 升级客户端或调整账号认证插件 |

## 官方入口

- [MySQL Installing MySQL on Linux](https://dev.mysql.com/doc/refman/8.4/en/linux-installation.html)
- [MySQL APT Repository Guide](https://dev.mysql.com/doc/mysql-apt-repo-quick-guide/en/)
