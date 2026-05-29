---
title: 前端常见问题
description: 前端开发中关于 TypeScript、Vite、Vue、后台管理模板、构建、部署、样式、接口请求、路径别名和页面白屏的常见问题。
---

# 前端常见问题

这里整理前端项目里最常见、也最容易反复出现的问题。排查时先看浏览器 Console 第一条报错，再看 Network，再看终端输出。

## Vite 启动后页面白屏

常见报错：

```text
Uncaught TypeError: Cannot read properties of undefined
```

或：

```text
Failed to load module script
```

直接处理：

- 打开浏览器 Console，看第一条红色错误。
- 打开 Network，看 JS、CSS 是否 404。
- 如果是部署后白屏，先检查 Vite `base`。
- 如果是本地白屏，先检查入口文件、路由、运行时报错。

常见原因：

- `base` 和部署路径不一致。
- 入口组件运行时报错。
- 静态资源路径错误。
- 路由 history 模式没有服务端 fallback。
- 环境变量为 `undefined`，接口地址拼错。

完整处理见：[Vite 使用文档](/frontend/vite)。

## `Failed to resolve import`

报错：

```text
[plugin:vite:import-analysis] Failed to resolve import "@/components/Header.vue"
```

最直接处理：

1. 确认文件是否存在。
2. 确认路径大小写是否一致。
3. 检查 `vite.config.ts` alias。
4. 检查 `tsconfig.json` paths。
5. 重启 Vite 和 IDE TypeScript 服务。

`vite.config.ts`：

```ts
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('../src', import.meta.url))
    }
  }
})
```

如果 `vite.config.ts` 在项目根目录，通常是：

```ts
'@': fileURLToPath(new URL('./src', import.meta.url))
```

路径要按配置文件所在位置调整。

## TypeScript 找不到模块

报错：

```text
Cannot find module '@/utils/request' or its corresponding type declarations.
```

常见原因：

- Vite 配了 alias，但 TypeScript 没配 `paths`。
- TypeScript 配了 `paths`，但 Vite 没配 alias。
- 文件不在 `include` 范围内。
- IDE TypeScript 服务缓存旧配置。

