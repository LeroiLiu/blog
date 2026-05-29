---
title: OpenList 与 AList 部署常见问题
description: OpenList、AList 文件列表程序的 Docker 部署、端口、管理员密码、反向代理、权限、WebDAV 和常见问题整理。
---

# OpenList 与 AList 部署常见问题

OpenList 和 AList 都常用于把本地目录、网盘、对象存储等资源整理成一个 Web 文件列表。适合个人文件管理、素材预览、临时分享和 WebDAV 场景。

::: info 官方入口
- [OpenList 文档](https://openlistteam.github.io/OpenList-Docs/)
- [OpenList GitHub](https://github.com/OpenListTeam/OpenList)
- [AList 文档](https://alistgo.com/)
:::

## 选型说明

| 项目 | 说明 |
| --- | --- |
| AList | 较早被大量使用的文件列表程序，生态资料比较多 |
| OpenList | AList 的社区 fork，强调长期治理、透明维护和开源延续 |

如果是新部署，可以优先看 OpenList；如果已有 AList，不建议没有备份就直接迁移。

## OpenList Docker 部署

准备数据目录：

```sh
mkdir -p /etc/openlist
```

使用当前用户运行：

```sh
docker run --user $(id -u):$(id -g) -d \
  --restart=unless-stopped \
  -v /etc/openlist:/opt/openlist/data \
  -p 5244:5244 \
  -e UMASK=022 \
  --name openlist \
  openlistteam/openlist:latest
```

如果使用容器内默认用户，要注意目录权限：

```sh
chown -R 1001:1001 /etc/openlist
```

查看首次管理员密码：

```sh
docker logs openlist
```

重置管理员密码：

```sh
docker exec -it openlist ./openlist admin random
docker exec -it openlist ./openlist admin set NEW_PASSWORD
```

## AList Docker 部署

```sh
docker run -d \
  --restart=unless-stopped \
  -v /etc/alist:/opt/alist/data \
  -p 5244:5244 \
  -e PUID=0 \
  -e PGID=0 \
  -e UMASK=022 \
  --name alist \
  xhofe/alist:latest
```

查看日志：

```sh
docker logs alist
```

## Docker Compose 示例

```yaml
services:
  openlist:
    image: openlistteam/openlist:latest
    container_name: openlist
    restart: unless-stopped
    ports:
      - "5244:5244"
    volumes:
      - /etc/openlist:/opt/openlist/data
    environment:
      - UMASK=022
```

启动：

```sh
docker compose up -d
```

## Nginx 反向代理

```nginx
server {
  listen 80;
  server_name files.example.com;

  location / {
    proxy_pass http://127.0.0.1:5244;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }
}
```

如果有大文件上传，还要增加：

```nginx
client_max_body_size 1024m;
proxy_request_buffering off;
```

## 常见问题

### 访问不了 5244

检查容器和端口：

```sh
docker ps
ss -lntp | grep 5244
```

如果服务器有防火墙：

```sh
firewall-cmd --add-port=5244/tcp --permanent
firewall-cmd --reload
```

生产环境更建议只开放 80/443，通过 Nginx 反代到 `127.0.0.1:5244`。

### 上传失败或目录无权限

检查挂载目录权限：

```sh
ls -ld /etc/openlist
```

如果容器使用 `1001` 用户运行：

```sh
chown -R 1001:1001 /etc/openlist
```

### 反向代理后下载链接不对

检查代理头：

```nginx
proxy_set_header Host $host;
proxy_set_header X-Forwarded-Proto $scheme;
```

如果站点放在子目录，还要确认程序本身是否支持配置站点 URL 或路径前缀。

### WebDAV 连不上

优先确认：

- 用户是否开启 WebDAV 权限。
- 客户端地址是否填写完整。
- 反向代理是否正确转发 `PROPFIND`、`PUT`、`DELETE` 等方法。
- HTTPS 证书是否可信。

## 安全建议

- 不要把管理后台暴露给完全公开的网络，至少设置强密码。
- 反向代理层可以加 Basic Auth、IP 白名单或 Cloudflare Access。
- 不要把服务器根目录挂载给文件列表程序。
- 分享外链要设置过期时间或访问密码。
- 定期备份配置目录。
