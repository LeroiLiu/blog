---
title: Vue 2 与 Vue 3 项目维护、选型和迁移指南
description: 对比 Vue 2 与 Vue 3 的适用场景，整理响应式、组件通信、状态管理、TypeScript、Vite、Element UI 和渐进迁移常见问题。
excerpt: 对比 Vue 2 与 Vue 3 的适用场景，整理响应式、组件通信、状态管理、TypeScript、Vite、Element UI 和渐进迁移常见问题。
date: '2026-05-29T10:41:59'
categories:
  - 前端开发
tags:
  - Vue
  - Vue 2
  - Vue 3
  - 前端开发
  - Vite
---
<!-- more -->

Vue 2 常见于老后台、H5 和 webpack 工程，Vue 3 更适合搭配 Vite、Pinia、TypeScript 与 Element Plus 构建新项目。版本选择应结合现有业务、依赖兼容和团队迁移成本，而不是只看框架新旧。

## 版本选择

| 版本 | 适合场景 | 维护重点 |
| --- | --- | --- |
| Vue 2 | 老项目、Element UI 2.x、旧 webpack 工程 | 稳定维护、谨慎升级、控制依赖风险 |
| Vue 3 | 新后台、新 H5、Vite 和 TypeScript 项目 | 组合式 API、类型约束、现代构建工具 |

稳定且改动较少的 Vue 2 项目可以继续维护。仍会长期迭代的系统，应评估向 Vue 3 迁移的收益和成本。

## Vue 2 响应式限制

Vue 2 对对象新增属性存在响应式限制，可以使用：

```javascript
this.$set(this.form, 'name', 'Leroi')
this.$set(this.list, index, item)
```

对象深层字段变化需要开启 `deep`：

```javascript
watch: {
  form: {
    handler(value) {
      console.log(value)
    },
    deep: true
  }
}
```

深度监听会增加开销，大型表单应优先监听真正需要的字段。

## Vue 2 中的 this

不要在 `methods` 中使用箭头函数，否则 `this` 不会指向 Vue 实例。

```javascript
export default {
  methods: {
    save() {
      this.loading = true
    }
  }
}
```

## Vue 2 组件通信

父组件通过 props 传值：

```vue
<UserForm :user="user" />
```

子组件通过事件通知父组件：

```javascript
this.$emit('save', form)
```

复杂跨组件状态可以使用 Vuex，或提升到共同父组件管理。

## Vue 2 常见维护问题

Element UI 表单校验不生效时，检查 `el-form` 的 `model`、`el-form-item` 的 `prop` 和 rules 字段名是否一致。动态表单项还需要正确生成 `prop`。

webpack 构建较慢时，优先检查：

- 依赖和静态资源是否过大。
- source map 是否符合当前环境需要。
- Babel 是否编译了不必要的依赖。
- loader、webpack、Node.js 和 `node-sass` 版本是否兼容。

## Vue 3 中的 ref 与 reactive

简单值通常使用 `ref`：

```javascript
const count = ref(0)
```

结构稳定的对象可以使用 `reactive`：

```javascript
const form = reactive({
  name: '',
  phone: ''
})
```

如果对象需要整体替换，使用 `ref` 会更直接：

```javascript
const user = ref(null)
user.value = data
```

## setup 中为什么没有 this

`setup` 执行时组件实例尚未完整创建，不使用 `this`。数据和方法直接声明，模板可以通过 `<script setup>` 使用。

```vue
<script setup>
import { ref } from 'vue'

const loading = ref(false)
</script>
```

## Vue 3 watch 写法

监听 `ref` 可以直接传入变量：

```javascript
watch(keyword, value => {
  console.log(value)
})
```

监听 `reactive` 的某个字段时使用 getter：

```javascript
watch(() => form.name, value => {
  console.log(value)
})
```

## Pinia 与 Vuex

Vue 3 新项目通常优先使用 Pinia，它的写法更轻，TypeScript 体验也更好。

```javascript
export const useUserStore = defineStore('user', {
  state: () => ({
    token: ''
  })
})
```

已有 Vuex 项目不需要立即重写，可以先保持业务稳定，再按模块迁移。

## Vite 环境变量

暴露给客户端的 Vite 环境变量必须以 `VITE_` 开头：

```ini
VITE_API_BASE_URL=https://api.example.com
```

```javascript
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL
```

修改 `.env` 后需要重启开发服务。

## TypeScript 类型问题

不要直接用 `any` 隐藏所有错误。可以先为接口响应、表单和组件 props 建立基础类型：

```typescript
interface User {
  id: number
  name: string
}
```

类型暂时不完整时，优先从 API 和表单等系统边界开始收敛。

## Vue 3 仍然支持 Options API

Vue 3 可以继续使用 Options API。存量团队可以保留熟悉的写法，在新组件中逐步使用 Composition API，不需要一次性重写全部业务。

## Vue 2 到 Vue 3 迁移

| 项目 | 迁移重点 |
| --- | --- |
| UI 组件库 | Element UI 通常迁移到 Element Plus |
| 状态管理 | Vuex 可以逐步迁移到 Pinia |
| 构建工具 | webpack 项目可以评估迁移到 Vite |
| 组件写法 | Options API 可以保留，再逐步引入 Composition API |
| 第三方依赖 | 提前确认插件是否支持 Vue 3 |

迁移时先处理构建链和依赖兼容，再按页面或业务模块推进。登录、权限、动态路由、表单、上传和核心数据流应优先建立回归测试。

## 官方文档

- [Vue 3 文档](https://vuejs.org/)
- [Vue 2 文档](https://v2.vuejs.org/)
- [Vue 2 EOL 说明](https://v2.vuejs.org/eol/)
