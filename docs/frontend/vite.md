---
title: Vite 使用文档与常见问题
description: Vite 在 Vue、React 和普通前端项目中的安装、环境变量、路径别名、代理、base、打包、依赖预构建、HMR 和常见报错整理。
---

# Vite 使用文档与常见问题

Vite 是现代前端项目里常见的开发服务和构建工具。它开发时快，生产构建通常基于 Rollup。日常最容易出问题的地方是环境变量、路径别名、代理、base 路径、依赖预构建、CORS、HMR 和静态资源路径。

## Vite 负责什么

Vite 主要负责：

- 本地开发服务。
- 模块热更新。
- 静态资源处理。
- 环境变量加载。
- 生产构建。
- 依赖预构建。
- 插件系统。

TypeScript 类型检查通常不是 Vite 本身做的。Vue 项目一般配合 `vue-tsc`，普通 TS 项目可以配合 `tsc --noEmit`。

## 基础配置

```ts
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue()
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})
```

路径别名要同时配置 TypeScript：

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

## 环境变量不生效

报错或现象：

```text
import.meta.env.VITE_API_BASE_URL is undefined
```

常见原因：

- 变量没有 `VITE_` 前缀。
- `.env` 文件不在项目根目录。
- 修改 `.env` 后没有重启开发服务。
- 使用了错误的 mode。
- 写成了 `process.env`。

正确写法：

`.env.development`：

```text
VITE_API_BASE_URL=http://localhost:8000
VITE_APP_NAME=Leroi Docs
```

使用：

```ts
const apiBase = import.meta.env.VITE_API_BASE_URL
```

注意：

- Vite 暴露给客户端的自定义变量默认必须以 `VITE_` 开头。
- 环境变量值是字符串。
- `.env.production` 只会在对应 mode 下使用。

## `process is not defined`

报错：

```text
Uncaught ReferenceError: process is not defined
```

常见原因：

- 从 webpack 项目迁移过来，还在用 `process.env`。
- 某个依赖在浏览器端访问 Node.js 的 `process`。

直接处理：

把：

```ts
process.env.VUE_APP_API_BASE_URL
```

改为：

```ts
import.meta.env.VITE_API_BASE_URL
```

如果是依赖里使用 `process.env.NODE_ENV`，可以临时在 Vite 里 define：

```ts
export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
  }
})
```

不要把服务端密钥通过 define 注入到前端。

## 路径别名失效

报错：

```text
Failed to resolve import "@/components/AppHeader.vue"
```

常见原因：

- `vite.config.ts` 没配 alias。
- `tsconfig.json` 配了 alias，但 Vite 没配。
- 文件大小写不一致。
- 实际文件不存在。

处理：

```ts
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
```

排查：

- `rg --files src | rg AppHeader`
- 检查 import 路径大小写。
- 重启 Vite 开发服务。
- 重启 IDE TypeScript 服务。

## 页面部署后白屏

浏览器控制台常见报错：

```text
Failed to load module script: Expected a JavaScript module script but the server responded with a MIME type of "text/html".
```

或者：

```text
GET https://example.com/assets/index-xxx.js 404
```

常见原因：

- `base` 配置和部署路径不一致。
- SPA 路由没有 fallback 到 `index.html`。
- 静态资源被部署到错误目录。
- 服务器返回了 HTML 错误页，但浏览器按 JS 加载。

GitHub Pages 项目页常见配置：

```ts
export default defineConfig({
  base: '/repo-name/'
})
```

如果部署到域名根路径：

```ts
export default defineConfig({
  base: '/'
})
```

排查：

- 打开浏览器 Network，看 JS/CSS 是否 404。
- 看资源请求路径是否多了或少了仓库名。
- 直接访问 `dist/index.html` 不等于线上能正常运行，必须用 HTTP 服务预览。

## 本地打开 `dist/index.html` 报 CORS

报错：

```text
Access to script at 'file:///.../assets/index.js' from origin 'null' has been blocked by CORS policy.
```

原因：

生产构建后的文件不要用 `file://` 直接打开。ES Module、资源加载、路由等都需要 HTTP 环境。

处理：

```sh
npx vite preview
```

或者用任意静态 HTTP 服务预览 `dist`。

## 代理不生效

现象：

```text
GET http://localhost:5173/api/user 404
```

常见原因：

- 前端请求路径没有以 `/api` 开头。
- 代理只在开发环境生效，生产环境无效。
- 后端 target 地址错误。
- `rewrite` 写错。
- 后端接口本身返回 404。

配置：

```ts
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, '')
      }
    }
  }
})
```

前端请求：

```ts
fetch('/api/user')
```

排查：

- 直接访问后端真实地址是否正常。
- 看终端里 Vite 是否有代理请求日志。
- 用浏览器 Network 看请求是否仍然发到前端服务。
- 记住：生产环境要由 Nginx、后端网关或部署平台处理代理。

## 跨域 CORS 报错

浏览器报错：

```text
Access to XMLHttpRequest at 'https://api.example.com/user' from origin 'http://localhost:5173' has been blocked by CORS policy.
```

本地开发处理：