处理：

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "src/*"
      ]
    }
  }
}
```

更多 TypeScript 报错见：[TypeScript 使用文档](/frontend/typescript)。

## 环境变量读取不到

报错或现象：

```text
import.meta.env.VITE_API_BASE_URL is undefined
```

处理：

- 前端可用变量必须加 `VITE_` 前缀。
- 修改 `.env` 后重启开发服务。
- 确认使用的是 `.env.development`、`.env.production` 还是指定 mode。
- 不要在 Vite 前端项目里使用 `process.env.xxx`。

示例：

```text
VITE_API_BASE_URL=https://api.example.com
```

```ts
const apiBase = import.meta.env.VITE_API_BASE_URL
```

## 线上接口跨域

浏览器报错：

```text
Access to XMLHttpRequest at 'https://api.example.com/user' from origin 'https://www.example.com' has been blocked by CORS policy.
```

直接处理：

- 本地开发用 Vite proxy。
- 线上用 Nginx 或后端网关做同域代理。
- 后端正确响应 `OPTIONS` 预检请求。
- 确认 `Access-Control-Allow-Origin` 不要和 `credentials` 配错。

不要试图只在前端加 header 解决 CORS。CORS 是浏览器安全策略，核心要由服务端响应头处理。

## 打包后资源 404

报错：

```text
GET https://example.com/assets/index-xxx.js 404
```

原因：

- 部署目录不是域名根路径，但 Vite `base` 仍然是 `/`。
- 静态资源没有上传完整。
- Nginx 指向了错误目录。
- GitHub Pages 项目页需要仓库名前缀。

处理：

```ts
export default defineConfig({
  base: '/repo-name/'
})
```

如果是自定义域名根目录：

```ts
export default defineConfig({
  base: '/'
})
```

## 页面样式在本地正常，线上异常怎么办

现象：

本地预览正常，部署后样式缺失、图片路径错误或页面资源 404。

原因：

静态站点部署到 GitHub Pages 项目页时，资源路径通常需要仓库名作为 base path。

解决：

本项目通过 GitHub Actions 自动设置 `BASE_PATH`。如果使用自定义域名，请在仓库变量中设置 `SITE_URL` 和 `BASE_PATH`。

## Tailwind CSS 或 UnoCSS 样式丢失

常见原因：

- 入口 CSS 没有引入。
- 动态 class 没有被扫描到。
- Tailwind 或 UnoCSS 配置文件没有被识别。
- 生产环境 tree-shaking 后删除了看起来“没用”的样式。

不推荐：

```ts
const cls = 'text-' + color + '-500'
```

推荐：

```ts
const colorClass = {
  success: 'text-green-500',
  warning: 'text-amber-500',
  danger: 'text-red-500'
}
```

相关入口：

- [Tailwind CSS 使用文档](/frontend/tailwindcss)
- [UnoCSS 使用文档](/frontend/unocss)

## Vue 页面数据更新了但视图没变

常见原因：

- Vue 2 中直接新增对象属性。
- 修改了非响应式对象。
- 数组更新方式不对。
- 组件 key 不稳定，导致状态复用异常。

Vue 2 老项目：

```js
this.$set(this.form, 'name', 'Leroi')
```

Vue 3 项目优先检查数据是否来自 `ref`、`reactive`，以及模板里是否正确使用。

## 后台管理模板依赖安装失败

常见报错：

```text
Node Sass does not yet support your current environment
```

或：

```text
npm ERR! code ERESOLVE
```

常见于 `vue-element-admin`、`vue-admin-template`、`mall-admin-web`、`iview-admin` 这类 Vue 2 老后台模板。

直接处理：

- 固定 Node 版本，老项目优先 Node 14 或 Node 16。
- 保留项目原来的 lock 文件。
- 不要直接升级 Webpack、loader、`node-sass` 大版本。
- npm peer 依赖冲突时可以临时使用 `npm install --legacy-peer-deps`。

完整处理见：[后台管理模板选型](/frontend/admin-templates)。

## 后台菜单不显示怎么办

常见原因：

- 登录成功但用户信息接口失败。
- token 没有带到后续请求。
- 当前用户没有角色或菜单权限。
- 后端菜单字段和前端路由转换规则不一致。
- 路由里配置了 `hidden`。
- 动态路由添加后没有重新跳转。

排查顺序：

1. 看登录接口返回。
2. 看 token 是否保存。
3. 看用户信息接口是否成功。
4. 看菜单接口是否返回数据。
5. 打印最终生成的路由表。

相关入口：

- [vue-element-admin 与 vue-admin-template](/frontend/vue-element-admin)
- [mall-admin-web](/frontend/mall-admin-web)
- [Geeker Admin](/frontend/geeker-admin)
- [iview-admin](/frontend/iview-admin)

## Element UI 或 Element Plus 样式异常

常见原因：

- 组件库版本和 Vue 版本不匹配。
- 样式文件没有引入。
- 按需引入插件配置不完整。
- 自定义主题覆盖顺序错误。
- 暗黑模式下只改了背景，文字颜色没有跟着改。

处理：

- Vue 2 项目用 Element UI。
- Vue 3 项目用 Element Plus。
- 检查样式入口。
- 不要混用两套组件库。

## 小程序真机和开发者工具不一致

常见原因：

- 开发者工具勾选了“不校验合法域名”。
- 真机基础库版本不同。
- 域名白名单没有配置。
- 权限、授权、支付、订阅消息只能在真机完整验证。
- H5 写法被带到小程序端。

相关入口：

- [微信小程序开发问题](/frontend/wechat-miniprogram-issues)
- [支付宝小程序开发问题](/frontend/alipay-miniprogram-issues)
- [抖音小程序开发问题](/frontend/douyin-miniprogram-issues)

## 为什么列表渲染要使用稳定标识

现象：

列表新增、删除或排序后，输入框内容、选中状态或局部组件状态错位。

原因：

前端框架需要通过 key 判断列表项身份。如果 key 不稳定，框架可能复用错误的节点。

解决：

优先使用业务 `id`。如果数据没有稳定 `id`，并且列表不会重排、插入或删除，可以使用 `index`。

## 文档页面应该放组件还是 Markdown

优先使用 Markdown。只有当页面需要复杂交互、特殊可视化或复用业务组件时，再引入 Vue 组件。

文档站的核心价值是内容可读、可搜索、可维护。过多交互会增加维护成本，也可能影响搜索引擎理解正文内容。

## 前端排查顺序

1. 浏览器 Console 第一条错误。
2. Network 里 JS、CSS、接口请求状态码。
3. 终端里 Vite 或构建工具报错。
4. 检查环境变量和接口 base URL。
5. 检查 alias、路径大小写和真实文件。
6. 清缓存，例如 `node_modules/.vite`。
7. 缩小到最小页面或最小组件。
