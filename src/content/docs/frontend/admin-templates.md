---
title: 后台管理模板选型
description: vue-admin-template、vue-element-admin、mall-admin-web、Geeker Admin、iview-admin、iView UI v4 和常见后台管理系统模板问题整理。
---

后台管理系统模板不要只看页面是否好看，更要看项目当前的 Vue 版本、构建工具、组件库、权限模型、接口规范和后续维护成本。

## 常见模板

| 模板 | 常见技术栈 | 适合场景 |
| --- | --- | --- |
| [vue-admin-template](/frontend/vue-element-admin) | Vue 2、Element UI、vue-router、Vuex、Webpack | 想要一个干净的 Vue 2 后台骨架 |
| [vue-element-admin](/frontend/vue-element-admin) | Vue 2、Element UI、权限路由、TagsView、国际化 | 需要完整后台示例和较多内置模块 |
| [mall-admin-web](/frontend/mall-admin-web) | Vue 2、Element UI、mall 后台接口 | 维护 mall 体系、电商后台、商品订单权限模块 |
| [Geeker Admin](/frontend/geeker-admin) | Vue 3、TypeScript、Vite、Pinia、Element Plus | 新项目或想用 Vue 3 技术栈 |
| [iView UI v4](/frontend/iview-ui-v4) | Vue 2、View UI、组件库 | 老 Vue 2 项目继续维护 iView/View UI |
| [iview-admin](/frontend/iview-admin) | Vue 2、iView/View UI、vue-router、Vuex | 历史 iView 后台项目维护 |

## 怎么选

### 新项目

新项目优先选 Vue 3、TypeScript、Vite、Pinia、Element Plus 这一类组合。原因很简单：依赖更新压力更小，开发体验更好，后续找人维护也更容易。

可优先看：

- [Geeker Admin](/frontend/geeker-admin)
- [Vite 使用文档](/frontend/vite)
- [TypeScript 使用文档](/frontend/typescript)
- [Element Plus](/frontend/element-plus)

### 老项目

如果已经是 Vue 2、Element UI、iView/View UI 项目，不建议为了“新”而立刻全量重构。可以先把 Node 版本、依赖锁文件、构建命令、接口代理、部署路径固定下来，再逐步替换功能模块。

可优先看：

- [vue-element-admin](/frontend/vue-element-admin)
- [mall-admin-web](/frontend/mall-admin-web)
- [iview-admin](/frontend/iview-admin)
- [iView UI v4](/frontend/iview-ui-v4)

## 后台模板最容易出问题的地方

| 问题 | 常见原因 | 直接处理 |
| --- | --- | --- |
| 安装依赖失败 | Node 版本太新、`node-sass`、peer 依赖冲突 | 固定 Node 版本，优先使用项目原来的 lock 文件 |
| 本地启动报 OpenSSL 错误 | Webpack 4 和 Node 17+ 兼容问题 | 降到 Node 16，或临时配置 `NODE_OPTIONS=--openssl-legacy-provider` |
| 登录失败 | mock、proxy、后端地址、token 字段不一致 | 先看 Network 的登录接口返回 |
| 菜单不显示 | 权限路由、角色字段、`hidden`、后端菜单格式不一致 | 打印最终路由表和权限数据 |
| 页面刷新 404 | history 路由没有服务端回退 | Nginx 增加 `try_files` |
| 打包后白屏 | `publicPath` 或 Vite `base` 和部署目录不一致 | 按实际访问路径配置 |
| TagsView 不缓存 | 组件 `name` 和路由 `name` 不一致 | 保持路由名、组件名稳定 |
| 表格错位 | 固定列、隐藏列、容器宽度变化 | 刷新 table layout 或避免隐藏父容器初始化 |

## 常见报错

### `npm ERR! code ERESOLVE`

常见原因是新版本 npm 对 peer 依赖检查更严格。

处理顺序：

1. 优先使用项目原本的包管理器和 lock 文件。
2. 老 Vue 2 项目尽量使用 Node 14 或 Node 16。
3. 确认依赖版本不要随意升级大版本。
4. 临时安装可以使用：

```bash
npm install --legacy-peer-deps
```

这只是兼容安装，不代表依赖真的完全匹配。生产项目最好把依赖版本固定下来。

### `Node Sass does not yet support your current environment`

常见于 Vue 2、Webpack 旧后台模板。

直接处理：

- 如果项目还依赖 `node-sass`，优先切换到项目原本支持的 Node 版本。
- 不要一上来就升级 `node-sass` 大版本，容易带出一串 loader 问题。
- 如果项目允许改造，再逐步迁移到 `sass`。

### `error:0308010C:digital envelope routines::unsupported`

常见于 Webpack 4 在 Node 17+ 下运行。

处理方式：

```bash
export NODE_OPTIONS=--openssl-legacy-provider
```

更稳妥的方式是把老项目 Node 固定到 Node 16。

### `Module build failed: TypeError: this.getOptions is not a function`

常见原因是 loader 版本和 Webpack 版本不匹配。

排查：

- Webpack 4 不要直接使用只适配 Webpack 5 的 loader 大版本。
- 对比项目原始 `package.json` 和 lock 文件。
- 最近升级过 `sass-loader`、`less-loader`、`postcss-loader` 时优先回看这些依赖。

### 登录接口能请求，但页面还是跳回登录页

常见原因：

- 后端返回字段和前端期望不一致。
- token 没有写入本地存储。
- `Authorization` 请求头没有带上。
- 获取用户信息接口失败。
- 权限路由生成后没有正确 `next` 或跳转。

排查顺序：

1. 看登录接口返回。
2. 看 token 是否保存。
3. 看后续用户信息接口是否成功。
4. 看最终生成的路由表是否包含目标页面。

## 维护建议

- 老后台模板先稳定 Node、包管理器、lock 文件和接口代理。
- 权限菜单要先定义清楚：前端写死、后端返回路由、还是后端只返回权限码。
- 不要同时混用 Element UI、Element Plus、View UI。
- 路由 `name`、组件 `name`、缓存名要保持一致。
- 打包路径和部署路径要写进项目文档，不要只靠记忆。

## 官方导航

- [vue-element-admin](https://github.com/PanJiaChen/vue-element-admin)
- [vue-admin-template](https://github.com/PanJiaChen/vue-admin-template)
- [mall-admin-web](https://github.com/macrozheng/mall-admin-web)
- [Geeker Admin](https://github.com/HalseySpicy/Geeker-Admin)
- [iView UI v4](https://v4.iviewui.com/)
- [iview-admin](https://github.com/iview/iview-admin)
