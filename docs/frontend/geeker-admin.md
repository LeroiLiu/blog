---
title: Geeker Admin
description: Geeker Admin 的 Vue 3、TypeScript、Vite、Pinia、Element Plus 技术栈、权限路由、接口代理、构建部署和常见问题。
---

# Geeker Admin

Geeker Admin 属于现代 Vue 后台模板，常见技术栈是 Vue 3、TypeScript、Vite、Pinia、Vue Router、Element Plus。它更适合新项目，也更适合想把老 Vue 2 后台逐步升级到 Vue 3 的团队学习结构。

## 适合什么场景

- 新后台管理系统。
- 想使用 Vue 3、TypeScript、Vite。
- 需要动态路由、权限菜单、暗黑模式、主题配置。
- 想用 Element Plus 维护中后台组件。

如果是已经稳定运行的 Vue 2 老项目，不建议直接整站替换。可以先独立新模块试点。

## 常见目录关注点

```text
src/
  api/
  assets/
  components/
  config/
  hooks/
  layouts/
  routers/
  stores/
  styles/
  utils/
  views/
```

维护时重点看：

- `src/routers/`：静态路由、动态路由、路由守卫。
- `src/stores/`：用户信息、权限、标签页、主题。
- `src/api/`：接口模块。
- `src/utils/`：axios、token、工具函数。
- `.env.*`：接口地址、部署路径、功能开关。

## 环境变量读取不到

报错或现象：

```text
import.meta.env.VITE_API_URL is undefined
```

处理：

- Vite 暴露给前端的变量必须使用 `VITE_` 前缀。
- 修改 `.env` 后要重启开发服务。
- 确认当前 mode 是 development、production 还是自定义 mode。

示例：

```text
VITE_API_URL=https://api.example.com
VITE_PUBLIC_PATH=/
```

代码里读取：

```ts
const apiUrl = import.meta.env.VITE_API_URL
```

## TypeScript 报 `ImportMeta`

报错：

```text
Property 'env' does not exist on type 'ImportMeta'
```

处理：

```ts
/// <reference types="vite/client" />
```

通常放在 `src/vite-env.d.ts`。

## 路径别名找不到

报错：

```text
Failed to resolve import "@/api/user"
```

常见原因：

- `vite.config.ts` 配了 alias，但 `tsconfig.json` 没配 paths。
- 文件大小写和导入路径不一致。
- 文件移动后 IDE 缓存没有更新。

`vite.config.ts` 示例：

```ts
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})
```

`tsconfig.json` 示例：

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

## 登录后菜单不显示

常见原因：

- 后端菜单字段和前端路由转换规则不一致。
- 用户信息接口没有返回权限。
- Pinia 状态刷新后丢失。
- 动态路由添加时机不对。
- 路由 `name` 重复。

排查：

1. 看登录接口。
2. 看用户信息接口。
3. 看菜单接口返回。
4. 打印最终路由表。
5. 刷新页面看权限状态是否恢复。

## Element Plus 图标或样式异常

常见报错：

```text
Failed to resolve component: ElIcon
```

或：

```text
Cannot find module '@element-plus/icons-vue'
```

处理：

- 确认安装 `element-plus` 和 `@element-plus/icons-vue`。
- 确认自动导入插件配置正确。
- 检查样式入口是否引入。
- 不要把 Element UI 和 Element Plus 混用。

## 开发环境接口正常，生产接口失败

常见原因：

- Vite proxy 只在本地开发生效。
- 生产环境没有 Nginx 反向代理。
- 生产 `.env.production` 接口地址不对。
- 后端 CORS 配置不完整。

处理方向：

- 本地开发用 proxy。
- 生产环境优先用同域 Nginx 代理。
- 确认前端请求地址和后端服务地址。

## 打包提示 chunk 过大

提示：

```text
Some chunks are larger than 500 kBs after minification
```

常见原因：

- 图表库、富文本、地图、Excel 导出等依赖过大。
- 所有页面都被同步导入。
- 路由没有懒加载。

处理：

- 路由页面使用动态导入。
- 大组件按需加载。
- 对图表、富文本、导出功能做分包。

## 部署路径

如果部署到域名根目录：

```ts
export default defineConfig({
  base: '/'
})
```

如果部署到 `/admin/`：

```ts
export default defineConfig({
  base: '/admin/'
})
```

Nginx 也要对应：

```nginx
location /admin/ {
  try_files $uri $uri/ /admin/index.html;
}
```

## 官方导航

- [Geeker Admin](https://github.com/HalseySpicy/Geeker-Admin)
- [Geeker Admin 文档](https://docs.spicyboy.cn/)
- [Vite 使用文档](/frontend/vite)
- [TypeScript 使用文档](/frontend/typescript)
