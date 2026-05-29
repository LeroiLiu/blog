---
title: 运维专题
description: Linux、SSH、Docker、Kubernetes、Nginx、Apache、LNMP、1Panel、宝塔、OpenList、AList、Cloudflare Tunnel、ngrok、对象存储和部署排障记录。
---

# 运维专题

这里整理服务器维护、对象存储、命令行工具和部署排障相关内容。目标是把常用命令写成可以直接检索、可以复用的操作手册。

## 页面索引

| 页面 | 内容 |
| --- | --- |
| [常用 Linux 命令](/ops/linux-commands) | 进程、服务、防火墙、历史记录、日志和磁盘查看 |
| [Docker 运维](/ops/docker) | Docker 安装、容器、镜像、数据卷、Compose、日志和常见报错 |
| [Kubernetes 运维](/ops/kubernetes) | kubeadm、containerd、kubectl、节点状态、Pod 排查和常见报错 |
| [Nginx 配置](/ops/nginx) | 静态站、PHP-FPM、反向代理、HTTPS、常见报错 |
| [Apache 配置](/ops/apache) | 虚拟主机、PHP-FPM、重写规则、常见报错 |
| [LNMP 一键安装](/ops/lnmp) | LNMP、LNMPA、LAMP 安装流程和排障 |
| [1Panel 面板](/ops/onepanel) | 1Panel 安装、登录信息、端口、安全和应用管理 |
| [宝塔面板](/ops/baota) | 宝塔安装、建站、PHP、MySQL、SSL、备份、安全和常见问题 |
| [SSH 密钥生成与配置](/ops/ssh-keys) | SSH 密钥、免密登录、多密钥、Git 仓库密钥和常见报错 |
| [OpenList 与 AList](/ops/openlist-alist) | 文件列表程序、Docker 部署、权限、反向代理、WebDAV |
| [Cloudflare Tunnel](/ops/cloudflare-tunnel) | cloudflared、内网服务公网访问、DNS 路由和常见错误 |
| [内网穿透与 ngrok](/ops/intranet-tunnel-ngrok) | ngrok、SSH 反向隧道、Webhook、本地预览和安全建议 |
| [MinIO 对象存储安装](/ops/minio) | Docker 安装 MinIO、数据目录、控制台端口、反向代理 |
| [rclone 对象存储迁移](/ops/rclone) | MinIO 到阿里云 OSS 等对象存储迁移思路 |
| [curl/wget HTTPS 证书](/ops/curl-wget-ssl) | 临时跳过证书校验以及风险说明 |

## 写运维文档的建议

运维命令最怕“当时能用，过几个月看不懂”。建议每段命令都补上：

- 适用系统或软件版本。
- 命令作用。
- 可能的风险。
- 验证方式。
- 回滚或恢复方式。

这样以后遇到同类问题时，不需要重新猜命令当时的上下文。
