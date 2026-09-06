---
title: Auto.js-Pro-Ext
description: VS Code Auto.js-Pro-Ext 扩展的功能、命令、快捷键、调试配置、设备连接、文件同步、布局分析和常见问题。
---

Auto.js-Pro-Ext 是 Auto.js Pro 的 VS Code 调试扩展。它用于在 VS Code 中连接手机设备、创建项目、运行脚本、单步调试、查看日志、同步文件、浏览设备文件和做布局分析。

本文基于本机已安装扩展 `hyb1996.auto-js-pro-ext-9.0.9` 的 `package.json`、`README.md`、`CHANGELOG.md`，并结合 Auto.js Pro VS Code 调试教程整理。

## 本机扩展信息

| 项目 | 内容 |
| --- | --- |
| 扩展目录 | `/Users/leroi/.vscode/extensions/hyb1996.auto-js-pro-ext-9.0.9` |
| 扩展名 | `auto-js-pro-ext` |
| 显示名称 | `Auto.js-Pro-Ext` |
| 版本 | `9.0.9` |
| 发布者 | `hyb1996` |
| 描述 | Auto.js Pro 调试插件 |
| VS Code 要求 | `^1.60.0` |
| 调试器类型 | `autojs` |
| 调试器名称 | `Auto.js Pro Debug` |

扩展目录里还包含：

- `dist/extension.js`：扩展主体。
- `dist/autojs_layout_inspector/`：布局分析页面。
- `tools/adb.exe`、`AdbWinApi.dll`、`AdbWinUsbApi.dll`：Windows ADB 相关文件。
- `README.md`、`CHANGELOG.md`、`package.json`。

## 使用前准备

建议准备：

- Auto.js Pro 9.3 以上版本。
- VS Code。
- Auto.js-Pro-Ext 扩展。
- 手机和电脑处于同一局域网，或使用 USB / ADB。
- 手机端开启“允许远程调试”。
- 无障碍权限、悬浮窗权限、后台运行权限按脚本需要开启。

如果商店中搜索不到扩展，优先按官方教程或可信来源安装 VSIX，不要随意安装来源不明的扩展包。

## 连接设备

扩展支持几类连接思路：

| 方式 | 适合场景 |
| --- | --- |
| 智能扫描设备 | 手机和电脑在同一局域网 |
| 手动连接 | 需要手动输入电脑 IP 或指定连接 |
| USB / ADB | 不在同一局域网、模拟器、无线连接不稳定 |

命令面板常用命令：

```txt
Auto.js Pro: 重新扫描设备
Auto.js Pro: 连接到新设备
Auto.js Pro: 选择设备
Auto.js Pro: 断开所有连接
```

连接成功后，VS Code 左下角会显示当前设备。多设备连接时，可以通过“选择设备”切换运行目标。

## 项目类型

扩展提供两类项目创建命令：

| 命令 | 说明 |
| --- | --- |
| 新建第一代 API 项目 | Rhino / 第一代 API |
| 新建第二代 API 项目 | Node.js / 第二代 API |

对应命令：

```txt
Auto.js Pro: 新建第一代API项目(Rhino)
Auto.js Pro: 新建第二代API项目(Node.js)
```

如果是新项目，建议优先选择第二代 API；如果要兼容旧脚本或旧教程，选择第一代 API 更容易对上资料。

## 运行脚本

扩展贡献的运行命令包括：

| 命令 | 用途 |
| --- | --- |
| `autojspro.run` | 运行 |
| `autojspro.runProject` | 运行项目 |
| `autojspro.runFile` | 运行单文件 |
| `autojspro.rerun` | 重新运行 |
| `autojspro.stop` | 停止当前脚本 |
| `autojspro.stopAll` | 停止所有脚本 |

快捷键：

| 快捷键 | 命令 |
| --- | --- |
| `F5` | 运行 |
| `Shift + F5` | 停止当前脚本 |
| `Cmd + F5` | 在设备上运行 |
| `Cmd + Shift + F5` | 重新运行 |
| `Cmd + Shift + S` | 保存当前文件 |

Windows 上对应 `Ctrl`，macOS 上对应 `Cmd`。

## 单步调试

扩展注册了 `Auto.js Pro Debug` 调试器，调试类型是：

```json
{
  "type": "autojs",
  "request": "launch",
  "name": "[Auto.js Pro调试]",
  "stopOnEntry": true
}
```

可用配置项：

| 配置 | 说明 |
| --- | --- |
| `main` | 入口代码文件相对路径，不填时使用当前正在编辑的文件 |
| `rootDir` | 入口代码所在工作区文件夹 URI |
| `stopOnEntry` | 启动调试时是否在第一行停下 |

常用配置：

```json
{
  "type": "autojs",
  "request": "launch",
  "main": "main.js",
  "stopOnEntry": true,
  "device": "[current]",
  "name": "[Auto.js Pro调试]使用最近设备"
}
```

调试时可以：

- 设置断点。
- 单步运行。
- 单步进入。
- 单步跳出。
- 查看变量。
- 查看调用堆栈。
- 使用调试控制台执行表达式。

调试 UI 脚本时，如果 UI 线程被暂停，手机可能提示应用无响应。通常选择等待即可，但部分系统可能直接杀掉进程。

## 文件同步

官方教程说明，VS Code 运行或调试时，插件会扫描本地文件变化，将文件同步到设备脚本文件夹下的 `.remote` 临时目录后再运行。

建议：

- 只打开当前项目文件夹，不要打开整个磁盘或巨大的父目录。
- 有图片、模块、配置等资源时，打开项目目录，不要只打开单个文件。
- 大量文件会导致同步慢或失败。
- 不需要同步的文件写入 `.autojs.sync.ignore`。

