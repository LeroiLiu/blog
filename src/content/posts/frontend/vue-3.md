---
title: Vue 3 常见问题
description: Vue 3 项目中 Composition API、setup、ref、reactive、Pinia、Vite、TypeScript 常见问题。
---

Vue 3 适合新项目，常搭配 Vite、Pinia、TypeScript 和 Element Plus。

## ref 和 reactive 怎么选

简单值使用 `ref`：

```js
const count = ref(0)
```

对象可以使用 `reactive`：

```js
const form = reactive({
  name: '',
  phone: ''
})
```

如果对象需要整体替换，使用 `ref` 更清晰：

```js
const user = ref(null)
user.value = data
```

## setup 里为什么没有 this

`setup` 执行时组件实例还没有完全创建，不使用 `this`。需要的数据和方法直接声明并返回，或使用 `<script setup>`。

```vue
<script setup>
  import { ref } from 'vue'
  
  const loading = ref(false)
</script>
```

## watch 监听 ref 为什么拿不到值

监听 ref 可以直接传 ref：

```js
watch(keyword, value => {
  console.log(value)
})
```

监听 reactive 的某个字段：

```js
watch(() => form.name, value => {
  console.log(value)
})
```

## Pinia 和 Vuex 怎么选

Vue 3 新项目优先 Pinia。Pinia 写法更轻，TypeScript 体验更好。

```js
export const useUserStore = defineStore('user', {
  state: () => ({
    token: ''
})
})
```

## Vite 环境变量不生效

Vite 客户端环境变量必须以 `VITE_` 开头：

```ini
VITE_API_BASE_URL=https://api.example.com
```

使用：

```js
import.meta.env.VITE_API_BASE_URL
```

修改 `.env` 后需要重启开发服务。

## TypeScript 报类型错误怎么办

不要一上来用 `any` 压掉所有错误。先给接口响应、表单、组件 props 建基础类型。

```php
interface User {
  id: number
  name: string
}
```

类型不确定时可以先从边界处收敛，例如 API 层和表单层。

## Vue 3 能不能继续用 Options API

可以。Vue 3 支持 Options API。老团队可以先保持 Options API，再在新组件里逐步使用 Composition API。
