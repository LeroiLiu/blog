---
title: TypeScript 使用文档与常见问题
description: TypeScript 在前端项目中的 tsconfig、类型声明、路径别名、Vue/React 类型、第三方库类型、常见报错和排查方法整理。
---

TypeScript 的价值不是“让代码变复杂”，而是让项目在多人维护、接口变化、组件复用、重构时更容易发现问题。真正用好 TypeScript，要重点关注 `tsconfig.json`、类型边界、第三方库类型、路径别名、构建工具和编辑器状态。

## 项目里 TypeScript 负责什么

TypeScript 主要做两件事：

- 在开发阶段检查类型错误。
- 把 `.ts`、`.tsx` 编译成 JavaScript，或者交给 Vite、esbuild、Babel 等工具处理。

在 Vite 项目里，Vite 主要负责开发服务和打包，TypeScript 类型检查通常由 `vue-tsc`、`tsc --noEmit` 或 IDE 完成。

## 推荐基础配置

普通前端项目可以从下面配置开始：

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "jsx": "preserve",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "src/*"
      ]
    }
  },
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.vue",
    "env.d.ts"
  ]
}
```

说明：

| 配置 | 作用 |
| --- | --- |
| `strict` | 开启严格类型检查 |
| `noEmit` | 只检查类型，不输出文件 |
| `skipLibCheck` | 跳过依赖声明文件检查，加快检查速度 |
| `moduleResolution` | 控制模块解析方式，Vite 项目常用 `Bundler` |
| `paths` | 让 TypeScript 认识路径别名 |

`paths` 只让 TypeScript 和 IDE 认识别名，运行和打包还需要 Vite 也配置同样的 alias。

## 路径别名报错

报错：

```text
Cannot find module '@/utils/request' or its corresponding type declarations.
```

常见原因：

- `tsconfig.json` 配了 `paths`，但 `vite.config.ts` 没配 alias。
- `baseUrl` 没有配置。
- 文件路径大小写和实际文件不一致。
- `include` 没包含对应目录。
- IDE 没重新加载 TypeScript 服务。

直接处理：

`tsconfig.json`：

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

`vite.config.ts`：

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

排查方法：

- 确认 `src/utils/request.ts` 是否真的存在。
- 确认大小写是否一致，尤其是 macOS 开发、Linux 部署时。
- VS Code 执行 `TypeScript: Restart TS Server`。
- 运行 `npx tsc --noEmit --traceResolution` 查看解析过程。

## 找不到 `.vue` 模块

报错：

```text
Cannot find module './App.vue' or its corresponding type declarations.
```

常见原因：

- 缺少 Vue 文件声明。
- `env.d.ts` 没被 `tsconfig.json` include。
- Vue 插件或类型检查工具没有配置。

直接处理：

新建或检查 `env.d.ts`：

```ts
/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'

  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}
```

如果使用 Vue 3，建议类型检查用：

```sh
npx vue-tsc --noEmit
```

## `import.meta.env` 类型不存在

报错：

```text
Property 'env' does not exist on type 'ImportMeta'.
```

常见原因：

- 缺少 Vite 客户端类型。
- `env.d.ts` 没有被 TypeScript 包含。

直接处理：

`env.d.ts`：

```ts
/// <reference types="vite/client" />
```

自定义环境变量类型：

```ts
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_APP_NAME: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
```

注意：Vite 客户端环境变量默认只有 `VITE_` 前缀会暴露给前端。

## 环境变量是字符串

常见误区：

```ts
const pageSize = import.meta.env.VITE_PAGE_SIZE
```

即使 `.env` 写的是数字，前端拿到的也是字符串。

```text
VITE_PAGE_SIZE=20
VITE_ENABLE_MOCK=true
```

正确处理：

```ts
const pageSize = Number(import.meta.env.VITE_PAGE_SIZE || 20)
const enableMock = import.meta.env.VITE_ENABLE_MOCK === 'true'
```

## 第三方库没有类型声明

报错：

```text
Could not find a declaration file for module 'xxx'.
```

常见原因：

- 这个包没有自带类型。
- 没安装 `@types/xxx`。
- 包版本太旧。

处理顺序：

1. 先看包是否自带类型。
2. 再尝试安装 `@types`。
3. 最后自己写声明。

```sh
npm install -D @types/lodash
```

自定义声明 `src/types/xxx.d.ts`：

```ts
declare module 'legacy-sdk' {
  export function init(options: Record<string, unknown>): void
}
```

临时兜底：

```ts
declare module 'legacy-sdk'
```

不建议长期用空声明，因为它等于放弃这个包的类型检查。

## `Object is possibly 'undefined'`

报错：

```text
Object is possibly 'undefined'. ts(2532)
```

常见场景：

```ts
const name = user.profile.name
```

如果 `user.profile` 可能不存在，就会报错。

处理方法：

```ts
const name = user.profile?.name || ''
```

或者先做保护：

```ts
if (!user.profile) {
  return
}

const name = user.profile.name
```

不要一上来写：

```ts
const name = user.profile!.name
```

`!` 只是告诉 TypeScript “我保证有值”，运行时如果真的没有值，仍然会报错。

## `Type 'string | undefined' is not assignable to type 'string'`

报错：

```text
Type 'string | undefined' is not assignable to type 'string'.
```

常见原因：

- 函数要求 `string`，但传入值可能是 `undefined`。
- 接口字段声明成可选。
- 路由参数、表单值、环境变量没有做兜底。

处理：

```ts
function setToken(token: string) {
  localStorage.setItem('token', token)
}