`.autojs.sync.ignore` 的写法类似 `.gitignore`。

示例：

```text
/.git
/node_modules
/dist
*.log
```

## 设备文件管理

扩展提供：

```txt
Auto.js Pro: 浏览设备文件
Auto.js Pro: 刷新文件
Auto.js Pro: 保存当前文件
Auto.js Pro: 保存项目
```

可以在 VS Code 中浏览、编辑、运行设备上的文件。直接编辑设备文件可以减少本地同步过程，但由于虚拟文件系统限制，自动补全可能不如本地项目完整。

扩展中可见设备文件相关 scheme：

```txt
autojsvfs
```

## 布局分析

扩展提供：

```txt
Auto.js Pro: 布局分析
```

本机扩展包里包含 `dist/autojs_layout_inspector/`，说明布局分析界面是扩展内置功能之一。它适合用来查看当前界面控件结构，辅助写 `text()`、`id()`、`desc()`、`className()` 等选择器。

## 自动补全

Auto.js Pro 的自动补全依赖 `.d.ts` 类型文件。官方教程中给出的类型包是：

| API | 类型包 |
| --- | --- |
| 第一代 API / Rhino | `@autojs/types-pro8` |
| 第二代 API / Node.js | `@autojs/types-pro9` |

如果不是通过扩展新建项目，可以自行补齐 `node_modules`、`tsconfig.json` 和类型配置。

`tsconfig.json` 中通常需要包含类似配置：

```json
{
  "compilerOptions": {
    "typeRoots": [
      "./node_modules/@autojs"
    ]
  }
}
```

## 常见命令速查

| 命令 ID | 显示名称 |
| --- | --- |
| `autojspro.listAll` | 功能列表 |
| `autojspro.help` | 使用教程 |
| `autojspro.connect` | 连接到新设备 |
| `autojspro.selectDevice` | 选择设备 |
| `autojspro.scanDevices` | 重新扫描设备 |
| `autojspro.run` | 运行 |
| `autojspro.runProject` | 运行项目 |
| `autojspro.runFile` | 运行单文件 |
| `autojspro.stop` | 停止当前脚本 |
| `autojspro.stopAll` | 停止所有脚本 |
| `autojspro.inspectLayout` | 布局分析 |
| `autojspro.browseDeviceFiles` | 浏览设备文件 |
| `autojspro.save` | 保存当前文件 |
| `autojspro.saveProject` | 保存项目 |
| `autojspro.rerun` | 重新运行 |
| `autojspro.addDebugConfig` | 增加调试设备配置 |
| `autojspro.disconnectAll` | 断开所有连接 |
| `autojspro.refreshDirectory` | 刷新文件 |

## 常见问题

### 无法连接设备

可能原因：

- 手机和电脑不在同一局域网。
- 路由器、校园网、公司网络禁止设备互连。
- Windows 防火墙或安全软件拦截端口。
- 手机没有开启 Auto.js Pro 的远程调试。
- USB / ADB 没有授权。
- 模拟器没有开启桥接或 ADB 调试。

处理：

- 先确认手机 IP 能被电脑访问。
- 使用“重新扫描设备”。
- 尝试“连接到新设备”。
- 无线不通时改用 USB / ADB。
- 保持 Auto.js Pro 在前台，避免被系统杀后台。

### 运行时没有自动补全

可能原因：

- 不是用扩展创建的项目。
- 缺少 `.d.ts` 类型文件。
- `tsconfig.json` 没有配置 `typeRoots`。
- 直接编辑设备文件，语言服务受虚拟文件系统限制。

处理：

- 用扩展新建项目。
- 或安装对应类型包。
- 或复制新建项目中的 `node_modules` 和 `tsconfig.json`。

### 提示 `open extension-output-hyb1996.auto-js-pro-ext`

官方教程中提到，这类问题通常是当前焦点在日志区域或其他区域。重新点击要运行的代码编辑器区域，再重新运行或启动调试。

### 锁屏或后台后连接断开

处理：

- 开启 Auto.js Pro 前台服务。
- 锁定 Auto.js Pro 后台。
- 关闭电量优化。
- 加入后台白名单。
- 调试时保持屏幕常亮。

### 文件同步慢

处理：

- 不要打开过大的工作区。
- 只打开当前项目目录。
- 把 `.git`、`node_modules`、`dist`、日志等写入 `.autojs.sync.ignore`。
- 单文件测试时用“运行单文件”，项目运行时用“运行项目”。

## 版本记录摘要

本机扩展 `CHANGELOG.md` 中记录：

| 版本 | 变化 |
| --- | --- |
| `1.4.0` | 新增支持 V9 项目调试 |
| `1.3.0` | 新建 <code>V8/V9</code> 项目时有更好的自动补全，优化运行命令，修复布局分析问题 |
| `1.2.0` | 新增布局分析、浏览设备文件 |
| `1.0.1` | 新增单步调试 |
| `0.5.3` | 插件自带 Windows ADB |
| `0.5.1` | 修复部分 ADB 连接问题，新增设备断开提示、清除 IP 历史记录 |

## 安全建议

- 只安装可信来源的 VSIX 或扩展。
- 扩展会连接设备、同步文件、调试脚本，权限边界要清楚。
- 不要在未知脚本里输入账号密码。
- 不要运行来源不明的自动化脚本。
- 手机端开启远程调试后，用完及时关闭。
- 公共网络、公司网络中谨慎开启远程调试。

## 官方入口

- [Auto.js Pro 新版 VSCode 调试教程](https://www.wuyunai.com/docs/blog/vscode-debug-v9.html)
- [Auto.js Pro 文档](https://www.autojs.cc/docs/docs.html)
- [Auto.js Pro 9 第二代 API 文档](https://www.autojs.cc/docs/zh/v9/)
