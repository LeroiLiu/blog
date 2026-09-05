---
title: Docker 运维
description: Docker Engine 安装、hello-world 测试、容器、镜像、网络、数据卷、Compose、日志和常见报错。
---

Docker 适合把应用和依赖打包到容器里运行。运维时重点关注镜像来源、容器状态、端口映射、数据卷、日志、磁盘空间和重启策略。

## Ubuntu 安装示例

官方推荐通过 Docker APT 仓库安装。下面是 Ubuntu 示例：

```sh
sudo apt update
sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

添加源：

```sh
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
```

安装：

```sh
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

测试：

```sh
sudo docker run hello-world
```

如果不是 Ubuntu，请按 Docker 官方文档选择对应发行版。

## 常用命令

```sh
docker version
docker info
docker ps
docker ps -a
docker images
docker logs -f container_name
docker exec -it container_name sh
docker inspect container_name
docker stats
docker system df
```

停止和删除：

```sh
docker stop container_name
docker rm container_name
docker rmi image_name
```

清理未使用资源：

```sh
docker system prune
docker image prune
docker volume prune
```

清理前先确认不要误删未挂载但仍有用的数据卷。

## 运行容器

```sh
docker run -d \
--name web \
--restart unless-stopped \
-p 8080:80 \
-v /data/web:/usr/share/nginx/html \
nginx:alpine
```

关键参数：

- `-d`：后台运行。
- `--name`：容器名称。
- `--restart unless-stopped`：异常退出后自动重启。
- `-p 8080:80`：宿主机端口映射到容器端口。
- `-v /data/web:/path`：挂载数据目录。

## Docker Compose

`compose.yaml` 示例：

```yaml
services:
  web:
    image: nginx:alpine
    container_name: web
    restart: unless-stopped
    ports:
      - "8080:80"
    volumes:
      - ./html:/usr/share/nginx/html
```

常用命令：

```sh
docker compose up -d
docker compose ps
docker compose logs -f
docker compose restart
docker compose down
```

如果有数据库、对象存储、消息队列，生产环境要把数据目录挂载到明确路径，并做好备份。

## 网络和端口

查看端口：

```sh
docker port container_name
ss -lntp
```

常见问题：

- 宿主机端口已被占用。
- 容器内服务没有监听正确端口。
- 应用监听 `127.0.0.1`，容器外访问不到。
- 云服务器安全组或系统防火墙没有放行。
- Nginx 反向代理指向了错误端口。

## 日志和磁盘

查看日志：

```sh
docker logs --tail 200 container_name
docker logs -f container_name
```

查看磁盘占用：

```sh
docker system df
du -sh /var/lib/docker
```

生产环境建议配置日志轮转，避免容器日志把磁盘写满。

`/etc/docker/daemon.json` 示例：

```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  }
}
```

重启 Docker：

```sh
sudo systemctl restart docker
```

## 常见报错

| 报错 | 常见原因 | 处理方向 |
| --- | --- | --- |
| `permission denied while trying to connect to the Docker daemon socket` | 当前用户不在 docker 组 | 使用 `sudo` 或配置 docker 用户组 |
| `Cannot connect to the Docker daemon` | Docker 服务未启动 | `systemctl status docker` |
| `port is already allocated` | 端口被占用 | 更换端口或停止占用进程 |
| `no space left on device` | 镜像、容器、日志或卷占满磁盘 | `docker system df`、清理无用资源 |
| `pull access denied` | 镜像不存在或无权限 | 检查镜像名、登录 registry |
| `manifest unknown` | tag 不存在 | 换成存在的镜像 tag |
| `exec format error` | 镜像架构和服务器架构不匹配 | 检查 amd64、arm64 |
| 容器一直重启 | 启动命令、环境变量、依赖服务异常 | `docker logs` 看真实原因 |

## 官方入口

- [Install Docker Engine](https://docs.docker.com/engine/install/)
- [Install Docker Engine on Ubuntu](https://docs.docker.com/engine/install/ubuntu/)