const token = data.token

if (!token) {
  throw new Error('token is empty')
}

setToken(token)
```

如果业务允许空值，就改函数类型：

```ts
function setToken(token?: string) {
  if (!token) {
    return
  }

  localStorage.setItem('token', token)
}
```

## `Type 'null' is not assignable`

报错：

```text
Type 'null' is not assignable to type 'User'.
```

常见原因：

```ts
const user = ref<User>(null)
```

`User` 类型不包含 `null`。

正确写法：

```ts
const user = ref<User | null>(null)
```

使用时做判断：

```ts
if (!user.value) {
  return
}

console.log(user.value.name)
```

## `Parameter 'xxx' implicitly has an 'any' type`

报错：

```text
Parameter 'item' implicitly has an 'any' type.
```

常见原因：

- 开启了 `noImplicitAny` 或 `strict`。
- 函数参数没有写类型。

处理：

```ts
interface Product {
  id: number
  name: string
}

function formatProduct(item: Product) {
  return item.name
}
```

数组场景：

```ts
const list: Product[] = []

list.map(item => item.name)
```

## API 响应怎么定义类型

建议把接口响应类型放在 API 层，不要每个页面自己猜。

```ts
interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

interface User {
  id: number
  name: string
  phone: string
}

async function getUser(id: number): Promise<User> {
  const res = await request<ApiResponse<User>>('/user/detail', {
    id
  })

  return res.data
}
```

如果后端字段不稳定，先在接口层做转换：

```ts
function normalizeUser(raw: any): User {
  return {
    id: Number(raw.id),
    name: String(raw.name || ''),
    phone: String(raw.phone || '')
  }
}
```

## Vue props 类型怎么写

```vue
<script setup lang="ts">
interface Props {
  title: string
  count?: number
}

const props = withDefaults(defineProps<Props>(), {
  count: 0
})
</script>
```

事件类型：

```vue
<script setup lang="ts">
const emit = defineEmits<{
  save: [id: number]
  cancel: []
}>()

function submit() {
  emit('save', 10001)
}
</script>
```

## DOM ref 类型怎么写

```ts
const inputRef = ref<HTMLInputElement | null>(null)

function focusInput() {
  inputRef.value?.focus()
}
```

组件 ref：

```ts
import type UserDialog from './UserDialog.vue'

const dialogRef = ref<InstanceType<typeof UserDialog> | null>(null)
```

## `Cannot redeclare block-scoped variable`

报错：

```text
Cannot redeclare block-scoped variable 'name'.
```

常见原因：

- 文件没有任何 `import` 或 `export`，被 TypeScript 当成全局脚本。
- 变量名和全局变量冲突。

直接处理：

```ts
export {}

const name = 'Leroi'
```

更推荐改成有业务含义的变量名：

```ts
const userName = 'Leroi'
```

## `Cannot use JSX unless the '--jsx' flag is provided`

报错：

```text
Cannot use JSX unless the '--jsx' flag is provided.
```

处理：

React 项目：

```json
{
  "compilerOptions": {
    "jsx": "react-jsx"
  }
}
```

Vue 项目如果使用 TSX，需要额外确认 Vue JSX 插件和配置。

## `No inputs were found in config file`

报错：

```text
No inputs were found in config file 'tsconfig.json'.
```

常见原因：

- `include` 写错。
- 源码目录不是 `src`。
- 文件扩展名不在 include 范围。

处理：

```json
{
  "include": [
    "src/**/*.ts",
    "src/**/*.tsx",
    "src/**/*.vue",
    "env.d.ts"
  ]
}
```

## `skipLibCheck` 要不要开

普通业务项目可以开启 `skipLibCheck`，它能减少依赖声明文件带来的类型检查噪音和耗时。

但如果你在写基础库、组件库、SDK，最好更谨慎，因为依赖类型错误可能会影响对外类型质量。

## 什么时候不要用 `any`

可以临时用 `any`：

- 迁移老项目。
- 第三方 SDK 无类型。
- 后端字段暂时不稳定。

但建议把 `any` 限制在边界层：

```ts
function parseUser(raw: any): User {
  return {
    id: Number(raw.id),
    name: String(raw.name || '')
  }
}
```

页面和业务逻辑里尽量使用明确类型。

## 排查顺序

遇到 TypeScript 报错时，按这个顺序排：

1. 先看完整错误码和错误文本。
2. 确认报错文件是否在 `include` 范围内。
3. 确认 `tsconfig.json` 是否是当前项目真正使用的配置。
4. 检查路径别名是否在 TypeScript 和 Vite 同时配置。
5. 检查依赖是否有类型声明。
6. VS Code 重启 TS Server。
7. 用 `npx tsc --noEmit` 做一次纯类型检查。

## 官方入口

- TypeScript 文档：https://www.typescriptlang.org/docs/
- TSConfig 参考：https://www.typescriptlang.org/tsconfig/
- Vite 环境变量类型：https://vite.dev/guide/env-and-mode/
