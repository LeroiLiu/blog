---
title: Kubernetes 运维
description: Kubernetes、k8s、kubeadm、containerd、kubectl、节点状态、Pod 排查和常见报错。
---

# Kubernetes 运维

Kubernetes 适合管理多节点、多服务、可扩缩容的容器应用。小项目不一定需要 K8s；如果只是单机部署，Docker Compose、1Panel 或普通 systemd 可能更简单。

## 基础组件

| 组件 | 作用 |
| --- | --- |
| `kubeadm` | 初始化或加入集群 |
| `kubelet` | 节点上的核心代理，负责运行 Pod |
| `kubectl` | 命令行管理工具 |
| `containerd` | 常用容器运行时 |
| CNI | Pod 网络插件，例如 Calico、Flannel |
| Ingress Controller | <code>HTTP/HTTPS</code> 入口控制 |

Kubernetes 现在通过 CRI 对接容器运行时。Docker Engine 本身不直接实现 CRI，如果要用 Docker，需要额外组件；生产和学习环境更常见的选择是 `containerd`。

## 节点准备

每个节点都建议先检查：

```sh
hostnamectl
free -h
df -h
ip addr
timedatectl
```

关闭 swap：

```sh
sudo swapoff -a
```

还要从 `/etc/fstab` 移除或注释 swap 挂载，否则重启后会恢复。

加载内核模块：

```sh
cat <<EOF | sudo tee /etc/modules-load.d/k8s.conf
overlay
br_netfilter
EOF

sudo modprobe overlay
sudo modprobe br_netfilter
```

内核参数：

```sh
cat <<EOF | sudo tee /etc/sysctl.d/k8s.conf
net.bridge.bridge-nf-call-iptables = 1
net.bridge.bridge-nf-call-ip6tables = 1
net.ipv4.ip_forward = 1
EOF

sudo sysctl --system
```

## containerd 检查

安装并启动后检查：

```sh
sudo systemctl status containerd
sudo crictl info
```

如果 kubelet 和 containerd 的 cgroup driver 不一致，集群初始化很容易失败。systemd 系统通常建议使用 `SystemdCgroup = true`。

常见配置位置：

```txt
/etc/containerd/config.toml
```

改完后：

```sh
sudo systemctl restart containerd
```

## 安装 kubeadm、kubelet、kubectl

官方仓库按 Kubernetes 小版本区分。示例使用 `v1.36`，实际要按官方文档和目标集群版本替换。

```sh
KUBE_VERSION=v1.36
sudo apt update
sudo apt install -y apt-transport-https ca-certificates curl gpg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://pkgs.k8s.io/core:/stable:/${KUBE_VERSION}/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/${KUBE_VERSION}/deb/ /" | sudo tee /etc/apt/sources.list.d/kubernetes.list
sudo apt update
sudo apt install -y kubelet kubeadm kubectl
sudo apt-mark hold kubelet kubeadm kubectl
```

如果你用的不是 <code>Debian/Ubuntu</code>，按官方文档切换到对应系统的安装方式。

## 初始化控制平面

示例：

```sh
sudo kubeadm init --pod-network-cidr=10.244.0.0/16
```

`--pod-network-cidr` 要和 CNI 插件匹配。Flannel、Calico 的推荐网段不一定一样，不要随手复制。

初始化完成后配置 kubectl：

```sh
mkdir -p $HOME/.kube
sudo cp -i /etc/kubernetes/admin.conf $HOME/.kube/config
sudo chown $(id -u):$(id -g) $HOME/.kube/config
```

查看节点：

```sh
kubectl get nodes
kubectl get pods -A
```

安装 CNI 后，节点才会从 `NotReady` 变成 `Ready`。

## 工作节点加入

控制平面初始化完成后会输出 `kubeadm join` 命令。忘记后可以重新生成：

```sh
kubeadm token create --print-join-command
```

在工作节点执行输出的 join 命令。

## 常用 kubectl

```php
kubectl get nodes -o wide
kubectl get pods -A -o wide
kubectl describe pod pod_name -n namespace
kubectl logs pod_name -n namespace
kubectl logs -f pod_name -n namespace
kubectl get events -A --sort-by=.metadata.creationTimestamp
kubectl top nodes
kubectl top pods -A
```

进入容器：

```sh
kubectl exec -it pod_name -n namespace -- sh
```

## 常见报错

| 报错 | 常见原因 | 处理方向 |
| --- | --- | --- |
| `preflight` 提示 swap | swap 未关闭 | `swapoff -a` 并修改 `/etc/fstab` |
| `container runtime is not running` | containerd 未启动或 CRI 配置异常 | 查 `containerd` 和 `crictl info` |
| `kubelet is not running` | kubelet 配置、cgroup、运行时异常 | `journalctl -u kubelet` |
| 节点 `NotReady` | CNI 未安装或网络异常 | `kubectl get pods -A`、看 CNI Pod |
| `ImagePullBackOff` | 镜像名、tag、仓库权限或网络问题 | `kubectl describe pod` |
| `CrashLoopBackOff` | 容器启动后反复崩溃 | `kubectl logs --previous` |
| `Pending` | 资源不足、PVC 未绑定、调度规则不满足 | `kubectl describe pod` |
| Ingress 不通 | Ingress Controller、Service、DNS、证书配置问题 | 从 Pod、Service、Ingress 逐层查 |

## 排查顺序

1. `kubectl get nodes` 看节点。
2. `kubectl get pods -A` 看系统组件。
3. `kubectl describe` 看事件。
4. `kubectl logs` 看容器日志。
5. 到节点上看 `kubelet`、`containerd`、磁盘和网络。
6. 最后再改 YAML，不要一上来就重装集群。

## 官方入口

- [Installing kubeadm](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/)
- [Creating a cluster with kubeadm](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/create-cluster-kubeadm/)
- [Container Runtimes](https://kubernetes.io/docs/setup/production-environment/container-runtimes/)