- 用 Vite proxy。
- 或让后端允许本地开发域名。

生产处理：

- 推荐前端和 API 走同域反向代理。
- 后端正确处理 `OPTIONS` 预检请求。
- 不要在前端加奇怪 header 增加预检复杂度。

## 依赖预构建报错

常见报错：

```text
The following dependencies are imported but could not be resolved
```

或者：

```text
Pre-bundling dependencies: ...
```

长期卡住或失败。

处理方法：

```sh
rm -rf node_modules/.vite
```

如果是 pnpm：

```sh
rm -rf node_modules/.vite .vite
```

然后重新启动开发服务。

也可以手动指定优化依赖：

```ts
export default defineConfig({
  optimizeDeps: {
    include: [
      'lodash-es'
    ],
    exclude: [
      'large-esm-only-package'
    ]
  }
})
```

不要随便把所有依赖都 include。先定位具体失败的包。

## CommonJS 依赖在浏览器报错

报错：

```text
Uncaught ReferenceError: require is not defined
```

常见原因：

- 依赖只支持 Node.js 或 CommonJS。
- 代码里直接写了 `require()`。
- 依赖访问了 `fs`、`path` 等 Node 模块。

处理：

- 换浏览器可用版本。
- 找 ESM 入口。
- 在服务端处理，不要放前端。
- 确认包的 `browser`、`module` 字段。

前端不要直接使用 Node 专属模块：

```ts
import fs from 'node:fs'
```

这种代码应该放到 Node 服务端、构建脚本或 Vite 插件里。

## HMR 不更新或频繁刷新

常见原因：

- 文件监听异常。
- Docker、虚拟机、网络盘里开发。
- 依赖或插件导致全量刷新。
- 组件状态写在模块外部，热更新后状态异常。

处理：

```ts
export default defineConfig({
  server: {
    watch: {
      usePolling: true
    }
  }
})
```

`usePolling` 会增加 CPU 占用，只在容器、虚拟机、共享目录场景下使用。

## PostCSS 或 Tailwind 配置不生效

常见原因：

- 配置文件格式和项目模块类型不匹配。
- Tailwind 版本和文档写法不一致。
- CSS 入口没引入。
- 插件顺序错误。

排查：

- 确认 `package.json` 是否 `"type": "module"`。
- CommonJS 配置可用 `.cjs`。
- Vite 5/6/7、Tailwind v3/v4 写法不同，先看当前项目版本。

## `global is not defined`

报错：

```text
Uncaught ReferenceError: global is not defined
```

常见原因：

- 浏览器端依赖假设存在 Node.js 的 `global`。

临时处理：

```ts
export default defineConfig({
  define: {
    global: 'globalThis'
  }
})
```

更推荐：换一个浏览器端兼容的包，或者把这段逻辑放到服务端。

## 图片路径打包后错误

常见错误写法：

```ts
const url = '/src/assets/logo.png'
```

推荐：

```ts
import logoUrl from '@/assets/logo.png'
```

或：

```ts
const logoUrl = new URL('../assets/logo.png', import.meta.url).href
```

公共静态资源放 `public`：

```text
public/logo.png
```

使用：

```html
<img src="/logo.png" alt="Logo">
```

注意 `public` 下的文件不会经过打包 hash 处理。

## 打包后 chunk 太大

提示：

```text
Some chunks are larger than 500 kBs after minification.
```

处理方向：

- 路由懒加载。
- 大型编辑器、图表、地图按需加载。
- 拆分 vendor chunk。
- 不要一次性引入完整图标库。

路由懒加载：

```ts
const UserPage = () => import('@/pages/user/index.vue')
```

手动分包：

```ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vue: ['vue', 'vue-router', 'pinia']
        }
      }
    }
  }
})
```

不要为了消除警告过度切包，先确认首屏加载是否真的慢。

## Vite 启动但外部设备访问不到

现象：

手机访问电脑 IP + 端口打不开。

处理：

```ts
export default defineConfig({
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})
```

排查：

- 电脑和手机是否在同一局域网。
- 防火墙是否拦截。
- 终端输出的 Network 地址是否正确。

## 431 Request Header Fields Too Large

报错：

```text
431 Request Header Fields Too Large
```

常见原因：

- Cookie 太大。
- 请求头太大。
- 代理或浏览器缓存了过大的 header。

处理：

- 清理当前站点 Cookie。
- 检查登录态是否把大量数据塞进 Cookie。
- 减少自定义 header。

## 排查顺序

遇到 Vite 问题时，按这个顺序：

1. 看浏览器 Console 的第一条错误。
2. 看 Network 里 JS、CSS、接口是否 404 或 CORS。
3. 看终端 Vite 报错。
4. 删除 `node_modules/.vite` 缓存。
5. 检查 `vite.config.ts`、`tsconfig.json`、`.env`。
6. 确认依赖版本和文档版本一致。
7. 把问题缩小到最小页面或最小依赖。

## 官方入口

- Vite 文档：https://vite.dev/guide/
- 环境变量与模式：https://vite.dev/guide/env-and-mode/
- 故障排除：https://vite.dev/guide/troubleshooting
