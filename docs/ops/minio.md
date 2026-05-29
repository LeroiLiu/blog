---
title: MinIO 对象存储安装
description: 使用 Docker 安装 MinIO，对象存储数据目录、控制台端口、账号密码和 Nginx 反向代理配置说明。
---

# MinIO 对象存储安装

本文整理 MinIO 对象存储的 Docker 安装、数据目录挂载、控制台端口、Nginx 反向代理和完整安装脚本，适合快速搭建自有对象存储服务。

## 快捷安装

安装 Docker 并启动：

```sh
curl -fsSL https://get.docker.com | bash -s docker --mirror Aliyun
sudo systemctl start docker
```

拉取 MinIO 镜像：

```sh
docker pull minio/minio
```

如果需要同时安装 Nginx，也可以使用 LNMP 安装包：

```sh
wget https://soft.lnmp.com/lnmp/lnmp2.0.tar.gz -O lnmp2.0.tar.gz && tar zxf lnmp2.0.tar.gz && cd lnmp2.0 && ./install.sh nginx
```

启动 MinIO：

```sh
docker run -p 9000:9000 -p 9001:9001 --name minio -e "MINIO_ROOT_USER=XXX" -e "MINIO_ROOT_PASSWORD=XXXX" -v /home/wwwroot/minio:/data minio/minio server /data --console-address ":9001"
```

说明：

| 配置 | 作用 |
| --- | --- |
| `9000` | S3 API 访问端口 |
| `9001` | Web 控制台端口 |
| `/home/wwwroot/minio:/data` | 把宿主机目录挂载为对象存储数据目录 |
| `MINIO_ROOT_USER` | 管理员用户名 |
| `MINIO_ROOT_PASSWORD` | 管理员密码 |

## 完整安装脚本

下面脚本会安装 Docker、启动 Docker、拉取 MinIO 和 Nginx 镜像、创建数据目录、读取管理员用户名和密码、启动 MinIO 容器并输出容器内网 IP。

```sh
#!/bin/sh

# 安装 Docker
curl -sSL https://get.daocloud.io/docker | sh

# 启动 Docker
sudo systemctl start docker

# 安装 MinIO
docker pull minio/minio

# 安装 Nginx
docker pull nginx:latest

# 创建所需要的文件夹
minio_name="/root/minio/data"
minio_certs="/root/minio/certs"
minio_nginx="/root/minio/nginx"

mkdir -p "$minio_name"
mkdir -p "$minio_certs"
mkdir -p "$minio_nginx"

# 定义登录用户名
username=""
read -p "请输入minio管理用户名:" username
if [ -z "$username" ]; then
  username="minioadmin"
fi

# 定义登录密码
password=""
read -p "请输入minio管理密码:" password
if [ -z "$password" ]; then
  password="minioadmin123"
fi

# 启动 MinIO 容器
docker run -d \
-e MINIO_ACCESS_KEY="$username" \
-e MINIO_SECRET_KEY="$password" \
--name minio \
-v "$minio_name":/data \
-v "$minio_certs":/root/.minio/certs/CAs \
minio/minio server /data

# 获取容器 IP
IPAddress=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' minio)

echo "-------------------------------------"
echo "minio管理用户名：${username}"
echo "minio管理密码：${password}"
echo "minio内网IP：${IPAddress}"
echo "-------------------------------------"
```

新版本 MinIO 更推荐使用 `MINIO_ROOT_USER` 和 `MINIO_ROOT_PASSWORD`。如果使用新版镜像，可以把脚本里的 `MINIO_ACCESS_KEY` 和 `MINIO_SECRET_KEY` 改成下面这种写法：

```sh
-e MINIO_ROOT_USER="$username" \
-e MINIO_ROOT_PASSWORD="$password" \
```

## 查看容器状态

```sh
docker ps
docker logs minio
```

如果需要重启：

```sh
docker restart minio
```

## Nginx 反向代理

启动 Nginx 容器：

```sh
docker run --name nginx -p 80:80 -p 443:443 -v /root/minio/nginx:/etc/nginx/conf.d -d nginx
```

Nginx 配置示例：

```nginx
server {
  listen 80;
  listen 443 ssl;
  server_name server;
  ssl_certificate /etc/nginx/conf.d/ssl/server/public.pem;
  ssl_certificate_key /etc/nginx/conf.d/ssl/server/public.key;
  ssl_session_timeout 5m;
  ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE:ECDH:AES:HIGH:!NULL:!aNULL:!MD5:!ADH:!RC4;
  ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
  ssl_prefer_server_ciphers on;

  location / {
    proxy_set_header Host $http_host;
    proxy_pass http://172.17.0.2:9000;
  }
}
```

反向代理时需要注意：

- API 端口和控制台端口最好使用不同域名或不同路径。
- 需要保留 Host、真实 IP 和协议头。
- 如果启用 HTTPS，要确认 MinIO 控制台外部地址配置正确。

更通用的反向代理结构：

```nginx
server {
  listen 80;
  server_name oss.example.com;

  location / {
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_pass http://127.0.0.1:9000;
  }
}
```

## 指定存储目录

如果需要指定数据目录，可以挂载到 `/usr/local/minio/data`：

```sh
docker run -d -p 9000:9000 -p 9001:9001 -e MINIO_ACCESS_KEY=LinXi -e MINIO_SECRET_KEY=LinXi123 --name minio -v /usr/local/minio/data:/data minio/minio server /data --console-address ":9001"
```

同样建议在新版 MinIO 中改用：

```sh
docker run -d -p 9000:9000 -p 9001:9001 -e MINIO_ROOT_USER=LinXi -e MINIO_ROOT_PASSWORD=LinXi123 --name minio -v /usr/local/minio/data:/data minio/minio server /data --console-address ":9001"
```

## 生产环境建议

- 不要使用过短或弱口令。
- 数据目录要有备份策略。
- 控制台端口不要直接暴露给所有公网来源。
- 大文件和多用户场景要评估磁盘、带宽和备份成本。
- 如果只是项目静态资源，也可以评估云厂商 OSS、COS、S3 等托管服务。
