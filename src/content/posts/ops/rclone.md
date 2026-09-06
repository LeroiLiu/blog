---
title: rclone 对象存储迁移
description: 使用 rclone 在 MinIO、阿里云 OSS 等 S3 兼容对象存储之间同步和迁移数据。
---

本文用于在 MinIO、阿里云 OSS 等对象存储之间同步数据，适合做对象存储迁移、备份和数据整理。

## 安装 rclone

官方安装文档：

```txt
https://rclone.org/install/
```

Linux 安装脚本：

```sh
sudo -v
curl https://rclone.org/install.sh | sudo bash
```

## 配置文件位置

rclone 默认配置文件通常在：

```txt
~/.config/rclone/rclone.conf
```

可通过命令交互式配置：

```sh
rclone config
```

## S3 兼容配置示例

MinIO 示例：

```ini
[minio]
type = s3
provider = Minio
access_key_id = your-access-key
secret_access_key = your-secret-key
endpoint = https://minio.example.com
```

阿里云 OSS 示例：

```ini
[aliyun-oss]
type = s3
provider = Alibaba
access_key_id = your-access-key
secret_access_key = your-secret-key
endpoint = oss-cn-hangzhou.aliyuncs.com
acl = private
```

请不要把真实密钥提交到 Git 仓库。迁移完成后也要检查服务器上的配置文件权限。

## 同步命令

从 MinIO 同步到阿里云 OSS：

```sh
rclone sync minio:bucket aliyun-oss:bucket
```

常用参数：

| 参数 | 作用 |
| --- | --- |
| `--dry-run` | 只预演，不真正执行 |
| `--progress` | 显示传输进度 |
| `--transfers 8` | 并发传输数量 |
| `--checkers 16` | 并发检查数量 |
| `--log-file rclone.log` | 输出日志文件 |

建议先预演：

```sh
rclone sync minio:bucket aliyun-oss:bucket --dry-run
```

确认无误后再正式执行：

```sh
rclone sync minio:bucket aliyun-oss:bucket --progress --log-file rclone.log
```

## sync 和 copy 的区别

| 命令 | 行为 |
| --- | --- |
| `rclone copy` | 只复制新增或变化的文件，不删除目标端多余文件 |
| `rclone sync` | 让目标端和源端保持一致，会删除目标端多余文件 |

如果不确定目标端是否可以删除文件，优先使用 `copy` 或 `sync --dry-run`。
