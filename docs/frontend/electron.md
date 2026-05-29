---
title: Electron 常见问题
description: Electron 主进程、渲染进程、preload、IPC、打包、自动更新、原生模块和版本升级常见问题。
---

# Electron 常见问题

Electron 用于开发桌面端应用。维护 Electron 项目时，要同时关注 Chromium、Node.js、V8、系统权限、打包签名和安全配置。

## Electron 版本怎么选

新项目优先使用当前稳定版本。老项目升级时，不要只看 Electron 版本号，还要检查：

- Chromium 版本变化。
- Node.js 版本变化。
- 原生模块是否需要重编译。
- 打包工具是否兼容。
- macOS、Windows 权限和签名要求。

## 主进程和渲染进程怎么区分

主进程负责窗口、菜单、系统能力、应用生命周期。

渲染进程负责页面 UI。

不要把所有能力都塞进渲染进程，涉及系统能力时应通过 preload 和 IPC 暴露有限接口。

## contextIsolation 要不要开启

建议开启。关闭隔离会增加安全风险。

preload 示例：

```js
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  ping: () => ipcRenderer.invoke('ping')
})
```

渲染进程使用：

```js
window.api.ping()
```

## IPC 通信怎么写

主进程：

```js
ipcMain.handle('ping', async () => {
  return 'pong'
})
```

preload：

```js
contextBridge.exposeInMainWorld('api', {
  ping: () => ipcRenderer.invoke('ping')
})
```

## 打包后白屏怎么办

常见原因：

- 资源路径错误。
- 路由使用 history 模式但没有适配。
- 打包产物路径不对。
- preload 路径错误。
- 开发环境变量没有在生产环境配置。

先打开 DevTools 看控制台和网络请求，再检查打包后的文件路径。

## 原生模块安装失败怎么办

Electron 的 Node ABI 可能和本机 Node 不一致。需要使用 Electron 对应环境重新编译原生模块。

排查：

- Node 版本。
- Electron 版本。
- 操作系统和 CPU 架构。
- 是否需要 `electron-rebuild`。

## 自动更新要注意什么

- Windows 和 macOS 更新机制不同。
- macOS 通常还涉及签名、公证。
- 更新包地址要稳定。
- 更新失败要有回退策略。
- 不要在用户关键操作中强制重启。

## 官方入口

- Electron 文档：https://www.electronjs.org/docs/latest/
- Electron Releases：https://releases.electronjs.org/
