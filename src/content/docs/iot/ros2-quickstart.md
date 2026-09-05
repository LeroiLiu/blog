---
title: ROS 2 快速入门
description: ROS 2 快速入门，整理发行版选择、Ubuntu 安装、环境变量、常用命令、工作空间、包创建、节点通信和常见报错。
---

ROS 2 是机器人软件开发里常见的基础框架，用来组织节点、话题、服务、动作、参数、坐标变换和数据记录。它不是一个单独的库，而是一套让机器人模块协作的通信和工程体系。

如果只是做普通物联网设备，MQTT、HTTP、串口协议可能已经足够；如果项目里有传感器融合、运动控制、地图、导航、机械臂、仿真、多个进程协同，ROS 2 会更合适。

:::note[官方入口]
- [ROS 2 官方文档](https://docs.ros.org/)
- [ROS 2 Lyrical 安装](https://docs.ros.org/en/lyrical/Installation/Ubuntu-Install-Debs.html)
- [ROS 2 Jazzy 安装](https://docs.ros.org/en/jazzy/Installation/Ubuntu-Install-Debs.html)
- [ROS 2 Beginner Tutorials](https://docs.ros.org/en/jazzy/Tutorials.html)
:::

## 版本怎么选

截至 `2026-05`，ROS 2 仍然建议按 Ubuntu 版本选择发行版，不要随意混装。

| 系统 | 建议发行版 | 说明 |
| --- | --- | --- |
| Ubuntu 26.04 | `Lyrical` | 最新稳定发行版，适合新机器和新项目 |
| Ubuntu 24.04 | `Jazzy` | 长期维护周期较长，资料和生态更稳 |
| Ubuntu 22.04 | `Humble` | 老项目常见，适合维护已有环境 |
| Ubuntu 20.04 | ROS 1 Noetic / 旧 ROS 2 | 不建议新项目继续从这里开始 |

新手如果电脑是 Ubuntu 24.04，优先选择 `Jazzy`；如果已经是 Ubuntu 26.04，再选择 `Lyrical`。

## ROS 2 核心概念

| 概念 | 作用 |
| --- | --- |
| Node | 节点，一个独立功能进程或组件 |
| Topic | 话题，发布订阅模型，适合连续数据 |
| Service | 服务，请求响应模型，适合一次性调用 |
| Action | 动作，适合耗时任务，比如导航到目标点 |
| Parameter | 参数，运行时配置 |
| Message | 消息类型，定义话题传输的数据结构 |
| Launch | 启动文件，一次启动多个节点和配置 |
| Bag | 数据录制与回放，常用于调试传感器数据 |
| tf2 | 坐标变换系统，维护机器人各坐标系关系 |

可以把 ROS 2 理解成：很多小节点通过 Topic、Service、Action 互相通信，再由 Launch 统一启动，由 Bag 记录现场数据，由 tf2 管理坐标关系。

## Ubuntu 24.04 安装 Jazzy

先确认系统版本：

```sh
lsb_release -a
```

配置 UTF-8 环境：

```sh
locale
sudo apt update
sudo apt install locales
sudo locale-gen en_US en_US.UTF-8
sudo update-locale LC_ALL=en_US.UTF-8 LANG=en_US.UTF-8
export LANG=en_US.UTF-8
locale
```

启用基础软件源，并添加 ROS 2 apt 源：

```sh
sudo apt install software-properties-common
sudo add-apt-repository universe
sudo apt update
sudo apt install curl

export ROS_APT_SOURCE_VERSION=$(curl -s https://api.github.com/repos/ros-infrastructure/ros-apt-source/releases/latest | grep -F "tag_name" | awk -F'"' '{print $4}')
curl -L -o /tmp/ros2-apt-source.deb "https://github.com/ros-infrastructure/ros-apt-source/releases/download/${ROS_APT_SOURCE_VERSION}/ros2-apt-source_${ROS_APT_SOURCE_VERSION}.$(. /etc/os-release && echo ${UBUNTU_CODENAME:-${VERSION_CODENAME}})_all.deb"
sudo dpkg -i /tmp/ros2-apt-source.deb
```

安装 ROS 2：

```sh
sudo apt update
sudo apt upgrade
sudo apt install ros-jazzy-desktop
sudo apt install ros-dev-tools
```

`desktop` 包包含 RViz、示例和常用桌面工具。服务器环境可以只装基础包：

```sh
sudo apt install ros-jazzy-ros-base
```

## Ubuntu 26.04 安装 Lyrical

如果使用 Ubuntu 26.04，把上面的安装包名称换成 `lyrical`：

```sh
sudo apt install ros-lyrical-desktop
sudo apt install ros-dev-tools
```

环境文件也要对应切换：

```sh
source /opt/ros/lyrical/setup.bash
```

不要在一个终端里同时 source 多个发行版，否则后面排查会非常痛苦。

## 配置环境变量

临时生效：

```sh
source /opt/ros/jazzy/setup.bash
```

长期生效：

```sh
echo "source /opt/ros/jazzy/setup.bash" >> ~/.bashrc
source ~/.bashrc
```

如果你使用 `zsh`：

```sh
echo "source /opt/ros/jazzy/setup.zsh" >> ~/.zshrc
source ~/.zshrc
```

检查命令是否可用：

```sh
ros2 --help
ros2 doctor
```

首次使用依赖解析工具时，初始化 `rosdep`：

```sh
sudo rosdep init
rosdep update
```

如果提示已经初始化过，后续只需要执行 `rosdep update`。

## 跑通第一个示例

开两个终端，每个终端都要先 source 环境。

终端一：

```sh
source /opt/ros/jazzy/setup.bash
ros2 run demo_nodes_cpp talker
```

终端二：

```sh
source /opt/ros/jazzy/setup.bash
ros2 run demo_nodes_py listener
```

如果 `talker` 不断输出 `Publishing`，`listener` 不断输出 `I heard`，说明 C++ 和 Python 的基础通信都跑通了。

## 常用命令速查

| 命令 | 作用 |
| --- | --- |
| `ros2 node list` | 查看节点 |
| `ros2 node info /node_name` | 查看节点信息 |
| `ros2 topic list` | 查看话题 |
| `ros2 topic echo /topic` | 打印话题数据 |
| `ros2 topic info /topic` | 查看话题类型和连接数量 |
| `ros2 interface show std_msgs/msg/String` | 查看消息结构 |
| `ros2 service list` | 查看服务 |
| `ros2 service call /service type "{}"` | 调用服务 |
| `ros2 action list` | 查看动作 |
| `ros2 param list` | 查看参数 |
| `ros2 param get /node param_name` | 获取参数 |
| `ros2 launch package file.launch.py` | 启动 launch 文件 |
| `ros2 bag record /topic` | 录制话题 |
| `ros2 bag play bag_dir` | 回放 bag |

## 创建工作空间

ROS 2 项目通常放在 workspace 里，源码放进 `src`。

```sh
mkdir -p ~/ros2_ws/src
cd ~/ros2_ws
```

初始化依赖：

```sh
rosdep update
rosdep install -i --from-path src --rosdistro jazzy -y
```

构建：

```sh
colcon build
```

让当前终端识别这个工作空间：

```sh
source install/setup.bash
```

长期开发时，可以只把系统 ROS 写进 `~/.bashrc`，项目 workspace 的 `install/setup.bash` 在进入项目时手动 source。这样不同项目之间不容易互相污染。

## 创建第一个包

进入 `src`：

```sh
cd ~/ros2_ws/src
```

创建 Python 包：

```sh
ros2 pkg create --build-type ament_python --license Apache-2.0 --node-name hello_node leroi_demo
```

回到工作空间根目录构建：

```sh
cd ~/ros2_ws
colcon build --packages-select leroi_demo
source install/setup.bash
```

运行节点：

```sh
ros2 run leroi_demo hello_node
```

如果提示找不到包或找不到可执行文件，优先检查：

- 是否在 workspace 根目录执行了 `colcon build`。
- 是否执行了 `source install/setup.bash`。
- 包名、节点名是否拼写一致。
- `setup.py` 或 `CMakeLists.txt` 是否正确安装了可执行入口。

## 发布订阅怎么理解

Topic 是 ROS 里最常用的通信方式。

一个节点发布数据：

```text
camera_node -> /camera/image -> detect_node
```

另一个节点订阅数据：

```text
detect_node -> /target/pose -> controller_node
```

关键点：

- 发布者和订阅者的话题名必须一致。
- 消息类型必须一致。
- 多个节点可以同时订阅同一个话题。
- Topic 适合连续数据，比如图像、雷达、里程计、状态。
- Service 更适合一次性请求，比如“保存地图”。
- Action 更适合长任务，比如“移动到目标点”。

## turtlesim 入门调试

安装桌面版后通常可以直接跑 turtlesim：

```sh
ros2 run turtlesim turtlesim_node
```

另开一个终端控制：

```sh
ros2 run turtlesim turtle_teleop_key
```

查看话题：

```sh
ros2 topic list
```

查看小乌龟位姿：

```sh
ros2 topic echo /turtle1/pose
```

这套流程适合理解节点、话题、键盘控制、实时状态输出。

## 常见报错

### `ros2: command not found`

环境没有 source。

```sh
source /opt/ros/jazzy/setup.bash
```

如果每次打开终端都丢失，检查 `~/.bashrc` 或 `~/.zshrc`。

### `Unable to locate package ros-jazzy-desktop`

常见原因：

- Ubuntu 版本和 ROS 发行版不匹配。
- ROS apt 源没有添加成功。
- 没有执行 `sudo apt update`。
- `universe` 仓库没有启用。
- 网络无法访问相关软件源。

先确认：

```sh
lsb_release -a
apt-cache search ros-jazzy-desktop
```

### `colcon: command not found`

开发工具未安装：

```sh
sudo apt install ros-dev-tools
```

如果仍不可用，再补：

```sh
sudo apt install python3-colcon-common-extensions
```

### `package not found`

通常是 workspace 没有 source：

```sh
cd ~/ros2_ws
source install/setup.bash
```

如果刚修改过代码，重新构建：

```sh
colcon build --packages-select package_name
source install/setup.bash
```

### 两台机器节点互相发现不了

排查方向：

- 两台机器是否在同一网络。
- 防火墙是否阻止 DDS 通信。
- `ROS_DOMAIN_ID` 是否一致。
- 是否跨 ROS 2 发行版混用。
- 虚拟机、Docker、VPN 是否影响组播。

可以先在两台机器分别查看：

```sh
echo $ROS_DOMAIN_ID
ros2 node list
```

同一项目里建议显式设置一个固定域：

```sh
export ROS_DOMAIN_ID=12
```

### RViz 或 turtlesim 无法打开

常见原因：

- 安装的是 `ros-base`，没有桌面工具。
- SSH 没有开启 X11 转发。
- 虚拟机图形加速异常。
- Docker 没有透传显示环境。

本机学习建议安装：

```sh
sudo apt install ros-jazzy-desktop
```

服务器只跑节点时不一定需要桌面工具。

## 学习顺序

1. 安装 ROS 2 并跑通 `talker/listener`。
2. 使用 `turtlesim` 理解节点、话题和命令行。
3. 建立自己的 `ros2_ws`。
4. 创建第一个 Python 或 C++ 包。
5. 写一个 publisher 和 subscriber。
6. 学会 launch 文件，一次启动多个节点。
7. 学会 rosbag，录制和回放现场数据。
8. 学 tf2、URDF、RViz，再进入机器人模型、仿真和导航。

## 站内历史文章

- [安装并配置ROS环境](/blog/ops/82352961)
- [ROS相关资料](/blog/ops/82715133)
- [ROS相关资料更新](/blog/ops/82767904)
